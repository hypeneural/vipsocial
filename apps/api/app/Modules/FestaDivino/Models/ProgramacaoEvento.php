<?php

namespace App\Modules\FestaDivino\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ProgramacaoEvento extends FestaDivinoModel
{
    protected $table = 'Programacao_Eventos';

    protected $primaryKey = 'id_evento';

    public const CREATED_AT = 'data_criacao';

    public const UPDATED_AT = 'data_atualizacao';

    protected $fillable = [
        'id_edicao_festa',
        'titulo_evento',
        'subtitulo_evento',
        'descricao_geral_evento',
        'data_evento',
        'hora_inicio',
        'hora_fim',
        'duracao_estimada_minutos',
        'id_local',
        'id_categoria',
        'tema_evento',
        'publico_alvo',
        'evento_pago',
        'valor_ingresso',
        'link_ingresso',
        'observacao_ingresso',
        'evento_destaque',
        'imagem_destaque_url',
        'organizador_responsavel',
        'tags',
        'ativo',
    ];

    protected function casts(): array
    {
        return [
            'data_evento' => 'date:Y-m-d',
            'duracao_estimada_minutos' => 'integer',
            'evento_pago' => 'boolean',
            'evento_destaque' => 'boolean',
            'valor_ingresso' => 'decimal:2',
            'tags' => 'array',
            'ativo' => 'boolean',
            'data_criacao' => 'datetime:Y-m-d\TH:i:s\Z',
            'data_atualizacao' => 'datetime:Y-m-d\TH:i:s\Z',
        ];
    }

    public function edicao(): BelongsTo
    {
        return $this->belongsTo(EdicaoFesta::class, 'id_edicao_festa', 'id_edicao');
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(CategoriaEvento::class, 'id_categoria', 'id_categoria');
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(LocalFesta::class, 'id_local', 'id_local');
    }

    public function atracoes(): BelongsToMany
    {
        return $this->belongsToMany(
            Atracao::class,
            'Evento_Atracao',
            'id_evento',
            'id_atracao',
            'id_evento',
            'id_atracao'
        )->withPivot(['papel_no_evento', 'ordem_apresentacao'])
            ->orderBy('Evento_Atracao.ordem_apresentacao');
    }
}
