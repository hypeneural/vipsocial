<?php

namespace App\Modules\VipGallery\Jobs;

use App\Modules\VipGallery\Models\VipGalleryPhoto;
use App\Modules\VipGallery\Models\VipGalleryWebhookLog;
use App\Modules\VipGallery\Support\VipGalleryMediaManager;
use App\Modules\VipGallery\Support\VipGallerySlideshowBroadcaster;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class ProcessVipGalleryPhotoJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 2;

    public int $timeout = 120;

    public function __construct(
        public readonly int $photoId
    ) {}

    public function handle(VipGalleryMediaManager $mediaManager, VipGallerySlideshowBroadcaster $slideshowBroadcaster): void
    {
        $photo = VipGalleryPhoto::query()->with('event')->find($this->photoId);

        if (! $photo || ! $photo->event || ! $photo->original_image_path) {
            return;
        }

        try {
            $processedPath = $mediaManager->createProcessedImage($photo, $photo->event);

            $photo->update([
                'processed_image_path' => $processedPath,
                'processing_status' => VipGalleryPhoto::STATUS_PROCESSED,
                'processing_error' => null,
            ]);

            $photo->refresh()->loadMissing('event.vipGallerySlideshow');
            $slideshowBroadcaster->broadcastMediaUpdated($photo);

            // Reaction 📸 → photo fully processed
            $webhookLog = VipGalleryWebhookLog::query()
                ->where('vip_gallery_photo_id', $photo->id)
                ->whereIn('routing_status', ['published', 'queued_ingest'])
                ->first();

            if ($webhookLog && $webhookLog->message_id && $webhookLog->phone) {
                $processedEmoji = (string) config('vip_gallery.reactions.on_processed', '📸');
                SendVipGalleryReactionJob::dispatch($webhookLog->phone, $webhookLog->message_id, $processedEmoji)
                    ->onQueue((string) config('vip_gallery.queues.ack', 'vip-gallery-ack'));
            }
        } catch (Throwable $e) {
            $photo->update([
                'processing_status' => $this->fallbackStatus($photo),
                'processing_error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function failed(Throwable $e): void
    {
        $photo = VipGalleryPhoto::query()->find($this->photoId);

        if (! $photo) {
            return;
        }

        $photo->update([
            'processing_status' => $this->fallbackStatus($photo),
            'processing_error' => $e->getMessage(),
        ]);
    }

    private function fallbackStatus(VipGalleryPhoto $photo): string
    {
        return $photo->published_at
            ? VipGalleryPhoto::STATUS_PUBLISHED_ORIGINAL
            : VipGalleryPhoto::STATUS_FAILED;
    }
}
