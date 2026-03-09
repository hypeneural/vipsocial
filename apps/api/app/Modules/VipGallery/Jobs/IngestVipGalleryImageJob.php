<?php

namespace App\Modules\VipGallery\Jobs;

use App\Modules\Externas\Models\ExternalEvent;
use App\Modules\VipGallery\Models\VipGalleryPhoto;
use App\Modules\VipGallery\Models\VipGalleryWebhookLog;
use App\Modules\VipGallery\Support\VipGalleryMediaManager;
use App\Modules\VipGallery\Support\VipGallerySlideshowBroadcaster;
use App\Modules\VipGallery\Support\ZApiGalleryPayload;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Throwable;

class IngestVipGalleryImageJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 5;

    public int $timeout = 120;

    public int $backoff = 60;

    public function __construct(
        public readonly int $logId,
        public readonly int $eventId
    ) {}

    public function handle(VipGalleryMediaManager $mediaManager, VipGallerySlideshowBroadcaster $slideshowBroadcaster): void
    {
        $log = VipGalleryWebhookLog::query()->find($this->logId);
        $event = ExternalEvent::query()->find($this->eventId);

        if (! $log || ! $event) {
            return;
        }

        $payload = is_array($log->payload_json) ? $log->payload_json : [];
        $messageId = ZApiGalleryPayload::messageId($payload);
        $imageUrl = ZApiGalleryPayload::imageUrl($payload);
        $participantPhone = ZApiGalleryPayload::participantPhone($payload);

        if (! $messageId || ! $imageUrl) {
            $log->update([
                'routing_status' => 'failed',
                'error_message' => 'Payload sem message_id ou image_url',
            ]);

            return;
        }

        $photo = $this->upsertReceivingPhoto($event, $payload, $messageId);

        try {
            $download = $mediaManager->downloadOriginal($imageUrl, $event, $messageId);

            $photo->forceFill([
                'original_image_url' => $imageUrl,
                'original_image_path' => $download['path'],
                'width' => $download['width'],
                'height' => $download['height'],
                'processing_status' => VipGalleryPhoto::STATUS_PUBLISHED_ORIGINAL,
                'published_at' => $photo->published_at ?? now(),
                'processing_error' => null,
            ])->save();

            $log->update([
                'routing_status' => 'published',
                'vip_gallery_photo_id' => $photo->id,
                'error_message' => null,
            ]);

            $photo->loadMissing('event.vipGallerySlideshow');
            $slideshowBroadcaster->broadcastNewMedia($photo);

            ProcessVipGalleryPhotoJob::dispatch($photo->id)
                ->onQueue((string) config('vip_gallery.queues.processing', 'vip-gallery-processing'));

            if ((bool) config('vip_gallery.ack.enabled', false) && $participantPhone) {
                SendVipGalleryAckJob::dispatch($participantPhone)
                    ->onQueue((string) config('vip_gallery.queues.ack', 'vip-gallery-ack'));
            }
        } catch (Throwable $e) {
            $photo->forceFill([
                'processing_error' => $e->getMessage(),
            ])->save();

            $log->update([
                'routing_status' => 'failed',
                'vip_gallery_photo_id' => $photo->id,
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function failed(Throwable $e): void
    {
        $log = VipGalleryWebhookLog::query()->find($this->logId);

        if ($log) {
            $log->update([
                'routing_status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        }

        $messageId = $log && is_array($log->payload_json)
            ? ZApiGalleryPayload::messageId($log->payload_json)
            : null;

        if (! $messageId) {
            return;
        }

        $photo = VipGalleryPhoto::query()->where('zapi_message_id', $messageId)->first();

        if (! $photo) {
            return;
        }

        if ($photo->published_at === null) {
            $photo->update([
                'processing_status' => VipGalleryPhoto::STATUS_FAILED,
                'processing_error' => $e->getMessage(),
            ]);

            return;
        }

        $photo->update([
            'processing_status' => VipGalleryPhoto::STATUS_PUBLISHED_ORIGINAL,
            'processing_error' => $e->getMessage(),
        ]);
    }

    private function upsertReceivingPhoto(ExternalEvent $event, array $payload, string $messageId): VipGalleryPhoto
    {
        return DB::transaction(function () use ($event, $payload, $messageId) {
            $photo = VipGalleryPhoto::query()
                ->where('zapi_message_id', $messageId)
                ->lockForUpdate()
                ->first();

            if (! $photo) {
                $photo = new VipGalleryPhoto([
                    'external_event_id' => $event->id,
                    'zapi_message_id' => $messageId,
                ]);
            }

            $photo->fill([
                'participant_phone' => ZApiGalleryPayload::participantPhone($payload) ?? 'unknown',
                'sender_name' => ZApiGalleryPayload::senderName($payload),
                'caption' => ZApiGalleryPayload::caption($payload),
                'processing_status' => $photo->published_at ? $photo->processing_status : VipGalleryPhoto::STATUS_RECEIVED,
                'received_at' => $photo->received_at ?? now(),
                'last_processing_attempt_at' => now(),
                'processing_attempts' => ((int) $photo->processing_attempts) + 1,
            ]);

            $photo->save();

            return $photo;
        });
    }
}
