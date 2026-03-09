<?php

namespace App\Modules\VipGallery\Http\Resources;

use App\Modules\VipGallery\Support\VipGalleryMediaManager;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SlideshowResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $event = $this->event;
        $mediaManager = app(VipGalleryMediaManager::class);
        $files = $event && $event->relationLoaded('vipGalleryPhotos')
            ? SlideMediaResource::collection($event->vipGalleryPhotos)->resolve($request)
            : [];

        return [
            'event' => [
                'id' => $event?->id,
                'title' => $event?->titulo,
                'slug' => $event?->gallery_slug,
                'slideshow_code' => $this->slideshow_code,
                'status' => $this->status,
                'public_url' => $this->publicUrl(),
            ],
            'files' => $files,
            'settings' => [
                'intervalo' => (int) $this->interval_ms,
                'limite' => (int) $this->queue_limit,
                'layout' => $this->layout,
                'background' => $this->background_url,
                'partnerLogo' => $mediaManager->publicUrl($this->partner_logo_path),
                'showNeon' => (bool) $this->show_neon,
                'neonText' => $this->neon_text,
                'instructionsText' => $this->instructions_text,
            ],
        ];
    }
}
