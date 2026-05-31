<?php

namespace App\Modules\FestaDivino\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class YoutubeVideoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'titulo' => $this->title,
            'descricao' => $this->description,
            'thumb_url' => $this->thumb_url,
            'watch_url' => "https://www.youtube.com/watch?v={$this->id}",
            'embed_url' => "https://www.youtube.com/embed/{$this->id}",
            'created_at' => $this->create_at,
            'updated_at' => $this->update_at,
        ];
    }
}
