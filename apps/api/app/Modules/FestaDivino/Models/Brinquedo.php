<?php

namespace App\Modules\FestaDivino\Models;

class Brinquedo extends FestaDivinoModel
{
    protected $table = 'brinquedos';

    protected $primaryKey = 'id';

    protected $fillable = [
        'nome',
        'descricao',
        'video',
        'active',
        'thumb_url',
    ];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'created_at' => 'datetime:Y-m-d\TH:i:s\Z',
            'updated_at' => 'datetime:Y-m-d\TH:i:s\Z',
        ];
    }
}
