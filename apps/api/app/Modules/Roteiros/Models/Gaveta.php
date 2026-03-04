<?php

namespace App\Modules\Roteiros\Models;

use App\Support\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Gaveta extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = ['nome', 'descricao', 'active'];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'created_at' => 'datetime:Y-m-d\TH:i:s\Z',
            'updated_at' => 'datetime:Y-m-d\TH:i:s\Z',
        ];
    }

    public function noticias(): HasMany
    {
        return $this->hasMany(NoticiaGaveta::class)->orderBy('ordem');
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
        return $this->nome;
    }
}
