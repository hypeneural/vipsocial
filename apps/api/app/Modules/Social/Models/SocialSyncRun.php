<?php

namespace App\Modules\Social\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SocialSyncRun extends Model
{
    use HasUlids;

    public const STATUS_PENDING = 'PENDING';
    public const STATUS_RUNNING = 'RUNNING';
    public const STATUS_SUCCEEDED = 'SUCCEEDED';
    public const STATUS_FAILED = 'FAILED';

    protected $table = 'social_sync_runs';

    protected $fillable = [
        'social_profile_id',
        'metric_date',
        'status',
        'apify_run_id',
        'apify_dataset_id',
        'normalizer_type',
        'normalizer_version',
        'raw_item_hash',
        'started_at',
        'finished_at',
        'usage_total_usd',
        'compute_units',
        'pricing_model',
        'error_message',
        'raw_run',
        'raw_item',
        'normalized_payload',
    ];

    protected $casts = [
        'metric_date' => 'date',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'usage_total_usd' => 'decimal:6',
        'compute_units' => 'decimal:6',
        'raw_run' => 'array',
        'raw_item' => 'array',
        'normalized_payload' => 'array',
    ];

    public function profile(): BelongsTo
    {
        return $this->belongsTo(SocialProfile::class, 'social_profile_id');
    }

    public function snapshot(): HasOne
    {
        return $this->hasOne(SocialProfileSnapshot::class);
    }
}
