<?php

namespace App\Modules\VipGallery\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SlideMediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->slideshowIdentifier(),
            'url' => $this->publicImageUrl(),
            'type' => $this->slideshowType(),
            'sender_name' => $this->sender_name,
            'texto_curto' => $this->slideshowText(),
            'highlight_score' => (int) $this->highlight_score,
            'created_at' => $this->slideshowCreatedAt()?->toIso8601String(),
        ];
    }
}
