<?php

namespace App\Modules\Social\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SocialProfileMetricValue extends Model
{
    use HasUlids;

    protected $table = 'social_profile_metric_values';

    protected $fillable = [
        'social_profile_snapshot_id',
        'social_metric_definition_id',
        'value_number',
        'value_text',
        'value_json',
        'raw_key',
    ];

    protected $casts = [
        'value_number' => 'decimal:4',
        'value_json' => 'array',
    ];

    public function snapshot(): BelongsTo
    {
        return $this->belongsTo(SocialProfileSnapshot::class, 'social_profile_snapshot_id');
    }

    public function definition(): BelongsTo
    {
        return $this->belongsTo(SocialMetricDefinition::class, 'social_metric_definition_id');
    }
}
