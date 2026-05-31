<?php

namespace App\Modules\FestaDivino\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiaFestaEvento extends FestaDivinoModel
{
    protected $table = 'dias_festa_evento';

    protected $primaryKey = 'id_dia_festa_evento';

    protected $fillable = [
        'id_edicao',
        'data_evento',
        'nome_principal_evento_dia',
        'descricao_dia',
    ];

    protected function casts(): array
    {
        return [
            'data_evento' => 'date:Y-m-d',
        ];
    }

    public function edicao(): BelongsTo
    {
        return $this->belongsTo(EdicaoFesta::class, 'id_edicao', 'id_edicao');
    }
}
