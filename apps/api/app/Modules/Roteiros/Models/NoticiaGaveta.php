<?php

namespace App\Modules\Roteiros\Models;

use App\Support\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NoticiaGaveta extends Model
{
    use Auditable;

    protected $table = 'noticias_gaveta';

    protected $fillable = ['gaveta_id', 'titulo', 'conteudo', 'ordem', 'is_checked'];

    protected function casts(): array
    {
        return [
            'ordem' => 'integer',
            'is_checked' => 'boolean',
            'created_at' => 'datetime:Y-m-d\TH:i:s\Z',
            'updated_at' => 'datetime:Y-m-d\TH:i:s\Z',
        ];
    }

    public function gaveta(): BelongsTo
    {
        return $this->belongsTo(Gaveta::class);
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
