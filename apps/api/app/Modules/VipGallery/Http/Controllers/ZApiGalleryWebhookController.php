<?php

namespace App\Modules\VipGallery\Http\Controllers;

use App\Modules\VipGallery\Jobs\ProcessVipGalleryWebhookJob;
use App\Modules\VipGallery\Models\VipGalleryWebhookLog;
use App\Modules\VipGallery\Support\ZApiGalleryPayload;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ZApiGalleryWebhookController extends BaseController
{
    public function store(Request $request): JsonResponse
    {
        $headerName = (string) config('vip_gallery.webhook.secret_header', 'X-VIP-GALLERY-SECRET');
        $expectedSecret = trim((string) config('vip_gallery.webhook.secret', ''));
        $providedSecret = trim((string) $request->header($headerName, ''));

        if ($expectedSecret !== '' && ! hash_equals($expectedSecret, $providedSecret)) {
            return $this->jsonError('Webhook secret invalido', 'FORBIDDEN', 403);
        }

        $payload = $this->normalizePayload($request);

        $log = VipGalleryWebhookLog::query()->create([
            'message_id' => ZApiGalleryPayload::messageId($payload),
            'phone' => ZApiGalleryPayload::participantPhone($payload) ?? ZApiGalleryPayload::groupId($payload),
            'detected_type' => ZApiGalleryPayload::detectedType($payload),
            'routing_status' => 'received',
            'payload_json' => $payload,
        ]);

        ProcessVipGalleryWebhookJob::dispatch($log->id)
            ->onQueue((string) config('vip_gallery.queues.webhook', 'vip-gallery-webhook'));

        return response()->json([
            'success' => true,
            'data' => [
                'accepted' => true,
                'log_id' => $log->id,
            ],
            'message' => 'Webhook recebido',
        ], 202);
    }

    private function normalizePayload(Request $request): array
    {
        $payload = $request->json()->all();

        if (is_array($payload) && $payload !== []) {
            return $payload;
        }

        $decoded = json_decode((string) $request->getContent(), true);

        if (is_array($decoded)) {
            return $decoded;
        }

        return [
            '_raw' => (string) $request->getContent(),
        ];
    }
}
