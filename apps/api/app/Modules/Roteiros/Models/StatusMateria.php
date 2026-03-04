<?php

namespace App\Modules\Roteiros\Models;

use App\Support\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StatusMateria extends Model
{
    use HasFactory, Auditable;

    protected $table = 'status_materias';

    protected $fillable = ['nome', 'slug', 'icone', 'cor', 'ordem', 'active'];

    protected function casts(): array
    {
        return [
            'ordem' => 'integer',
            'active' => 'boolean',
            'created_at' => 'datetime:Y-m-d\TH:i:s\Z',
            'updated_at' => 'datetime:Y-m-d\TH:i:s\Z',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('ordem');
    }

    public static function getAuditModule(): string
    {
        return 'status-materias';
    }

    public function getAuditResourceName(): string
    {
        return $this->nome;
    }
}
