<?php

namespace App\Modules\Alertas\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Alert extends Model
{
    protected $table = 'alerts';

    protected $fillable = [
        'title',
        'message',
        'active',
        'archived_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'active' => 'boolean',
        'archived_at' => 'datetime',
    ];

    public function destinations(): BelongsToMany
    {
        return $this->belongsToMany(
            AlertDestination::class,
            'alert_destination_links',
            'alert_id',
            'destination_id'
        )->withTimestamps();
    }

    public function scheduleRules(): HasMany
    {
        return $this->hasMany(AlertScheduleRule::class);
    }

    public function dispatchRuns(): HasMany
    {
        return $this->hasMany(AlertDispatchRun::class);
    }

    public function scopeNotArchived($query)
    {
        return $query->whereNull('archived_at');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true)->whereNull('archived_at');
    }
}
