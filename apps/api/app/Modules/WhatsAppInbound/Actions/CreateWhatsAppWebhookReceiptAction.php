<?php

namespace App\Modules\WhatsAppInbound\Actions;

use App\Modules\WhatsAppInbound\Models\WhatsAppWebhookReceipt;
use App\Modules\WhatsAppInbound\Support\ZApiInboundPayload;

class CreateWhatsAppWebhookReceiptAction
{
    public function execute(
        array $payload,
        array $headers = [],
        string $provider = WhatsAppWebhookReceipt::PROVIDER_ZAPI
    ): WhatsAppWebhookReceipt {
        return WhatsAppWebhookReceipt::query()->create([
            'provider' => $provider,
            'instance_id' => ZApiInboundPayload::instanceId($payload),
            'headers_json' => $headers,
            'payload_json' => $payload,
            'payload_hash' => $this->hashPayload($payload),
            'received_at' => now(),
            'processing_status' => WhatsAppWebhookReceipt::STATUS_RECEIVED,
            'processing_attempts' => 0,
            'last_error' => null,
        ]);
    }

    private function hashPayload(array $payload): string
    {
        return hash('sha256', (string) json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }
}
