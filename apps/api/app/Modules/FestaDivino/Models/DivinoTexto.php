<?php

namespace App\Modules\FestaDivino\Models;

class DivinoTexto extends FestaDivinoModel
{
    protected $table = 'divino_textos';

    protected $primaryKey = 'id';

    public const CREATED_AT = 'criado_em';

    public const UPDATED_AT = 'atualizado_em';

    protected $fillable = [
        'texto_curto',
        'texto_detalhado',
        'categoria',
        'icone_categoria',
    ];

    protected function casts(): array
    {
        return [
            'criado_em' => 'datetime:Y-m-d\TH:i:s\Z',
            'atualizado_em' => 'datetime:Y-m-d\TH:i:s\Z',
        ];
    }
}
