<?php

namespace App\Modules\Roteiros\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoteiroResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'data' => $this->data?->format('Y-m-d'),
            'programa' => $this->programa,
            'status' => $this->status,
            'observacoes' => $this->observacoes,
            'total_materias' => $this->whenCounted('materias', $this->materias_count ?? $this->materias->count()),
            'duracao_total' => $this->duracao_total,
            'created_by' => $this->whenLoaded('createdBy', fn() => [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ]),
            'updated_by' => $this->whenLoaded('updatedBy', fn() => [
                'id' => $this->updatedBy->id,
                'name' => $this->updatedBy->name,
            ]),
            'materias' => MateriaResource::collection($this->whenLoaded('materias')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
