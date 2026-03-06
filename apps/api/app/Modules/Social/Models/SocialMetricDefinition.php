<?php

namespace App\Modules\Social\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SocialMetricDefinition extends Model
{
    use HasUlids;

    protected $table = 'social_metric_definitions';

    protected $fillable = [
        'code',
        'label',
        'value_type',
        'unit',
        'metric_group',
        'is_primary_candidate',
        'sort_order',
    ];

    protected $casts = [
        'is_primary_candidate' => 'boolean',
    ];

    public function values(): HasMany
    {
        return $this->hasMany(SocialProfileMetricValue::class);
    }
}
