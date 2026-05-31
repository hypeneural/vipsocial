<?php

namespace App\Modules\FestaDivino\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AtracaoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_atracao,
            'nome' => $this->nome_atracao,
            'tipo' => $this->tipo_atracao,
            'descricao' => $this->descricao_atracao,
            'imagem_url' => $this->imagem_atracao_url,
            'eventos_count' => $this->whenCounted('eventos'),
            'papel_no_evento' => $this->whenPivotLoaded('Evento_Atracao', fn () => $this->pivot->papel_no_evento),
            'ordem_apresentacao' => $this->whenPivotLoaded('Evento_Atracao', fn () => $this->pivot->ordem_apresentacao),
        ];
    }
}
