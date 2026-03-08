<?php

namespace App\Modules\VipGallery\Http\Resources;

use App\Modules\VipGallery\Support\VipGalleryMediaManager;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GalleryListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $mediaManager = app(VipGalleryMediaManager::class);

        return [
            'id' => $this->id,
            'slug' => $this->gallery_slug,
            'title' => $this->titulo,
            'subtitle' => $this->local,
            'status' => $this->resource->publicVipGalleryStatus(),
            'is_active' => $this->resource->isVipGalleryPubliclyActive(),
            'has_visible_photos' => $this->resource->hasVisibleVipGalleryPhotos(),
            'total_photos' => (int) ($this->total_photos_count ?? 0),
            'cover_image_url' => $this->latestPublicVipGalleryPhoto?->publicImageUrl(),
            'last_published_at' => $this->latest_photo_published_at
                ? Carbon::parse($this->latest_photo_published_at)->toIso8601String()
                : null,
            'event_date' => $this->data_hora?->toIso8601String(),
            'public_url' => $mediaManager->publicGalleryUrl($this->resource),
        ];
    }
}
