<?php

namespace App\Modules\Config\Models;

use App\Support\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;

class EquipmentStatus extends Model
{
    use Auditable;
    protected $fillable = ['name', 'slug', 'icon', 'color', 'sort_order'];

    public function equipments()
    {
        return $this->hasMany(Equipment::class, 'status_id');
    }

    public static function getAuditModule(): string
    {
        return 'equipamentos';
    }
}
