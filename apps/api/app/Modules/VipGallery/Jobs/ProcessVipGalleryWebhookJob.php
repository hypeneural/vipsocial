<?php

namespace App\Modules\VipGallery\Jobs;

use App\Modules\Externas\Models\ExternalEvent;
use App\Modules\VipGallery\Models\VipGalleryPhoto;
use App\Modules\VipGallery\Models\VipGalleryWebhookLog;
use App\Modules\VipGallery\Support\VipGalleryEventResolver;
use App\Modules\VipGallery\Support\ZApiGalleryPayload;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessVipGalleryWebhookJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(
        public readonly int $logId
    ) {}

    public function handle(VipGalleryEventResolver $resolver): void
    {
        $log = VipGalleryWebhookLog::query()->find($this->logId);

        if (! $log) {
            return;
        }

        $payload = is_array($log->payload_json) ? $log->payload_json : [];
        $messageId = ZApiGalleryPayload::messageId($payload);
        $groupId = ZApiGalleryPayload::groupId($payload);
        $detectedType = ZApiGalleryPayload::detectedType($payload);

        $log->forceFill([
            'message_id' => $messageId,
            'phone' => $groupId,
            'detected_type' => $detectedType,
            'routing_status' => 'processing',
            'error_message' => null,
        ])->save();

        if (! $messageId || ! $groupId) {
            $log->update([
                'routing_status' => 'invalid_payload',
                'error_message' => 'Payload sem message_id ou whatsapp_group_id identificavel',
            ]);

            return;
        }

        $event = $resolver->resolveActiveByGroupId($groupId);

        if (! $event) {
            $log->update([
                'routing_status' => 'ignored_no_event',
                'error_message' => 'Nenhum evento VIP ativo encontrado para o grupo informado',
            ]);

            return;
        }

        if ($detectedType === VipGalleryWebhookLog::TYPE_IMAGE) {
            $this->queueImageIngest($log, $messageId, $event->id);

            return;
        }

        if ($detectedType === VipGalleryWebhookLog::TYPE_TEXT_COMMAND) {
            $this->queueDeleteCommand($log, $payload, $event);

            return;
        }

        $log->update([
            'routing_status' => 'ignored_unsupported',
            'error_message' => 'Payload recebido nao representa uma imagem suportada',
        ]);
    }

    private function queueImageIngest(VipGalleryWebhookLog $log, string $messageId, int $eventId): void
    {
        if (VipGalleryPhoto::withTrashed()->where('zapi_message_id', $messageId)->exists()) {
            $log->update([
                'routing_status' => 'ignored_duplicate',
                'error_message' => 'Mensagem ja processada anteriormente',
            ]);

            return;
        }

        IngestVipGalleryImageJob::dispatch($log->id, $eventId)
            ->onQueue((string) config('vip_gallery.queues.processing', 'vip-gallery-processing'));

        $log->update([
            'routing_status' => 'queued_ingest',
        ]);
    }

    private function queueDeleteCommand(VipGalleryWebhookLog $log, array $payload, ExternalEvent $event): void
    {
        if (! $this->matchesDeleteCommand($payload, $event)) {
            $log->update([
                'routing_status' => 'ignored_text_command',
                'error_message' => 'Mensagem de texto ignorada por nao corresponder ao comando de apagar configurado',
            ]);

            return;
        }

        if (! $event->allow_delete_command) {
            $log->update([
                'routing_status' => 'ignored_delete_not_allowed',
                'error_message' => 'Evento nao permite comando de apagar via WhatsApp',
            ]);

            return;
        }

        $referenceMessageId = ZApiGalleryPayload::referenceMessageId($payload);

        if (! $referenceMessageId) {
            $log->update([
                'routing_status' => 'invalid_delete_command',
                'error_message' => 'Comando de apagar recebido sem referenceMessageId',
            ]);

            return;
        }

        DeleteVipGalleryPhotoJob::dispatch($log->id, $event->id, $referenceMessageId)
            ->onQueue((string) config('vip_gallery.queues.processing', 'vip-gallery-processing'));

        $log->update([
            'routing_status' => 'queued_delete',
        ]);
    }

    private function matchesDeleteCommand(array $payload, ExternalEvent $event): bool
    {
        $receivedText = $this->normalizeCommandText(ZApiGalleryPayload::textBody($payload));
        $expectedText = $this->normalizeCommandText((string) $event->delete_command_keyword);
        $acceptedCommands = array_values(array_unique(array_filter([
            $expectedText,
            'apagar',
            'deletar',
        ])));

        return $receivedText !== '' && in_array($receivedText, $acceptedCommands, true);
    }

    private function normalizeCommandText(?string $value): string
    {
        if (! is_string($value)) {
            return '';
        }

        $normalized = preg_replace('/\s+/', ' ', trim($value)) ?? '';

        return strtolower(ltrim($normalized, '/'));
    }
}
