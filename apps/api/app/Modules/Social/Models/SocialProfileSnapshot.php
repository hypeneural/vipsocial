<?php

namespace App\Modules\Social\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SocialProfileSnapshot extends Model
{
    use HasUlids;

    protected $table = 'social_profile_snapshots';

    protected $fillable = [
        'social_profile_id',
        'social_sync_run_id',
        'metric_date',
        'captured_at',
    ];

    protected $casts = [
        'metric_date' => 'date',
        'captured_at' => 'datetime',
    ];

    public function profile(): BelongsTo
    {
        return $this->belongsTo(SocialProfile::class, 'social_profile_id');
    }

    public function syncRun(): BelongsTo
    {
        return $this->belongsTo(SocialSyncRun::class, 'social_sync_run_id');
    }

    public function metricValues(): HasMany
    {
        return $this->hasMany(SocialProfileMetricValue::class);
    }
}
