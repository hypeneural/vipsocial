<?php

namespace App\Modules\FestaDivino\Models;

class NoticiaFesta extends FestaDivinoModel
{
    protected $table = 'noticias_festa';

    protected $primaryKey = 'id_noticia';

    public $timestamps = false;

    protected $fillable = [
        'titulo',
        'linha_apoio',
        'url_noticia',
        'data_hora_publicacao',
        'url_thumb',
        'data_cadastro',
    ];

    protected function casts(): array
    {
        return [
            'data_hora_publicacao' => 'datetime:Y-m-d\TH:i:s\Z',
            'data_cadastro' => 'datetime:Y-m-d\TH:i:s\Z',
        ];
    }
}
