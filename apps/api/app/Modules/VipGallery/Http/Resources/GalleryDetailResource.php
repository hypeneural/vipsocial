<?php

namespace App\Modules\VipGallery\Http\Resources;

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
        $mediaManager = app(VipGalleryMediaManager::class);
        $hasVisiblePhotos = $this->resource->hasVisibleVipGalleryPhotos();
        $configuredStatus = (string) $this->vip_gallery_status;
        $publicStatus = $this->resource->publicVipGalleryStatus();
        $isActive = $this->resource->isVipGalleryPubliclyActive();
        $coverImageUrl = $this->latestPublicVipGalleryPhoto?->publicImageUrl();

        return [
            'id' => $this->id,
            'slug' => $this->gallery_slug,
            'title' => $this->titulo,
            'gallery_title' => $this->titulo,
            'subtitle' => $this->local,
            'status' => $publicStatus,
            'configured_status' => $configuredStatus,
            'isActive' => $isActive,
            'is_active' => $isActive,
            'accepting_photos' => $isActive,
            'has_visible_photos' => $hasVisiblePhotos,
            'total_photos' => (int) ($this->total_photos_count ?? 0),
            'cover_image_url' => $coverImageUrl,
            'public_url' => $mediaManager->publicGalleryUrl($this->resource),
            'hasBanners' => $this->relationLoaded('vipGalleryBanners') ? $this->vipGalleryBanners->isNotEmpty() : false,
            'has_banners' => $this->relationLoaded('vipGalleryBanners') ? $this->vipGalleryBanners->isNotEmpty() : false,
            'allow_delete_command' => (bool) $this->allow_delete_command,
            'stats' => (new GalleryStatsResource($this))->toArray($request),
            'banners' => $banners,
        ];
    }
}
