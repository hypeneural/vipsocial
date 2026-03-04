<?php

namespace App\Modules\Externas\Models;

use App\Support\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;

class EventStatus extends Model
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
        return $this->hasMany(ExternalEvent::class, 'status_id');
    }

    public static function getAuditModule(): string
    {
        return 'externas';
    }
}
