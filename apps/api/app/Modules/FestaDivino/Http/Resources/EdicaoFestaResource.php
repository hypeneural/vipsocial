<?php

namespace App\Modules\FestaDivino\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EdicaoFestaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_edicao,
            'ano' => $this->ano_festa,
            'titulo' => $this->titulo_festa,
            'data_inicio_programacao' => $this->data_inicio_programacao?->format('Y-m-d'),
            'data_fim_programacao' => $this->data_fim_programacao?->format('Y-m-d'),
            'data_inicio_festejos' => $this->data_inicio_festejos?->format('Y-m-d'),
            'data_fim_festejos' => $this->data_fim_festejos?->format('Y-m-d'),
            'bandeireira_imperial' => $this->bandeireira_imperial,
            'comissao_organizadora' => $this->comissao_organizadora,
            'texto_convite_principal' => $this->texto_convite_principal,
            'tema_geral' => $this->tema_geral_festa,
            'imagem_cartaz_url' => $this->imagem_cartaz_url,
            'eventos_count' => $this->when(isset($this->eventos_count), $this->eventos_count),
            'dias_count' => $this->when(isset($this->dias_count), $this->dias_count),
        ];
    }
}
