<?php

namespace App\Modules\Config\Models;

use App\Support\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;

class EquipmentCategory extends Model
{
    use Auditable;
    protected $fillable = ['name', 'slug', 'icon', 'sort_order'];

    public function equipments()
    {
        return $this->hasMany(Equipment::class, 'category_id');
    }

    public static function getAuditModule(): string
    {
        return 'equipamentos';
    }
}
