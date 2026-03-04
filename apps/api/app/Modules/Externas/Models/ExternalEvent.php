<?php

namespace App\Modules\Externas\Models;

use App\Models\User;
use App\Modules\Config\Models\Equipment;
use App\Support\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;

class ExternalEvent extends Model
{
    use Auditable;

    protected $table = 'external_events';

    protected $fillable = [
        'titulo',
        'category_id',
        'status_id',
        'briefing',
        'data_hora',
        'data_hora_fim',
        'local',
        'endereco_completo',
        'contato_nome',
        'contato_whatsapp',
        'observacao_interna',
    ];

    protected $casts = [
        'data_hora' => 'datetime',
        'data_hora_fim' => 'datetime',
    ];

    // ── Relationships ────────────────────────────

    public function category()
    {
        return $this->belongsTo(EventCategory::class, 'category_id');
    }

    public function status()
    {
        return $this->belongsTo(EventStatus::class, 'status_id');
    }

    public function collaborators()
    {
        return $this->belongsToMany(User::class, 'event_collaborators', 'event_id', 'user_id')
            ->withPivot('funcao')
            ->withTimestamps();
    }

    public function equipment()
    {
        return $this->belongsToMany(Equipment::class, 'event_equipment', 'event_id', 'equipment_id')
            ->withPivot('checked')
            ->withTimestamps();
    }

    public function activityLogs()
    {
        return $this->hasMany(EventActivityLog::class, 'event_id')->orderBy('created_at', 'desc');
    }

    public static function getAuditModule(): string
    {
        return 'externas';
    }

    public function getAuditResourceName(): string
    {
        return $this->titulo;
    }
}
