<?php

namespace App\Modules\VipGallery\Http\Controllers;

use App\Modules\WhatsAppInbound\Actions\CreateWhatsAppWebhookReceiptAction;
use App\Modules\WhatsAppInbound\Support\InboundWebhookRequestNormalizer;
use App\Modules\VipGallery\Jobs\ProcessVipGalleryWebhookJob;
use App\Modules\VipGallery\Models\VipGalleryWebhookLog;
use App\Modules\VipGallery\Support\ZApiGalleryPayload;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ZApiGalleryWebhookController extends BaseController
{
    public function store(Request $request, CreateWhatsAppWebhookReceiptAction $createReceipt): JsonResponse
    {
        $headerName = (string) config('vip_gallery.webhook.secret_header', 'X-VIP-GALLERY-SECRET');
        $expectedSecret = trim((string) config('vip_gallery.webhook.secret', ''));
        $providedSecret = trim((string) $request->header($headerName, ''));

        if ($expectedSecret !== '' && ! hash_equals($expectedSecret, $providedSecret)) {
            return $this->jsonError('Webhook secret invalido', 'FORBIDDEN', 403);
        }

        $payload = InboundWebhookRequestNormalizer::payload($request);
        $headers = InboundWebhookRequestNormalizer::headers($request, [$headerName]);

        $receipt = $createReceipt->execute($payload, $headers);

        $log = VipGalleryWebhookLog::query()->create([
            'message_id' => ZApiGalleryPayload::messageId($payload),
            'phone' => ZApiGalleryPayload::groupId($payload),
            'detected_type' => ZApiGalleryPayload::detectedType($payload),
            'routing_status' => 'received',
            'payload_json' => $payload,
        ]);

        ProcessVipGalleryWebhookJob::dispatchAfterResponse($log->id);

        return response()->json([
            'success' => true,
            'data' => [
                'accepted' => true,
                'log_id' => $log->id,
                'receipt_id' => $receipt->id,
            ],
            'message' => 'Webhook recebido',
        ], 202);
    }
}
