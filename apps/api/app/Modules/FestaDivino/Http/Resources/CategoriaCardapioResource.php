<?php

namespace App\Modules\FestaDivino\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoriaCardapioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_categoria,
            'nome' => $this->nome_categoria,
            'icone' => $this->icone_categoria,
            'produtos_count' => $this->whenCounted('produtos'),
        ];
    }
}
