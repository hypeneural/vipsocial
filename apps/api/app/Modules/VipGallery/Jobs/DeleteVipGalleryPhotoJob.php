<?php

namespace App\Modules\VipGallery\Jobs;

use App\Modules\Externas\Models\ExternalEvent;
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

class DeleteVipGalleryPhotoJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(
        public readonly int $logId,
        public readonly int $eventId,
        public readonly string $referenceMessageId
    ) {
    }

    public function handle(VipGalleryMediaManager $mediaManager, VipGallerySlideshowBroadcaster $slideshowBroadcaster): void
    {
        $log = VipGalleryWebhookLog::query()->find($this->logId);
        $event = ExternalEvent::query()->find($this->eventId);

        if (! $log || ! $event) {
            return;
        }

        $photo = VipGalleryPhoto::query()
            ->where('external_event_id', $event->id)
            ->where('zapi_message_id', $this->referenceMessageId)
            ->first();

        if (! $photo) {
            $alreadyDeletedPhoto = VipGalleryPhoto::withTrashed()
                ->where('external_event_id', $event->id)
                ->where('zapi_message_id', $this->referenceMessageId)
                ->first();

            $log->update([
                'routing_status' => $alreadyDeletedPhoto ? 'ignored_already_deleted' : 'ignored_delete_target_not_found',
                'vip_gallery_photo_id' => $alreadyDeletedPhoto?->id,
                'error_message' => $alreadyDeletedPhoto
                    ? 'Foto ja removida anteriormente'
                    : 'Nenhuma foto encontrada para o referenceMessageId informado',
            ]);

            return;
        }

        try {
            $photo->loadMissing('event.vipGallerySlideshow');
            $mediaManager->deletePhotoFiles($photo);

            $photo->forceFill([
                'processing_status' => VipGalleryPhoto::STATUS_DELETED,
                'processing_error' => null,
            ])->save();

            $photo->delete();

            $log->update([
                'routing_status' => 'deleted',
                'vip_gallery_photo_id' => $photo->id,
                'error_message' => null,
            ]);

            $slideshowBroadcaster->broadcastMediaDeleted($photo);

            // Reaction 🗑️ → photo deleted
            $originalLog = VipGalleryWebhookLog::query()
                ->where('vip_gallery_photo_id', $photo->id)
                ->whereIn('routing_status', ['published', 'queued_ingest', 'deleted'])
                ->first();

            if ($originalLog && $originalLog->message_id && $originalLog->phone) {
                $deletedEmoji = (string) config('vip_gallery.reactions.on_deleted', '🗑️');
                SendVipGalleryReactionJob::dispatch($originalLog->phone, $originalLog->message_id, $deletedEmoji)
                    ->onQueue((string) config('vip_gallery.queues.ack', 'vip-gallery-ack'));
            }
        } catch (Throwable $e) {
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

        if (! $log) {
            return;
        }

        $log->update([
            'routing_status' => 'failed',
            'error_message' => $e->getMessage(),
        ]);
    }
}
