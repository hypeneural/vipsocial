<?php

namespace App\Modules\Roteiros\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MateriaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'roteiro_id' => $this->roteiro_id,
            'shortcut' => $this->shortcut,
            'titulo' => $this->titulo,
            'descricao' => $this->descricao,
            'duracao' => $this->duracao,
            'status' => $this->status,
            'creditos_gc' => $this->creditos_gc,
            'ordem' => $this->ordem,
            'categoria' => $this->whenLoaded('categoria', fn() => [
                'id' => $this->categoria->id,
                'nome' => $this->categoria->nome,
                'cor' => $this->categoria->cor,
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
