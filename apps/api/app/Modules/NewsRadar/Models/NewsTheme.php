<?php

namespace App\Modules\NewsRadar\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NewsTheme extends Model
{
    protected $fillable = [
        'slug',
        'label',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function aiMetadata(): HasMany
    {
        return $this->hasMany(NewsItemAiMetadata::class);
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}
