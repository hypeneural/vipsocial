<?php

namespace App\Modules\NewsRadar\Models;

use App\Modules\NewsRadar\Enums\ContentSource;
use App\Modules\NewsRadar\Enums\EnrichmentStatus;
use App\Modules\NewsRadar\Enums\ExtractionStatus;
use App\Modules\NewsRadar\Enums\PublishedAtSource;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class NewsItem extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'news_source_id',
        'news_raw_item_id',
        'public_token',
        'url',
        'url_hash',
        'raw_url',
        'guid',
        'title',
        'subtitle',
        'author_raw',
        'author_normalized',
        'body_html',
        'body_text',
        'excerpt',
        'hero_image_url',
        'categories_raw',
        'language',
        'published_at_raw',
        'published_at_parsed',
        'published_at_utc',
        'published_at_timezone',
        'published_at_source',
        'modified_at_raw',
        'modified_at_utc',
        'extraction_completeness',
        'content_source',
        'extraction_status',
        'enrichment_status',
        'is_duplicate_candidate',
        'duplicate_of_news_item_id',
    ];

    protected $casts = [
        'categories_raw' => 'array',
        'published_at_parsed' => 'datetime',
        'published_at_utc' => 'datetime',
        'published_at_source' => PublishedAtSource::class,
        'modified_at_utc' => 'datetime',
        'extraction_completeness' => 'integer',
        'content_source' => ContentSource::class,
        'extraction_status' => ExtractionStatus::class,
        'enrichment_status' => EnrichmentStatus::class,
        'is_duplicate_candidate' => 'boolean',
    ];

    // ── Boot ──────────────────────────────────────

    protected static function booted(): void
    {
        static::creating(function (NewsItem $item) {
            $item->public_token ??= (string) Str::uuid();
        });
    }

    // ── Relationships ──────────────────────────────

    public function source(): BelongsTo
    {
        return $this->belongsTo(NewsSource::class, 'news_source_id');
    }

    public function rawItem(): BelongsTo
    {
        return $this->belongsTo(NewsRawItem::class, 'news_raw_item_id');
    }

    public function aiMetadata(): HasOne
    {
        return $this->hasOne(NewsItemAiMetadata::class);
    }

    public function aiLogs(): HasMany
    {
        return $this->hasMany(NewsItemAiLog::class)->latest('created_at');
    }

    public function media(): HasMany
    {
        return $this->hasMany(NewsItemMedia::class)->orderBy('position');
    }

    public function clusters(): BelongsToMany
    {
        return $this->belongsToMany(NewsCluster::class, 'news_cluster_items')
            ->withPivot('similarity_score');
    }

    // Self-reference for duplicates
    public function duplicateOf(): BelongsTo
    {
        return $this->belongsTo(self::class, 'duplicate_of_news_item_id');
    }

    public function duplicates(): HasMany
    {
        return $this->hasMany(self::class, 'duplicate_of_news_item_id');
    }

    // ── Scopes ─────────────────────────────────────

    public function scopeExtracted($query)
    {
        return $query->where('extraction_status', ExtractionStatus::Extracted);
    }

    public function scopeNeedsEnrichment($query)
    {
        return $query->extracted()
            ->where('enrichment_status', EnrichmentStatus::None);
    }

    public function scopeRecent($query, int $hours = 24)
    {
        return $query->where('published_at_utc', '>=', now()->subHours($hours));
    }

    // ── Helpers ────────────────────────────────────

    public function heroImage(): ?NewsItemMedia
    {
        return $this->media()->where('type', 'hero')->first();
    }
}
