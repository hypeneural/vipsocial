<?php

namespace App\Modules\VipGallery\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GalleryBannerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'image_url' => $this->imageUrl(),
            'link_url' => $this->link_url,
            'alt_text' => $this->alt_text,
            'sort_order' => (int) $this->sort_order,
            'width' => $this->width,
            'height' => $this->height,
        ];
    }
}
