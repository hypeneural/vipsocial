<?php

namespace App\Modules\VipGallery\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GalleryPhotoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $imageUrl = $this->publicImageUrl();

        return [
            'id' => $this->id,
            'sequence' => (int) $this->id,
            'image_url' => $imageUrl,
            'thumb_url' => $imageUrl,
            'medium_url' => $imageUrl,
            'large_url' => $imageUrl,
            'download_url' => $imageUrl,
            'is_processed' => $this->isProcessed(),
            'width' => (int) $this->width,
            'height' => (int) $this->height,
            'sender_name' => $this->sender_name,
            'author_name' => $this->sender_name,
            'caption' => $this->caption,
            'published_at' => $this->published_at?->toIso8601String(),
        ];
    }
}
