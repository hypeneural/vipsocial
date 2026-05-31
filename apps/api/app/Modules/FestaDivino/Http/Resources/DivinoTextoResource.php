<?php

namespace App\Modules\FestaDivino\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DivinoTextoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'texto_curto' => $this->texto_curto,
            'texto_detalhado' => $this->texto_detalhado,
            'categoria' => $this->categoria,
            'icone_categoria' => $this->icone_categoria,
            'criado_em' => $this->criado_em,
            'atualizado_em' => $this->atualizado_em,
        ];
    }
}
