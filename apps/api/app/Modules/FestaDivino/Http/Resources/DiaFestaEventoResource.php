<?php

namespace App\Modules\FestaDivino\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DiaFestaEventoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_dia_festa_evento,
            'edicao_id' => $this->id_edicao,
            'data_evento' => $this->data_evento?->format('Y-m-d'),
            'nome' => $this->nome_principal_evento_dia,
            'descricao' => $this->descricao_dia,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'edicao' => new EdicaoFestaResource($this->whenLoaded('edicao')),
        ];
    }
}
