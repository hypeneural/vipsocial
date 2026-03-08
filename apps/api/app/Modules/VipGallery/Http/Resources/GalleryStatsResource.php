<?php

namespace App\Modules\VipGallery\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GalleryStatsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'total_photos' => (int) ($this->total_photos_count ?? 0),
            'total_downloads' => (int) ($this->total_downloads_count ?? 0),
            'views_count' => (int) ($this->views_count ?? 0),
        ];
    }
}
