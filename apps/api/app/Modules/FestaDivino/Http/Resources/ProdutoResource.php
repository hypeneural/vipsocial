<?php

namespace App\Modules\FestaDivino\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProdutoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_produto,
            'nome' => $this->nome_produto,
            'preco' => $this->preco,
            'foto' => $this->foto,
            'categoria_id' => $this->id_categoria,
            'categoria' => new CategoriaCardapioResource($this->whenLoaded('categoria')),
        ];
    }
}
