<?php

namespace App\Modules\Externas\Models;

use App\Support\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;

class EventCategory extends Model
{
    use Auditable;
    protected $fillable = [
        'name',
        'slug',
        'icon',
        'color',
        'sort_order',
    ];

    public function events()
    {
        return $this->hasMany(ExternalEvent::class, 'category_id');
    }

    public static function getAuditModule(): string
    {
        return 'externas';
    }
}
