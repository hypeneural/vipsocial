<?php

namespace App\Modules\FestaDivino\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Produto extends FestaDivinoModel
{
    protected $table = 'produto';

    protected $primaryKey = 'id_produto';

    public $timestamps = false;

    protected $fillable = [
        'nome_produto',
        'preco',
        'foto',
        'id_categoria',
    ];

    protected function casts(): array
    {
        return [
            'preco' => 'decimal:2',
        ];
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(CategoriaCardapio::class, 'id_categoria', 'id_categoria');
    }
}
