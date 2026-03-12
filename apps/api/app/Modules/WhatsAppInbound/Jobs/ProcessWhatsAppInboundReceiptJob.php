<?php

namespace App\Modules\WhatsAppInbound\Jobs;

use App\Modules\NewsRadarWhatsApp\Actions\ConsumeZApiReceiptForNewsRadarAction;
use App\Modules\WhatsAppInbound\Models\WhatsAppWebhookReceipt;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class ProcessWhatsAppInboundReceiptJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $timeout = 60;

    public function __construct(
        public readonly int $receiptId
    ) {}

    public function handle(ConsumeZApiReceiptForNewsRadarAction $consumeReceipt): void
    {
        $receipt = WhatsAppWebhookReceipt::query()->find($this->receiptId);

        if (! $receipt) {
            return;
        }

        $payload = is_array($receipt->payload_json) ? $receipt->payload_json : [];

        $receipt->forceFill([
            'processing_status' => WhatsAppWebhookReceipt::STATUS_DISPATCHED,
            'processing_attempts' => $receipt->processing_attempts + 1,
            'last_error' => null,
        ])->save();

        if ($payload === [] || array_key_exists('_raw', $payload)) {
            $receipt->forceFill([
                'processing_status' => WhatsAppWebhookReceipt::STATUS_FAILED,
                'last_error' => 'Nao foi possivel normalizar o payload bruto para array estruturado.',
            ])->save();

            return;
        }

        try {
            $consumeReceipt->execute($receipt);
        } catch (Throwable $exception) {
            $receipt->forceFill([
                'processing_status' => WhatsAppWebhookReceipt::STATUS_FAILED,
                'last_error' => $exception->getMessage(),
            ])->save();

            throw $exception;
        }
    }
}
