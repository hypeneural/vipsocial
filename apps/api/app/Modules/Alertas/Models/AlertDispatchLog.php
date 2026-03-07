<?php

namespace App\Modules\Alertas\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlertDispatchLog extends Model
{
    use HasUlids;

    public const STATUS_PENDING = 'pending';
    public const STATUS_SUCCESS = 'success';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_SKIPPED = 'skipped';

    protected $table = 'alert_dispatch_logs';

    protected $fillable = [
        'dispatch_run_id',
        'alert_id',
        'destination_id',
        'alert_title_snapshot',
        'destination_name_snapshot',
        'target_kind',
        'target_value',
        'message_snapshot',
        'status',
        'provider',
        'provider_zaap_id',
        'provider_message_id',
        'provider_response_id',
        'provider_status_code',
        'provider_response',
        'error_message',
        'sent_at',
    ];

    protected $casts = [
        'provider_response' => 'array',
        'sent_at' => 'datetime',
    ];

    public function run(): BelongsTo
    {
        return $this->belongsTo(AlertDispatchRun::class, 'dispatch_run_id');
    }

    public function alert(): BelongsTo
    {
        return $this->belongsTo(Alert::class);
    }

    public function destination(): BelongsTo
    {
        return $this->belongsTo(AlertDestination::class, 'destination_id');
    }
}
