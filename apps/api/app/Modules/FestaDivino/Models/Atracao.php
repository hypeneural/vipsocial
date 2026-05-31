<?php

namespace App\Modules\FestaDivino\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Atracao extends FestaDivinoModel
{
    protected $table = 'Atracoes';

    protected $primaryKey = 'id_atracao';

    public $timestamps = false;

    protected $fillable = [
        'nome_atracao',
        'tipo_atracao',
        'descricao_atracao',
        'imagem_atracao_url',
    ];

    public function eventos(): BelongsToMany
    {
        return $this->belongsToMany(
            ProgramacaoEvento::class,
            'Evento_Atracao',
            'id_atracao',
            'id_evento',
            'id_atracao',
            'id_evento'
        )->withPivot(['papel_no_evento', 'ordem_apresentacao']);
    }
}
