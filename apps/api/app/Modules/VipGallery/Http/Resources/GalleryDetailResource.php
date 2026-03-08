<?php

namespace App\Modules\VipGallery\Http\Resources;

use App\Modules\Externas\Models\ExternalEvent;
use App\Modules\VipGallery\Support\VipGalleryMediaManager;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GalleryDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $banners = $this->relationLoaded('vipGalleryBanners')
            ? GalleryBannerResource::collection($this->vipGalleryBanners)->resolve($request)
            : [];
        $isActive = $this->vip_gallery_status === ExternalEvent::VIP_GALLERY_STATUS_ACTIVE;
        $mediaManager = app(VipGalleryMediaManager::class);

        return [
            'id' => $this->id,
            'slug' => $this->gallery_slug,
            'status' => $this->vip_gallery_status,
            'isActive' => $isActive,
            'is_active' => $isActive,
            'accepting_photos' => $isActive,
            'public_url' => $mediaManager->publicGalleryUrl($this->resource),
            'hasBanners' => $this->relationLoaded('vipGalleryBanners') ? $this->vipGalleryBanners->isNotEmpty() : false,
            'has_banners' => $this->relationLoaded('vipGalleryBanners') ? $this->vipGalleryBanners->isNotEmpty() : false,
            'gallery_title' => $this->titulo,
            'allow_delete_command' => (bool) $this->allow_delete_command,
            'stats' => (new GalleryStatsResource($this))->toArray($request),
            'banners' => $banners,
        ];
    }
}
