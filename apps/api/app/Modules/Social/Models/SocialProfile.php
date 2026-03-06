<?php

namespace App\Modules\Social\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SocialProfile extends Model
{
    use HasUlids;

    protected $table = 'social_profiles';

    protected $fillable = [
        'provider',
        'provider_resource_type',
        'provider_resource_id',
        'task_input_override',
        'network',
        'handle',
        'display_name',
        'external_profile_id',
        'url',
        'avatar_url',
        'primary_metric_code',
        'normalizer_type',
        'normalizer_config',
        'sort_order',
        'is_active',
        'last_synced_at',
    ];

    protected $casts = [
        'task_input_override' => 'array',
        'normalizer_config' => 'array',
        'is_active' => 'boolean',
        'last_synced_at' => 'datetime',
    ];

    public function syncRuns(): HasMany
    {
        return $this->hasMany(SocialSyncRun::class);
    }

    public function snapshots(): HasMany
    {
        return $this->hasMany(SocialProfileSnapshot::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
