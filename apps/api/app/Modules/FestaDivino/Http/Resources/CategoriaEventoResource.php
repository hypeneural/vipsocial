<?php

namespace App\Modules\FestaDivino\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoriaEventoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_categoria,
            'nome' => $this->nome_categoria,
            'descricao' => $this->descricao_categoria,
            'icone' => $this->icone_categoria,
            'cor' => $this->cor_categoria,
            'eventos_count' => $this->whenCounted('eventos'),
        ];
    }
}
