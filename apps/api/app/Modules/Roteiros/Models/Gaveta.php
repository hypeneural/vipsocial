<?php

namespace App\Modules\Roteiros\Models;

use App\Models\User;
use App\Support\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Gaveta extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = ['titulo', 'descricao', 'active', 'is_checked', 'user_id'];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'is_checked' => 'boolean',
            'created_at' => 'datetime:Y-m-d\TH:i:s\Z',
            'updated_at' => 'datetime:Y-m-d\TH:i:s\Z',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
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
