<?php

namespace App\Modules\FestaDivino\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoticiaFestaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_noticia,
            'titulo' => $this->titulo,
            'linha_apoio' => $this->linha_apoio,
            'url' => $this->url_noticia,
            'data_hora_publicacao' => $this->data_hora_publicacao,
            'thumb_url' => $this->url_thumb,
            'data_cadastro' => $this->data_cadastro,
        ];
    }
}
