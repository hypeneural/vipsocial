<?php

namespace App\Modules\FestaDivino\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class CategoriaEvento extends FestaDivinoModel
{
    protected $table = 'Categorias_Evento';

    protected $primaryKey = 'id_categoria';

    public $timestamps = false;

    protected $fillable = [
        'nome_categoria',
        'descricao_categoria',
        'icone_categoria',
        'cor_categoria',
    ];

    public function eventos(): HasMany
    {
        return $this->hasMany(ProgramacaoEvento::class, 'id_categoria', 'id_categoria');
    }
}
