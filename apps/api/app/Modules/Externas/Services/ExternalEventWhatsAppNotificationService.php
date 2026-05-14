<?php

namespace App\Modules\Externas\Services;

use App\Models\User;
use App\Modules\Externas\Jobs\SendExternalEventWhatsAppNotificationJob;
use App\Modules\Externas\Models\ExternalEvent;
use App\Modules\Externas\Models\ExternalEventWhatsAppNotification;
use App\Modules\Externas\Support\ExternalEventDateTime;
use App\Modules\Externas\Support\ExternalEventWhatsAppMessageBuilder;
use App\Modules\WhatsApp\Exceptions\WhatsAppProviderException;
use App\Modules\WhatsApp\Services\WhatsAppService;
use App\Modules\WhatsApp\Support\WhatsAppTargetNormalizer;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class ExternalEventWhatsAppNotificationService
{
    public function __construct(
        private readonly WhatsAppTargetNormalizer $targetNormalizer,
        private readonly ExternalEventWhatsAppMessageBuilder $messageBuilder,
        private readonly WhatsAppService $whatsAppService
    ) {}

    public function handleEventCreated(ExternalEvent $event): void
    {
        if (! $this->notificationsTableExists()) {
            return;
        }

        $event->loadMissing('collaborators');

        $this->createForEvent($event, ExternalEventWhatsAppNotification::TRIGGER_CREATED, $this->nowUtc(), true);
        $this->scheduleTwoHourReminder($event);
    }

    public function handleEventStartChanged(ExternalEvent $event, mixed $oldStart): void
    {
        if (! $this->notificationsTableExists()) {
            return;
        }

        $event->loadMissing('collaborators');

        $this->cancelPendingTwoHourReminders($event, sprintf(
            'Data alterada de %s para %s',
            ExternalEventDateTime::toUtcCarbon($oldStart)?->toIso8601String() ?? 'null',
            ExternalEventDateTime::toUtcCarbon($event->data_hora)?->toIso8601String() ?? 'null'
        ));

        $this->createForEvent($event, ExternalEventWhatsAppNotification::TRIGGER_DATE_CHANGED, $this->nowUtc(), true);
        $this->scheduleTwoHourReminder($event);
    }

    public function cancelPendingForEvent(ExternalEvent $event, string $reason): int
    {
        if (! $this->notificationsTableExists()) {
            return 0;
        }

        return ExternalEventWhatsAppNotification::query()
            ->where('external_event_id', $event->id)
            ->where('status', ExternalEventWhatsAppNotification::STATUS_PENDING)
            ->update([
                'status' => ExternalEventWhatsAppNotification::STATUS_CANCELLED,
                'error_message' => $reason,
                'updated_at' => now(),
            ]);
    }

    public function dispatchDue(?CarbonImmutable $reference = null, ?int $limit = null): int
    {
        if (! $this->notificationsTableExists()) {
            return 0;
        }

        $dueAt = ($reference ?? $this->nowUtc())->setTimezone('UTC')->startOfMinute();
        $batchLimit = $limit ?? max(1, (int) config('externas.whatsapp_due_batch_limit', 200));

        $notifications = ExternalEventWhatsAppNotification::query()
            ->where('status', ExternalEventWhatsAppNotification::STATUS_PENDING)
            ->where('scheduled_for', '<=', $dueAt->format('Y-m-d H:i:s'))
            ->orderBy('scheduled_for')
            ->orderBy('id')
            ->limit($batchLimit)
            ->get();

        foreach ($notifications as $notification) {
            $this->dispatchNotification($notification);
        }

        return $notifications->count();
    }

    public function sendNotification(string $notificationId): void
    {
        if (! $this->notificationsTableExists()) {
            return;
        }

        $notification = ExternalEventWhatsAppNotification::query()->find($notificationId);

        if ($notification === null || $notification->status !== ExternalEventWhatsAppNotification::STATUS_PENDING) {
            return;
        }

        $reserved = DB::transaction(function () use ($notification): ?ExternalEventWhatsAppNotification {
            $locked = ExternalEventWhatsAppNotification::query()->lockForUpdate()->find($notification->id);

            if ($locked === null || $locked->status !== ExternalEventWhatsAppNotification::STATUS_PENDING) {
                return null;
            }

            $locked->forceFill([
                'status' => ExternalEventWhatsAppNotification::STATUS_PROCESSING,
            ])->save();

            return $locked;
        });

        if ($reserved === null) {
            return;
        }

        try {
            $response = $this->whatsAppService->sendText($reserved->target_value, $reserved->message_snapshot);

            $reserved->forceFill([
                'status' => ExternalEventWhatsAppNotification::STATUS_SUCCESS,
                'provider_zaap_id' => $response['zaapId'] ?? null,
                'provider_message_id' => $response['messageId'] ?? null,
                'provider_response_id' => $response['id'] ?? null,
                'provider_response' => $response,
                'sent_at' => now((string) config('externas.timezone', ExternalEventDateTime::LOCAL_TIMEZONE)),
                'error_message' => null,
            ])->save();
        } catch (WhatsAppProviderException $e) {
            $reserved->forceFill([
                'status' => ExternalEventWhatsAppNotification::STATUS_FAILED,
                'provider_status_code' => $e->status(),
                'provider_response' => $e->responseBody(),
                'error_message' => $e->getMessage(),
            ])->save();
        } catch (Throwable $e) {
            report($e);

            $reserved->forceFill([
                'status' => ExternalEventWhatsAppNotification::STATUS_FAILED,
                'error_message' => $e->getMessage(),
            ])->save();
        }
    }

    private function scheduleTwoHourReminder(ExternalEvent $event): void
    {
        $start = $this->eventStartUtc($event);
        if ($start === null) {
            return;
        }

        $scheduledFor = $start->subHours(2);

        if ($scheduledFor->lessThanOrEqualTo($this->nowUtc())) {
            $this->createForEvent(
                event: $event,
                triggerType: ExternalEventWhatsAppNotification::TRIGGER_TWO_HOURS_BEFORE,
                scheduledFor: $scheduledFor,
                dispatchNow: false,
                forceStatus: ExternalEventWhatsAppNotification::STATUS_SKIPPED,
                errorMessage: 'two_hour_window_already_passed'
            );

            return;
        }

        $this->createForEvent(
            event: $event,
            triggerType: ExternalEventWhatsAppNotification::TRIGGER_TWO_HOURS_BEFORE,
            scheduledFor: $scheduledFor,
            dispatchNow: false
        );
    }

    private function createForEvent(
        ExternalEvent $event,
        string $triggerType,
        CarbonImmutable $scheduledFor,
        bool $dispatchNow,
        ?string $forceStatus = null,
        ?string $errorMessage = null
    ): void {
        $event->loadMissing('collaborators');

        foreach ($event->collaborators as $collaborator) {
            $notification = $this->createForCollaborator(
                event: $event,
                collaborator: $collaborator,
                triggerType: $triggerType,
                scheduledFor: $scheduledFor,
                forceStatus: $forceStatus,
                errorMessage: $errorMessage
            );

            if ($dispatchNow && $notification !== null && $notification->status === ExternalEventWhatsAppNotification::STATUS_PENDING) {
                $this->dispatchNotification($notification);
            }
        }

        foreach ($this->defaultTargets() as $target) {
            $notification = $this->createForDefaultTarget(
                event: $event,
                targetValue: $target,
                triggerType: $triggerType,
                scheduledFor: $scheduledFor,
                forceStatus: $forceStatus,
                errorMessage: $errorMessage
            );

            if ($dispatchNow && $notification !== null && $notification->status === ExternalEventWhatsAppNotification::STATUS_PENDING) {
                $this->dispatchNotification($notification);
            }
        }
    }

    private function createForCollaborator(
        ExternalEvent $event,
        User $collaborator,
        string $triggerType,
        CarbonImmutable $scheduledFor,
        ?string $forceStatus = null,
        ?string $errorMessage = null
    ): ?ExternalEventWhatsAppNotification {
        $phone = trim((string) ($collaborator->phone ?? ''));

        if ($phone === '') {
            return $this->createSkippedNotification(
                event: $event,
                triggerType: $triggerType,
                recipientType: ExternalEventWhatsAppNotification::RECIPIENT_COLLABORATOR,
                scheduledFor: $scheduledFor,
                message: $this->messageBuilder->collaboratorMessage($event, $collaborator, $triggerType),
                idempotencyTarget: 'user-'.$collaborator->id,
                errorMessage: 'Colaborador sem telefone cadastrado',
                recipientUserId: $collaborator->id,
                recipientName: $collaborator->name,
                recipientRole: $this->messageBuilder->collaboratorRole($collaborator)
            );
        }

        try {
            $target = $this->targetNormalizer->normalizeWithKind($phone);
        } catch (Throwable $e) {
            return $this->createSkippedNotification(
                event: $event,
                triggerType: $triggerType,
                recipientType: ExternalEventWhatsAppNotification::RECIPIENT_COLLABORATOR,
                scheduledFor: $scheduledFor,
                message: $this->messageBuilder->collaboratorMessage($event, $collaborator, $triggerType),
                idempotencyTarget: 'user-'.$collaborator->id,
                errorMessage: $e->getMessage(),
                recipientUserId: $collaborator->id,
                recipientName: $collaborator->name,
                recipientRole: $this->messageBuilder->collaboratorRole($collaborator)
            );
        }

        return $this->createNotification([
            'external_event_id' => $event->id,
            'trigger_type' => $triggerType,
            'recipient_type' => ExternalEventWhatsAppNotification::RECIPIENT_COLLABORATOR,
            'recipient_user_id' => $collaborator->id,
            'recipient_name_snapshot' => $collaborator->name,
            'recipient_role_snapshot' => $this->messageBuilder->collaboratorRole($collaborator),
            'target_kind' => $target['target_kind'],
            'target_value' => $target['target_value'],
            'message_snapshot' => $this->messageBuilder->collaboratorMessage($event, $collaborator, $triggerType),
            'event_title_snapshot' => $event->titulo,
            'event_start_snapshot' => $this->eventStartString($event),
            'scheduled_for' => $scheduledFor->format('Y-m-d H:i:s'),
            'status' => $forceStatus ?? ExternalEventWhatsAppNotification::STATUS_PENDING,
            'idempotency_key' => $this->idempotencyKey($event, $triggerType, $scheduledFor, 'collaborator', (string) $collaborator->id),
            'provider' => 'zapi',
            'error_message' => $errorMessage,
        ]);
    }

    private function createForDefaultTarget(
        ExternalEvent $event,
        string $targetValue,
        string $triggerType,
        CarbonImmutable $scheduledFor,
        ?string $forceStatus = null,
        ?string $errorMessage = null
    ): ?ExternalEventWhatsAppNotification {
        try {
            $target = $this->targetNormalizer->normalizeWithKind($targetValue);
        } catch (Throwable $e) {
            $target = [
                'target_kind' => WhatsAppTargetNormalizer::KIND_GROUP,
                'target_value' => $targetValue,
            ];
            $forceStatus = ExternalEventWhatsAppNotification::STATUS_FAILED;
            $errorMessage = $e->getMessage();
        }

        return $this->createNotification([
            'external_event_id' => $event->id,
            'trigger_type' => $triggerType,
            'recipient_type' => ExternalEventWhatsAppNotification::RECIPIENT_DEFAULT_TARGET,
            'recipient_user_id' => null,
            'recipient_name_snapshot' => 'Destino padrao Externas',
            'recipient_role_snapshot' => null,
            'target_kind' => $target['target_kind'],
            'target_value' => $target['target_value'],
            'message_snapshot' => $this->messageBuilder->defaultTargetMessage($event, $triggerType),
            'event_title_snapshot' => $event->titulo,
            'event_start_snapshot' => $this->eventStartString($event),
            'scheduled_for' => $scheduledFor->format('Y-m-d H:i:s'),
            'status' => $forceStatus ?? ExternalEventWhatsAppNotification::STATUS_PENDING,
            'idempotency_key' => $this->idempotencyKey($event, $triggerType, $scheduledFor, 'default_target', $targetValue),
            'provider' => 'zapi',
            'error_message' => $errorMessage,
        ]);
    }

    private function createSkippedNotification(
        ExternalEvent $event,
        string $triggerType,
        string $recipientType,
        CarbonImmutable $scheduledFor,
        string $message,
        string $idempotencyTarget,
        string $errorMessage,
        ?int $recipientUserId = null,
        ?string $recipientName = null,
        ?string $recipientRole = null
    ): ?ExternalEventWhatsAppNotification {
        return $this->createNotification([
            'external_event_id' => $event->id,
            'trigger_type' => $triggerType,
            'recipient_type' => $recipientType,
            'recipient_user_id' => $recipientUserId,
            'recipient_name_snapshot' => $recipientName,
            'recipient_role_snapshot' => $recipientRole,
            'target_kind' => WhatsAppTargetNormalizer::KIND_PHONE,
            'target_value' => '',
            'message_snapshot' => $message,
            'event_title_snapshot' => $event->titulo,
            'event_start_snapshot' => $this->eventStartString($event),
            'scheduled_for' => $scheduledFor->format('Y-m-d H:i:s'),
            'status' => ExternalEventWhatsAppNotification::STATUS_SKIPPED,
            'idempotency_key' => $this->idempotencyKey($event, $triggerType, $scheduledFor, $recipientType, $idempotencyTarget),
            'provider' => 'zapi',
            'error_message' => $errorMessage,
        ]);
    }

    private function createNotification(array $attributes): ?ExternalEventWhatsAppNotification
    {
        try {
            return ExternalEventWhatsAppNotification::query()->create($attributes);
        } catch (QueryException $e) {
            if (in_array((string) $e->getCode(), ['23000', '23505', '19'], true)) {
                return ExternalEventWhatsAppNotification::query()
                    ->where('idempotency_key', $attributes['idempotency_key'])
                    ->first();
            }

            throw $e;
        }
    }

    private function cancelPendingTwoHourReminders(ExternalEvent $event, string $reason): void
    {
        ExternalEventWhatsAppNotification::query()
            ->where('external_event_id', $event->id)
            ->where('trigger_type', ExternalEventWhatsAppNotification::TRIGGER_TWO_HOURS_BEFORE)
            ->where('status', ExternalEventWhatsAppNotification::STATUS_PENDING)
            ->update([
                'status' => ExternalEventWhatsAppNotification::STATUS_CANCELLED,
                'error_message' => $reason,
                'updated_at' => now(),
            ]);
    }

    private function dispatchNotification(ExternalEventWhatsAppNotification $notification): void
    {
        $job = new SendExternalEventWhatsAppNotificationJob($notification->id);
        $queue = trim((string) config('externas.whatsapp_queue', 'default'));

        if ($queue !== '') {
            $job->onQueue($queue);
        }

        dispatch($job);
    }

    private function defaultTargets(): array
    {
        return collect(config('externas.whatsapp_default_targets', []))
            ->map(fn ($target) => trim((string) $target))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function idempotencyKey(
        ExternalEvent $event,
        string $triggerType,
        CarbonImmutable $scheduledFor,
        string $recipientType,
        string $target
    ): string {
        $scheduledKey = $scheduledFor;
        $eventVersion = $triggerType === ExternalEventWhatsAppNotification::TRIGGER_CREATED
            ? ($event->created_at?->timestamp ?? $event->id)
            : ($event->updated_at?->timestamp ?? $event->id);

        if ($triggerType === ExternalEventWhatsAppNotification::TRIGGER_CREATED && $event->created_at !== null) {
            $scheduledKey = CarbonImmutable::parse($event->created_at)->setTimezone('UTC');
        }

        return sprintf(
            'externas:%d:%s:%s:%s:%s:%s',
            $event->id,
            $triggerType,
            $scheduledKey->toIso8601String(),
            $recipientType,
            sha1($target),
            $eventVersion
        );
    }

    private function eventStartString(ExternalEvent $event): ?string
    {
        return $this->eventStartUtc($event)?->format('Y-m-d H:i:s');
    }

    private function eventStartUtc(ExternalEvent $event): ?CarbonImmutable
    {
        $raw = $event->getRawOriginal('data_hora');

        if (is_string($raw) && trim($raw) !== '') {
            return CarbonImmutable::parse($raw, 'UTC');
        }

        return ExternalEventDateTime::toUtcCarbon($event->data_hora);
    }

    private function nowUtc(): CarbonImmutable
    {
        $timezone = (string) config('externas.timezone', ExternalEventDateTime::LOCAL_TIMEZONE);

        return CarbonImmutable::now($timezone)->setTimezone('UTC');
    }

    private function notificationsTableExists(): bool
    {
        return Schema::hasTable('external_event_whatsapp_notifications');
    }
}
