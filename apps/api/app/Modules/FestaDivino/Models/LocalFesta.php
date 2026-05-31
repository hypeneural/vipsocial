<?php

namespace App\Modules\FestaDivino\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class LocalFesta extends FestaDivinoModel
{
    protected $table = 'Locais_Festa';

    protected $primaryKey = 'id_local';

    public $timestamps = false;

    protected $fillable = [
        'nome_local',
        'endereco_local',
        'latitude',
        'longitude',
        'descricao_local',
        'imagem_local_url',
        'acessibilidade_info',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
        ];
    }

    public function eventos(): HasMany
    {
        return $this->hasMany(ProgramacaoEvento::class, 'id_local', 'id_local');
    }
}
