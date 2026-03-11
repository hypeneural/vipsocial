<?php

namespace App\Modules\NewsRadar\Models;

use App\Modules\NewsRadar\Enums\MediaType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewsItemMedia extends Model
{
    protected $table = 'news_item_media';

    protected $fillable = [
        'news_item_id',
        'type',
        'url',
        'width',
        'height',
        'alt_text',
        'position',
    ];

    protected $casts = [
        'type' => MediaType::class,
        'width' => 'integer',
        'height' => 'integer',
        'position' => 'integer',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(NewsItem::class, 'news_item_id');
    }
}
