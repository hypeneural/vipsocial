<?php

namespace App\Modules\VipGallery\Support;

use App\Modules\Externas\Models\ExternalEvent;
use App\Modules\VipGallery\Events\SlideshowExpired;
use App\Modules\VipGallery\Events\SlideshowMediaDeleted;
use App\Modules\VipGallery\Events\SlideshowMediaUpdated;
use App\Modules\VipGallery\Events\SlideshowNewMedia;
use App\Modules\VipGallery\Events\SlideshowSettingsUpdated;
use App\Modules\VipGallery\Events\SlideshowStatusChanged;
use App\Modules\VipGallery\Models\VipGalleryPhoto;
use App\Modules\VipGallery\Models\VipGallerySlideshow;

class VipGallerySlideshowBroadcaster
{
    public function broadcastNewMedia(VipGalleryPhoto $photo): void
    {
        $slideshow = $this->resolveSlideshowFromPhoto($photo);

        if (! $slideshow || ! $this->photoEligibleForPlayback($photo, $slideshow)) {
            return;
        }

        event(new SlideshowNewMedia(
            $slideshow->slideshow_code,
            $this->slidePayload($photo)
        ));
    }

    public function broadcastMediaUpdated(VipGalleryPhoto $photo): void
    {
        $slideshow = $this->resolveSlideshowFromPhoto($photo);

        if (! $slideshow || ! $this->photoEligibleForPlayback($photo, $slideshow)) {
            return;
        }

        event(new SlideshowMediaUpdated(
            $slideshow->slideshow_code,
            $this->slidePayload($photo)
        ));
    }

    public function broadcastMediaDeleted(VipGalleryPhoto $photo): void
    {
        $slideshow = $this->resolveSlideshowFromPhoto($photo);

        if (! $slideshow || ! $slideshow->isAvailable()) {
            return;
        }

        event(new SlideshowMediaDeleted(
            $slideshow->slideshow_code,
            ['id' => $photo->slideshowIdentifier()]
        ));
    }

    public function broadcastSettingsUpdated(ExternalEvent|VipGallerySlideshow $source): void
    {
        $slideshow = $source instanceof VipGallerySlideshow
            ? $source->loadMissing('event')
            : $this->resolveSlideshowFromEvent($source);

        if (! $slideshow || ! $slideshow->is_enabled) {
            return;
        }

        event(new SlideshowSettingsUpdated(
            $slideshow->slideshow_code,
            $this->settingsPayload($slideshow)
        ));
    }

    public function broadcastStatusChanged(ExternalEvent|VipGallerySlideshow $source, ?string $reason = null): void
    {
        $slideshow = $source instanceof VipGallerySlideshow
            ? $source->loadMissing('event')
            : $this->resolveSlideshowFromEvent($source);

        if (! $slideshow || ! $slideshow->slideshow_code) {
            return;
        }

        event(new SlideshowStatusChanged(
            $slideshow->slideshow_code,
            $this->statusPayload($slideshow, $reason)
        ));
    }

    public function broadcastExpired(ExternalEvent|VipGallerySlideshow $source, string $reason = 'expired'): void
    {
        $slideshow = $source instanceof VipGallerySlideshow
            ? $source->loadMissing('event')
            : $this->resolveSlideshowFromEvent($source);

        if (! $slideshow || ! $slideshow->slideshow_code) {
            return;
        }

        event(new SlideshowExpired(
            $slideshow->slideshow_code,
            [
                'reason' => $reason,
                'expired_at' => optional($slideshow->expires_at ?: now())->toIso8601String(),
            ]
        ));
    }

    public function settingsPayload(VipGallerySlideshow $slideshow): array
    {
        $slideshow->loadMissing('event');

        return [
            'intervalo' => (int) $slideshow->interval_ms,
            'limite' => (int) $slideshow->queue_limit,
            'layout' => $slideshow->layout,
            'background' => $slideshow->background_url,
            'partnerLogo' => app(VipGalleryMediaManager::class)->publicUrl($slideshow->partner_logo_path),
            'showNeon' => (bool) $slideshow->show_neon,
            'showSenderCredit' => (bool) $slideshow->show_sender_credit,
            'neonText' => $slideshow->neon_text,
            'instructionsText' => $slideshow->instructions_text,
        ];
    }

    public function statusPayload(VipGallerySlideshow $slideshow, ?string $reason = null): array
    {
        $slideshow->loadMissing('event');

        return [
            'status' => $slideshow->publicStatus(),
            'reason' => $reason,
            'updated_at' => now()->toIso8601String(),
        ];
    }

    public function slidePayload(VipGalleryPhoto $photo): array
    {
        return [
            'id' => $photo->slideshowIdentifier(),
            'url' => $photo->publicImageUrl(),
            'type' => $photo->slideshowType(),
            'sender_name' => $photo->sender_name,
            'sender_key' => $photo->slideshowSenderKey(),
            'texto_curto' => $photo->slideshowText(),
            'highlight_score' => (int) $photo->highlight_score,
            'created_at' => $photo->slideshowCreatedAt()?->toIso8601String(),
        ];
    }

    private function resolveSlideshowFromPhoto(VipGalleryPhoto $photo): ?VipGallerySlideshow
    {
        $photo->loadMissing('event.vipGallerySlideshow');

        return $photo->event?->vipGallerySlideshow?->loadMissing('event');
    }

    private function resolveSlideshowFromEvent(ExternalEvent $event): ?VipGallerySlideshow
    {
        $event->loadMissing('vipGallerySlideshow');

        return $event->vipGallerySlideshow?->loadMissing('event');
    }

    private function photoEligibleForPlayback(VipGalleryPhoto $photo, VipGallerySlideshow $slideshow): bool
    {
        return $slideshow->isPlayable()
            && (bool) $photo->is_approved
            && in_array($photo->processing_status, [
                VipGalleryPhoto::STATUS_PUBLISHED_ORIGINAL,
                VipGalleryPhoto::STATUS_PROCESSED,
            ], true);
    }
}
