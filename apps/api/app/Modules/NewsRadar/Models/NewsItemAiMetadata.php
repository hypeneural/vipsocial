<?php

namespace App\Modules\NewsRadar\Models;

use App\Modules\NewsRadar\Enums\Urgency;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewsItemAiMetadata extends Model
{
    protected $table = 'news_item_ai_metadata';

    protected $fillable = [
        'news_item_id',
        'city',
        'state_abbr',
        'news_theme_id',
        'urgency',
        'relevance_score',
        'entities',
        'five_ws',
        'suggested_titles',
        'summary_bullets',
        'ai_model_used',
        'ai_tokens_used',
        'enrichment_level',
    ];

    protected $casts = [
        'urgency' => Urgency::class,
        'relevance_score' => 'float',
        'entities' => 'array',
        'five_ws' => 'array',
        'suggested_titles' => 'array',
        'summary_bullets' => 'array',
        'ai_tokens_used' => 'integer',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(NewsItem::class, 'news_item_id');
    }

    public function theme(): BelongsTo
    {
        return $this->belongsTo(NewsTheme::class, 'news_theme_id');
    }
}
