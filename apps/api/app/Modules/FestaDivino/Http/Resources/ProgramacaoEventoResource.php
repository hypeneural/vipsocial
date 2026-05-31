<?php

namespace App\Modules\FestaDivino\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProgramacaoEventoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_evento,
            'edicao_id' => $this->id_edicao_festa,
            'titulo' => $this->titulo_evento,
            'subtitulo' => $this->subtitulo_evento,
            'descricao' => $this->descricao_geral_evento,
            'data_evento' => $this->data_evento?->format('Y-m-d'),
            'hora_inicio' => $this->hora_inicio,
            'hora_fim' => $this->hora_fim,
            'duracao_estimada_minutos' => $this->duracao_estimada_minutos,
            'local_id' => $this->id_local,
            'categoria_id' => $this->id_categoria,
            'tema' => $this->tema_evento,
            'publico_alvo' => $this->publico_alvo,
            'evento_pago' => $this->evento_pago,
            'valor_ingresso' => $this->valor_ingresso,
            'link_ingresso' => $this->link_ingresso,
            'observacao_ingresso' => $this->observacao_ingresso,
            'destaque' => $this->evento_destaque,
            'imagem_destaque_url' => $this->imagem_destaque_url,
            'organizador_responsavel' => $this->organizador_responsavel,
            'tags' => $this->tags ?? [],
            'ativo' => $this->ativo,
            'created_at' => $this->data_criacao,
            'updated_at' => $this->data_atualizacao,
            'edicao' => new EdicaoFestaResource($this->whenLoaded('edicao')),
            'local' => new LocalFestaResource($this->whenLoaded('local')),
            'categoria' => new CategoriaEventoResource($this->whenLoaded('categoria')),
            'atracoes' => AtracaoResource::collection($this->whenLoaded('atracoes')),
        ];
    }
}
