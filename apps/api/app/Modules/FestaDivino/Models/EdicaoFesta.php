<?php

namespace App\Modules\FestaDivino\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class EdicaoFesta extends FestaDivinoModel
{
    protected $table = 'Edicao_Festa';

    protected $primaryKey = 'id_edicao';

    public $timestamps = false;

    protected $fillable = [
        'ano_festa',
        'titulo_festa',
        'data_inicio_programacao',
        'data_fim_programacao',
        'data_inicio_festejos',
        'data_fim_festejos',
        'bandeireira_imperial',
        'comissao_organizadora',
        'texto_convite_principal',
        'imagem_cartaz_url',
        'tema_geral_festa',
    ];

    protected function casts(): array
    {
        return [
            'ano_festa' => 'integer',
            'data_inicio_programacao' => 'date:Y-m-d',
            'data_fim_programacao' => 'date:Y-m-d',
            'data_inicio_festejos' => 'date:Y-m-d',
            'data_fim_festejos' => 'date:Y-m-d',
        ];
    }

    public function dias(): HasMany
    {
        return $this->hasMany(DiaFestaEvento::class, 'id_edicao', 'id_edicao');
    }

    public function eventos(): HasMany
    {
        return $this->hasMany(ProgramacaoEvento::class, 'id_edicao_festa', 'id_edicao');
    }
}
