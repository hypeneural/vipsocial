<?php

namespace App\Modules\FestaDivino\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LocalFestaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_local,
            'nome' => $this->nome_local,
            'endereco' => $this->endereco_local,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'descricao' => $this->descricao_local,
            'imagem_url' => $this->imagem_local_url,
            'acessibilidade' => $this->acessibilidade_info,
            'eventos_count' => $this->whenCounted('eventos'),
        ];
    }
}
