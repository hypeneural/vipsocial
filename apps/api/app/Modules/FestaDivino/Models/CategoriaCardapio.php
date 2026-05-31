<?php

namespace App\Modules\FestaDivino\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class CategoriaCardapio extends FestaDivinoModel
{
    protected $table = 'categoria';

    protected $primaryKey = 'id_categoria';

    public $timestamps = false;

    protected $fillable = [
        'nome_categoria',
        'icone_categoria',
    ];

    public function produtos(): HasMany
    {
        return $this->hasMany(Produto::class, 'id_categoria', 'id_categoria');
    }
}
