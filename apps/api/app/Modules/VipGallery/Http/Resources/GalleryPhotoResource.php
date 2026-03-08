<?php

namespace App\Modules\VipGallery\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GalleryPhotoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'image_url' => $this->publicImageUrl(),
            'is_processed' => $this->isProcessed(),
            'width' => (int) $this->width,
            'height' => (int) $this->height,
            'sender_name' => $this->sender_name,
            'caption' => $this->caption,
            'published_at' => $this->published_at?->toIso8601String(),
        ];
    }
}
