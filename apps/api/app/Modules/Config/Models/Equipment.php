<?php

namespace App\Modules\Config\Models;

use App\Modules\Externas\Models\ExternalEvent;
use App\Support\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    use Auditable;

    protected $table = 'equipments';

    protected $fillable = [
        'nome',
        'category_id',
        'marca',
        'modelo',
        'patrimonio',
        'status_id',
        'observacoes',
    ];

    public function category()
    {
        return $this->belongsTo(EquipmentCategory::class, 'category_id');
    }

    public function status()
    {
        return $this->belongsTo(EquipmentStatus::class, 'status_id');
    }

    public function events()
    {
        return $this->belongsToMany(ExternalEvent::class, 'event_equipment', 'equipment_id', 'event_id')
            ->withPivot('checked')
            ->withTimestamps();
    }

    public static function getAuditModule(): string
    {
        return 'equipamentos';
    }

    public function getAuditResourceName(): string
    {
        return $this->nome;
    }
}
