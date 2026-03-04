<?php

namespace App\Modules\Roteiros\Models;

use App\Models\User;
use App\Support\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Roteiro extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = [
        'titulo',
        'data',
        'programa',
        'status',
        'observacoes',
        'created_by',
        'updated_by',
    ];

    protected $attributes = [
        'status' => 'rascunho',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'date:Y-m-d',
            'created_at' => 'datetime:Y-m-d\TH:i:s\Z',
            'updated_at' => 'datetime:Y-m-d\TH:i:s\Z',
        ];
    }

    // ── Relationships ────────────────────────────────────

    public function materias(): HasMany
    {
        return $this->hasMany(Materia::class)->orderBy('ordem');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // ── Scopes ───────────────────────────────────────────

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByDate($query, string $date)
    {
        return $query->whereDate('data', $date);
    }

    public function scopeByPrograma($query, string $programa)
    {
        return $query->where('programa', $programa);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('data', today());
    }

    // ── Computed ─────────────────────────────────────────

    public function getTotalMateriasAttribute(): int
    {
        return $this->materias()->count();
    }

    public function getDuracaoTotalAttribute(): string
    {
        $seconds = $this->materias
            ->map(fn($m) => $this->parseDuration($m->duracao))
            ->sum();

        return sprintf('%02d:%02d', intdiv($seconds, 60), $seconds % 60);
    }

    protected function parseDuration(?string $duration): int
    {
        if (!$duration || !str_contains($duration, ':')) {
            return 0;
        }
        [$min, $sec] = explode(':', $duration);
        return (int) $min * 60 + (int) $sec;
    }

    // ── Audit ────────────────────────────────────────────

    public static function getAuditModule(): string
    {
        return 'roteiros';
    }

    public function getAuditResourceName(): string
    {
        return $this->titulo;
    }
}
