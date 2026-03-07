<?php

namespace App\Modules\Alertas\Services;

use App\Modules\Alertas\Jobs\DispatchAlertToDestinationJob;
use App\Modules\Alertas\Models\Alert;
use App\Modules\Alertas\Models\AlertDestination;
use App\Modules\Alertas\Models\AlertDispatchLog;
use App\Modules\Alertas\Models\AlertDispatchRun;
use App\Modules\Alertas\Models\AlertScheduleRule;
use App\Modules\WhatsApp\Exceptions\WhatsAppProviderException;
use App\Modules\WhatsApp\Services\WhatsAppService;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class AlertDispatchService
{
    public function __construct(
        private readonly WhatsAppService $whatsAppService
    ) {
    }

    public function dispatchDue(?CarbonImmutable $reference = null): int
    {
        $timezone = (string) config('alertas.timezone', config('app.timezone', 'UTC'));
        $minute = ($reference ?? CarbonImmutable::now($timezone))->setTimezone($timezone)->startOfMinute();
        $time = $minute->format('H:i');

        $rules = AlertScheduleRule::query()
            ->with([
                'alert' => fn($query) => $query->active()->with([
                    'destinations' => fn($destinationQuery) => $destinationQuery->active(),
                ]),
            ])
            ->active()
            ->where('time_hhmm', $time)
            ->where(function ($query) use ($minute): void {
                $query->where(function ($weekly) use ($minute): void {
                    $weekly->where('schedule_type', AlertScheduleRule::TYPE_WEEKLY)
                        ->where('day_of_week', $minute->dayOfWeek);
                })->orWhere(function ($specific) use ($minute): void {
                    $specific->where('schedule_type', AlertScheduleRule::TYPE_SPECIFIC_DATE)
                        ->whereDate('specific_date', $minute->toDateString());
                });
            })
            ->get();

        $createdRuns = 0;

        foreach ($rules as $rule) {
            if ($rule->alert === null) {
                continue;
            }

            $run = $this->createDispatchRun(
                alert: $rule->alert,
                destinations: $rule->alert->destinations,
                triggerType: AlertDispatchRun::TRIGGER_SCHEDULER,
                scheduledFor: $minute,
                scheduleRule: $rule,
                sourceLog: null,
                sourceContext: [
                    'reason' => 'scheduler_due',
                    'reference_minute' => $minute->toIso8601String(),
                ],
                createdBy: null
            );

            if ($run !== null) {
                $createdRuns++;
            }
        }

        return $createdRuns;
    }

    public function dispatchManual(Alert $alert, ?int $userId = null): ?AlertDispatchRun
    {
        $alert->load([
            'destinations' => fn($query) => $query->active(),
        ]);

        return $this->createDispatchRun(
            alert: $alert,
            destinations: $alert->destinations,
            triggerType: AlertDispatchRun::TRIGGER_MANUAL,
            scheduledFor: CarbonImmutable::now((string) config('alertas.timezone', config('app.timezone', 'UTC')))->startOfMinute(),
            scheduleRule: null,
            sourceLog: null,
            sourceContext: [
                'reason' => 'manual_send',
                'requested_by' => $userId,
            ],
            createdBy: $userId
        );
    }

    public function retryLog(AlertDispatchLog $log, ?int $userId = null): ?AlertDispatchRun
    {
        $log->loadMissing(['alert', 'destination']);

        if ($log->alert === null || $log->destination === null) {
            throw new RuntimeException('Log de envio invalido para retry');
        }

        return $this->createDispatchRun(
            alert: $log->alert,
            destinations: collect([$log->destination]),
            triggerType: AlertDispatchRun::TRIGGER_RETRY,
            scheduledFor: CarbonImmutable::now((string) config('alertas.timezone', config('app.timezone', 'UTC')))->startOfMinute(),
            scheduleRule: null,
            sourceLog: $log,
            sourceContext: [
                'reason' => 'manual_retry',
                'retry_log_id' => $log->id,
                'requested_by' => $userId,
            ],
            createdBy: $userId
        );
    }

    public function dispatchRunToDestination(string $runId, int $destinationId): void
    {
        $run = AlertDispatchRun::query()->with('alert')->find($runId);
        $destination = AlertDestination::query()->find($destinationId);

        if ($run === null || $destination === null || $run->alert === null) {
            return;
        }

        $reserved = DB::transaction(function () use ($run, $destination): ?AlertDispatchLog {
            $lockedRun = AlertDispatchRun::query()->lockForUpdate()->find($run->id);
            if ($lockedRun === null) {
                return null;
            }

            $existing = AlertDispatchLog::query()
                ->where('dispatch_run_id', $run->id)
                ->where('destination_id', $destination->id)
                ->first();

            if ($existing !== null) {
                return null;
            }

            return AlertDispatchLog::query()->create([
                'dispatch_run_id' => $run->id,
                'alert_id' => $run->alert_id,
                'destination_id' => $destination->id,
                'alert_title_snapshot' => $run->alert->title,
                'destination_name_snapshot' => $destination->name,
                'target_kind' => $destination->target_kind,
                'target_value' => $destination->target_value,
                'message_snapshot' => $run->alert->message,
                'status' => AlertDispatchLog::STATUS_PENDING,
                'provider' => 'zapi',
            ]);
        });

        if ($reserved === null) {
            return;
        }

        if ($run->status === AlertDispatchRun::STATUS_CANCELLED) {
            $this->markLogTerminal($reserved, AlertDispatchLog::STATUS_CANCELLED, 'Execucao cancelada antes do envio');
            $this->refreshRunStatus($run->id);
            return;
        }

        if ($run->alert->archived_at !== null || $destination->archived_at !== null || !$destination->active) {
            $this->markLogTerminal($reserved, AlertDispatchLog::STATUS_SKIPPED, 'Destino ou alerta indisponivel no momento do envio');
            $this->refreshRunStatus($run->id);
            return;
        }

        try {
            $response = $this->whatsAppService->sendText($destination->target_value, $run->alert->message);

            $reserved->forceFill([
                'status' => AlertDispatchLog::STATUS_SUCCESS,
                'provider_zaap_id' => $response['zaapId'] ?? null,
                'provider_message_id' => $response['messageId'] ?? null,
                'provider_response_id' => $response['id'] ?? null,
                'provider_response' => $response,
                'sent_at' => now((string) config('alertas.timezone', config('app.timezone', 'UTC'))),
                'error_message' => null,
            ])->save();

            $destination->forceFill([
                'last_sent_at' => now((string) config('alertas.timezone', config('app.timezone', 'UTC'))),
            ])->save();
        } catch (WhatsAppProviderException $e) {
            $reserved->forceFill([
                'status' => AlertDispatchLog::STATUS_FAILED,
                'provider_status_code' => $e->status(),
                'provider_response' => $e->responseBody(),
                'error_message' => $e->getMessage(),
            ])->save();
        } catch (Throwable $e) {
            report($e);

            $reserved->forceFill([
                'status' => AlertDispatchLog::STATUS_FAILED,
                'error_message' => $e->getMessage(),
            ])->save();
        } finally {
            $this->refreshRunStatus($run->id);
        }
    }

    public function refreshRunStatus(string $dispatchRunId): ?AlertDispatchRun
    {
        return DB::transaction(function () use ($dispatchRunId): ?AlertDispatchRun {
            $run = AlertDispatchRun::query()->lockForUpdate()->find($dispatchRunId);
            if ($run === null) {
                return null;
            }

            $logs = AlertDispatchLog::query()
                ->where('dispatch_run_id', $dispatchRunId)
                ->get();

            $pendingCount = $logs->where('status', AlertDispatchLog::STATUS_PENDING)->count();
            $successCount = $logs->where('status', AlertDispatchLog::STATUS_SUCCESS)->count();
            $failedCount = $logs->whereIn('status', [
                AlertDispatchLog::STATUS_FAILED,
                AlertDispatchLog::STATUS_CANCELLED,
                AlertDispatchLog::STATUS_SKIPPED,
            ])->count();

            $status = $run->status;
            $finishedAt = null;

            if ($pendingCount > 0 || $logs->count() < $run->destinations_total) {
                $status = AlertDispatchRun::STATUS_PROCESSING;
            } elseif ($successCount === $run->destinations_total) {
                $status = AlertDispatchRun::STATUS_SUCCESS;
                $finishedAt = now((string) config('alertas.timezone', config('app.timezone', 'UTC')));
            } elseif ($failedCount === $run->destinations_total) {
                $status = AlertDispatchRun::STATUS_FAILED;
                $finishedAt = now((string) config('alertas.timezone', config('app.timezone', 'UTC')));
            } else {
                $status = AlertDispatchRun::STATUS_PARTIAL;
                $finishedAt = now((string) config('alertas.timezone', config('app.timezone', 'UTC')));
            }

            $run->forceFill([
                'status' => $status,
                'destinations_success' => $successCount,
                'destinations_failed' => $failedCount,
                'finished_at' => $finishedAt,
            ])->save();

            return $run->fresh('logs');
        });
    }

    private function createDispatchRun(
        Alert $alert,
        Collection $destinations,
        string $triggerType,
        CarbonImmutable $scheduledFor,
        ?AlertScheduleRule $scheduleRule,
        ?AlertDispatchLog $sourceLog,
        array $sourceContext,
        ?int $createdBy
    ): ?AlertDispatchRun {
        $operationalDestinations = $destinations
            ->filter(fn($destination) => $destination instanceof AlertDestination)
            ->filter(fn(AlertDestination $destination) => $destination->archived_at === null && $destination->active)
            ->values();

        if ($operationalDestinations->isEmpty()) {
            logger()->info('Alerta ignorado por falta de destinos ativos', [
                'alert_id' => $alert->id,
                'trigger_type' => $triggerType,
            ]);

            return null;
        }

        $idempotencyKey = $this->buildIdempotencyKey($triggerType, $alert, $scheduleRule, $sourceLog, $scheduledFor);

        try {
            $run = AlertDispatchRun::query()->create([
                'alert_id' => $alert->id,
                'schedule_rule_id' => $scheduleRule?->id,
                'trigger_type' => $triggerType,
                'source_log_id' => $sourceLog?->id,
                'source_context' => $sourceContext,
                'scheduled_for' => $scheduledFor,
                'idempotency_key' => $idempotencyKey,
                'status' => AlertDispatchRun::STATUS_PROCESSING,
                'destinations_total' => $operationalDestinations->count(),
                'destinations_success' => 0,
                'destinations_failed' => 0,
                'started_at' => now((string) config('alertas.timezone', config('app.timezone', 'UTC'))),
                'created_by' => $createdBy,
            ]);
        } catch (QueryException $e) {
            if ($this->isUniqueViolation($e)) {
                return null;
            }

            throw $e;
        }

        foreach ($operationalDestinations as $destination) {
            $job = new DispatchAlertToDestinationJob($run->id, $destination->id);
            $queue = trim((string) config('alertas.queue', 'default'));
            if ($queue !== '') {
                $job->onQueue($queue);
            }

            dispatch($job);
        }

        return $run->fresh(['alert', 'logs']);
    }

    private function buildIdempotencyKey(
        string $triggerType,
        Alert $alert,
        ?AlertScheduleRule $scheduleRule,
        ?AlertDispatchLog $sourceLog,
        CarbonImmutable $scheduledFor
    ): string {
        return match ($triggerType) {
            AlertDispatchRun::TRIGGER_SCHEDULER => sprintf(
                'scheduler:alert-%d:rule-%d:%s',
                $alert->id,
                $scheduleRule?->id,
                $scheduledFor->toIso8601String()
            ),
            AlertDispatchRun::TRIGGER_RETRY => sprintf(
                'retry:log-%s:%s',
                $sourceLog?->id,
                Str::ulid()
            ),
            default => sprintf('manual:alert-%d:%s', $alert->id, Str::ulid()),
        };
    }

    private function isUniqueViolation(QueryException $e): bool
    {
        return in_array((string) $e->getCode(), ['23000', '23505', '19'], true);
    }

    private function markLogTerminal(AlertDispatchLog $log, string $status, string $errorMessage): void
    {
        $log->forceFill([
            'status' => $status,
            'error_message' => $errorMessage,
        ])->save();
    }
}
