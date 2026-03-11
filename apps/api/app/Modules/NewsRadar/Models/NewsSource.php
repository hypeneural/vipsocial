<?php

namespace App\Modules\NewsRadar\Models;

use App\Modules\NewsRadar\Enums\DiscoveryMode;
use App\Modules\NewsRadar\Enums\FeedQualityProfile;
use App\Modules\NewsRadar\Enums\FetchDetailMode;
use App\Modules\NewsRadar\Enums\SourceType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class NewsSource extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'homepage_url',
        'active',
        'source_type',
        'discovery_mode',
        'feed_quality_profile',
        'fetch_detail_mode',
        'source_preset',
        'crawling_config',
        'throttle_config',
        'timezone_default',
        'date_formats',
        'render_js_required',
        'last_sync_at',
        'next_sync_at',
        'sync_locked_until',
        'consecutive_failures',
        'success_rate',
        'avg_response_ms',
        'last_items_found',
        'notes',
    ];

    protected $casts = [
        'active' => 'boolean',
        'source_type' => SourceType::class,
        'discovery_mode' => DiscoveryMode::class,
        'feed_quality_profile' => FeedQualityProfile::class,
        'fetch_detail_mode' => FetchDetailMode::class,
        'crawling_config' => 'array',
        'throttle_config' => 'array',
        'date_formats' => 'array',
        'render_js_required' => 'boolean',
        'last_sync_at' => 'datetime',
        'next_sync_at' => 'datetime',
        'sync_locked_until' => 'datetime',
        'consecutive_failures' => 'integer',
        'success_rate' => 'float',
        'avg_response_ms' => 'integer',
        'last_items_found' => 'integer',
    ];

    // ── Relationships ──────────────────────────────

    public function items(): HasMany
    {
        return $this->hasMany(NewsItem::class);
    }

    public function rawItems(): HasMany
    {
        return $this->hasMany(NewsRawItem::class);
    }

    public function runs(): HasMany
    {
        return $this->hasMany(NewsSourceRun::class)->orderByDesc('started_at');
    }

    // ── Scopes ─────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeDueForSync($query)
    {
        return $query->active()
            ->where('next_sync_at', '<=', now())
            ->where(function ($q) {
                $q->whereNull('sync_locked_until')
                  ->orWhere('sync_locked_until', '<', now());
            });
    }

    public function scopeHealthy($query)
    {
        return $query->where('consecutive_failures', '<', 5);
    }

    // ── Helpers ────────────────────────────────────

    public function isLocked(): bool
    {
        return $this->sync_locked_until && $this->sync_locked_until->isFuture();
    }

    public function acquireLock(int $timeoutSeconds = 300): bool
    {
        if ($this->isLocked()) {
            return false;
        }

        $this->update(['sync_locked_until' => now()->addSeconds($timeoutSeconds)]);
        return true;
    }

    public function releaseLock(): void
    {
        $this->update(['sync_locked_until' => null]);
    }
}
