<?php

namespace App\Modules\Alertas\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AlertScheduleRule extends Model
{
    public const TYPE_WEEKLY = 'weekly';
    public const TYPE_SPECIFIC_DATE = 'specific_date';

    protected $table = 'alert_schedule_rules';

    protected $fillable = [
        'alert_id',
        'schedule_type',
        'day_of_week',
        'specific_date',
        'time_hhmm',
        'rule_key',
        'active',
    ];

    protected $casts = [
        'specific_date' => 'date',
        'active' => 'boolean',
    ];

    public function alert(): BelongsTo
    {
        return $this->belongsTo(Alert::class);
    }

    public function dispatchRuns(): HasMany
    {
        return $this->hasMany(AlertDispatchRun::class, 'schedule_rule_id');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
