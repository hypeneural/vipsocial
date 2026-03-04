<?php

namespace App\Modules\Roteiros\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GavetaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'descricao' => $this->descricao,
            'active' => $this->active,
            'noticias' => $this->whenLoaded(
                'noticias',
                fn() =>
                $this->noticias->map(fn($n) => [
                    'id' => $n->id,
                    'titulo' => $n->titulo,
                    'conteudo' => $n->conteudo,
                    'ordem' => $n->ordem,
                    'is_checked' => $n->is_checked,
                    'created_at' => $n->created_at,
                    'updated_at' => $n->updated_at,
                ])
            ),
            'noticias_count' => $this->whenCounted('noticias'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
