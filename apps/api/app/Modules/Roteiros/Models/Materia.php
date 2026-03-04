<?php

namespace App\Modules\Roteiros\Models;

use App\Support\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Materia extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'roteiro_id',
        'categoria_id',
        'shortcut',
        'titulo',
        'descricao',
        'duracao',
        'status',
        'creditos_gc',
        'ordem',
    ];

    protected function casts(): array
    {
        return [
            'ordem' => 'integer',
            'created_at' => 'datetime:Y-m-d\TH:i:s\Z',
            'updated_at' => 'datetime:Y-m-d\TH:i:s\Z',
        ];
    }

    public function roteiro(): BelongsTo
    {
        return $this->belongsTo(Roteiro::class);
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public static function getAuditModule(): string
    {
        return 'roteiros';
    }

    public function getAuditResourceName(): string
    {
        return $this->titulo;
    }
}
