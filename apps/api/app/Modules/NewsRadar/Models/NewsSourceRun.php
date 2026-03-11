<?php

namespace App\Modules\NewsRadar\Models;

use App\Modules\NewsRadar\Enums\SourceRunStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NewsSourceRun extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'news_source_id',
        'started_at',
        'finished_at',
        'status',
        'items_found',
        'items_new',
        'items_failed',
        'response_time_avg_ms',
        'error_message',
        'meta_json',
    ];

    protected $casts = [
        'status' => SourceRunStatus::class,
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'items_found' => 'integer',
        'items_new' => 'integer',
        'items_failed' => 'integer',
        'response_time_avg_ms' => 'integer',
        'meta_json' => 'array',
    ];

    public function source(): BelongsTo
    {
        return $this->belongsTo(NewsSource::class, 'news_source_id');
    }

    public function rawItems(): HasMany
    {
        return $this->hasMany(NewsRawItem::class, 'news_source_run_id');
    }

    public function durationSeconds(): ?int
    {
        if (!$this->started_at || !$this->finished_at) {
            return null;
        }

        return $this->started_at->diffInSeconds($this->finished_at);
    }
}
