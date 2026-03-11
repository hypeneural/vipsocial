<?php

namespace App\Modules\NewsRadar\Models;

use App\Modules\NewsRadar\Enums\RawItemStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class NewsRawItem extends Model
{
    protected $fillable = [
        'news_source_id',
        'news_source_run_id',
        'last_seen_run_id',
        'raw_url',
        'normalized_url',
        'url_hash',
        'guid',
        'title_raw',
        'body_raw',
        'raw_payload',
        'first_seen_at',
        'last_seen_at',
        'seen_count',
        'processing_status',
        'fetch_attempts',
        'last_fetch_error',
        'last_fetch_at',
    ];

    protected $casts = [
        'raw_payload' => 'array',
        'processing_status' => RawItemStatus::class,
        'first_seen_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'last_fetch_at' => 'datetime',
        'seen_count' => 'integer',
        'fetch_attempts' => 'integer',
    ];

    // ── Relationships ──────────────────────────────

    public function source(): BelongsTo
    {
        return $this->belongsTo(NewsSource::class, 'news_source_id');
    }

    public function discoveryRun(): BelongsTo
    {
        return $this->belongsTo(NewsSourceRun::class, 'news_source_run_id');
    }

    public function lastSeenRun(): BelongsTo
    {
        return $this->belongsTo(NewsSourceRun::class, 'last_seen_run_id');
    }

    public function newsItem(): HasOne
    {
        return $this->hasOne(NewsItem::class);
    }

    // ── Scopes ─────────────────────────────────────

    public function scopePending($query)
    {
        return $query->where('processing_status', RawItemStatus::Pending);
    }

    public function scopeFailed($query)
    {
        return $query->where('processing_status', RawItemStatus::Failed);
    }

    // ── Helpers ────────────────────────────────────

    public function markSeen(int $runId): void
    {
        $this->update([
            'last_seen_at' => now(),
            'last_seen_run_id' => $runId,
            'seen_count' => $this->seen_count + 1,
        ]);
    }

    public function markProcessing(): void
    {
        $this->update([
            'processing_status' => RawItemStatus::Processing,
            'fetch_attempts' => $this->fetch_attempts + 1,
            'last_fetch_at' => now(),
        ]);
    }

    public function markPromoted(): void
    {
        $this->update(['processing_status' => RawItemStatus::Promoted]);
    }

    public function markFailed(string $error): void
    {
        $this->update([
            'processing_status' => RawItemStatus::Failed,
            'last_fetch_error' => $error,
        ]);
    }
}
