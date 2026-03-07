<?php

namespace App\Modules\Alertas\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AlertDispatchRun extends Model
{
    use HasUlids;

    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_PARTIAL = 'partial';
    public const STATUS_SUCCESS = 'success';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    public const TRIGGER_SCHEDULER = 'scheduler';
    public const TRIGGER_MANUAL = 'manual';
    public const TRIGGER_RETRY = 'retry';

    protected $table = 'alert_dispatch_runs';

    protected $fillable = [
        'alert_id',
        'schedule_rule_id',
        'trigger_type',
        'source_log_id',
        'source_context',
        'scheduled_for',
        'idempotency_key',
        'status',
        'destinations_total',
        'destinations_success',
        'destinations_failed',
        'started_at',
        'finished_at',
        'error_message',
        'created_by',
    ];

    protected $casts = [
        'source_context' => 'array',
        'scheduled_for' => 'datetime',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function alert(): BelongsTo
    {
        return $this->belongsTo(Alert::class);
    }

    public function scheduleRule(): BelongsTo
    {
        return $this->belongsTo(AlertScheduleRule::class, 'schedule_rule_id');
    }

    public function sourceLog(): BelongsTo
    {
        return $this->belongsTo(AlertDispatchLog::class, 'source_log_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(AlertDispatchLog::class, 'dispatch_run_id');
    }
}
