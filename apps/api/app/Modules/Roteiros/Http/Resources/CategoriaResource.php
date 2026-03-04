<?php

namespace App\Modules\Roteiros\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoriaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'slug' => $this->slug,
            'cor' => $this->cor,
            'active' => $this->active,
            'materias_count' => $this->whenCounted('materias'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
