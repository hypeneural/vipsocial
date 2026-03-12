<?php

namespace App\Modules\WhatsAppInbound\Http\Controllers;

use App\Modules\WhatsAppInbound\Actions\CreateWhatsAppWebhookReceiptAction;
use App\Modules\WhatsAppInbound\Jobs\ProcessWhatsAppInboundReceiptJob;
use App\Modules\WhatsAppInbound\Models\WhatsAppWebhookReceipt;
use App\Modules\WhatsAppInbound\Support\InboundWebhookRequestNormalizer;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ZApiInboundWebhookController extends BaseController
{
    public function store(Request $request, CreateWhatsAppWebhookReceiptAction $createReceipt): JsonResponse
    {
        $headerName = (string) config('whatsapp.inbound.webhook.secret_header', 'X-WHATSAPP-INBOUND-SECRET');
        $expectedSecret = trim((string) config('whatsapp.inbound.webhook.secret', ''));
        $providedSecret = trim((string) $request->header($headerName, ''));

        if ($expectedSecret !== '' && ! hash_equals($expectedSecret, $providedSecret)) {
            return $this->jsonError('Webhook secret invalido', 'FORBIDDEN', 403);
        }

        $payload = InboundWebhookRequestNormalizer::payload($request);
        $headers = InboundWebhookRequestNormalizer::headers($request, [$headerName]);

        $receipt = $createReceipt->execute($payload, $headers, WhatsAppWebhookReceipt::PROVIDER_ZAPI);

        ProcessWhatsAppInboundReceiptJob::dispatchAfterResponse($receipt->id)
            ->onQueue((string) config('whatsapp.inbound.queue', 'whatsapp-inbound'));

        return response()->json([
            'success' => true,
            'data' => [
                'accepted' => true,
                'receipt_id' => $receipt->id,
            ],
            'message' => 'Webhook recebido',
        ], 202);
    }
}
