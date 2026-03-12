<?php

namespace App\Modules\NewsRadar\Jobs;

use App\Modules\NewsRadar\Enums\RawItemStatus;
use App\Modules\NewsRadar\Enums\SourceRunStatus;
use App\Modules\NewsRadar\Models\NewsRawItem;
use App\Modules\NewsRadar\Models\NewsSource;
use App\Modules\NewsRadar\Models\NewsSourceRun;
use App\Modules\NewsRadar\Services\FeedParserService;
use App\Modules\NewsRadar\Services\ListingDiscoveryService;
use App\Modules\NewsRadar\Services\SitemapParserService;
use App\Modules\NewsRadar\Services\UrlNormalizerService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class FetchNewsSourceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 300;
    public int $backoff = 30;

    private const CIRCUIT_BREAKER_THRESHOLD = 5;

    public function __construct(
        public readonly int $newsSourceId,
    ) {
        $this->queue = 'news-radar';
    }

    public function handle(
        FeedParserService $feedParser,
        SitemapParserService $sitemapParser,
        ListingDiscoveryService $listingDiscovery,
        UrlNormalizerService $urlNormalizer,
    ): void {
        $source = NewsSource::findOrFail($this->newsSourceId);

        // 1. Acquire lock (prevents parallel execution)
        if (!$source->acquireLock($this->timeout)) {
            return; // Another job is running for this source
        }

        // 2. Circuit breaker check
        if ($source->consecutive_failures >= self::CIRCUIT_BREAKER_THRESHOLD) {
            $source->releaseLock();
            return;
        }

        // 3. Create run record
        $run = NewsSourceRun::create([
            'news_source_id' => $source->id,
            'started_at' => now(),
            'status' => SourceRunStatus::Running,
        ]);

        $startTime = microtime(true);
        $itemsFound = 0;
        $itemsNew = 0;
        $discoveryMeta = [
            'mode' => $source->discovery_mode->value,
        ];

        try {
            // 4. Discover URLs based on discovery_mode
            $discoveredItems = $this->discover($source, $feedParser, $sitemapParser, $listingDiscovery, $discoveryMeta);
            $itemsFound = count($discoveredItems);

            // 5. Persist new raw items and dispatch processing jobs
            foreach ($discoveredItems as $item) {
                $rawItem = $this->persistRawItem($source, $run, $item);
                if ($rawItem->wasRecentlyCreated) {
                    $itemsNew++;
                    ProcessNewsItemJob::dispatch($rawItem->id)->onQueue('news-radar');
                } else {
                    // Already exists — update seen timestamps
                    $rawItem->markSeen($run->id);
                }
            }

            // 6. Finalize run
            $responseTimeMs = (int) ((microtime(true) - $startTime) * 1000);
            $run->update([
                'status' => SourceRunStatus::Success,
                'finished_at' => now(),
                'items_found' => $itemsFound,
                'items_new' => $itemsNew,
                'response_time_avg_ms' => $responseTimeMs,
                'meta_json' => $discoveryMeta,
            ]);

            // 7. Update source metrics
            $this->updateSourceMetrics($source, $run, $responseTimeMs, $itemsFound);
            $source->releaseLock();

        } catch (\Throwable $e) {
            $run->update([
                'status' => SourceRunStatus::Failed,
                'finished_at' => now(),
                'items_found' => $itemsFound,
                'items_new' => $itemsNew,
                'error_message' => mb_substr($e->getMessage(), 0, 2000),
                'meta_json' => array_merge($discoveryMeta, [
                    'error_class' => $e::class,
                ]),
            ]);

            $source->update([
                'consecutive_failures' => $source->consecutive_failures + 1,
            ]);

            $source->releaseLock();

            throw $e;
        }
    }

    /**
     * Discover URLs based on the source's discovery_mode.
     */
    private function discover(
        NewsSource $source,
        FeedParserService $feedParser,
        SitemapParserService $sitemapParser,
        ListingDiscoveryService $listingDiscovery,
        array &$meta = [],
    ): array {
        $config = $source->crawling_config ?? [];
        $mode = $source->discovery_mode->value;
        $meta['mode'] = $mode;

        if ($mode === 'auto') {
            // Try feed → sitemap → listing (stop at first success)
            $items = $this->discoverViaFeed($config, $feedParser, $meta, false);
            if (!empty($items)) return $items;

            $items = $this->discoverViaSitemap($config, $sitemapParser);
            if (!empty($items)) return $items;

            return $this->discoverViaListing($config, $listingDiscovery, $source->id);
        }

        return match ($mode) {
            'feed' => $this->discoverViaFeed($config, $feedParser, $meta, true),
            'sitemap' => $this->discoverViaSitemap($config, $sitemapParser),
            'html_listing' => $this->discoverViaListing($config, $listingDiscovery, $source->id),
            default => [],
        };
    }

    private function discoverViaFeed(array $config, FeedParserService $feedParser, array &$meta = [], bool $throwOnFailure = false): array
    {
        $feedUrl = $config['feed_url'] ?? null;
        if (!$feedUrl) return [];

        $meta['feed_url'] = $feedUrl;
        $result = $feedParser->parseFromUrl($feedUrl);
        $meta['feed_items_count'] = $result->count();
        $meta['feed_error'] = $result->error;

        if (!$result->success) {
            if ($throwOnFailure) {
                throw new \RuntimeException($result->error ?: 'Falha ao processar o feed da fonte.');
            }

            return [];
        }

        return array_map(fn ($item) => [
            'raw_url' => $item->rawUrl,
            'normalized_url' => $item->normalizedUrl,
            'url_hash' => $item->urlHash,
            'guid' => $item->guid,
            'title_raw' => $item->title,
            'body_raw' => $item->bodyHtml,
            'raw_payload' => $item->rawPayload,
        ], $result->items);
    }

    private function discoverViaSitemap(array $config, SitemapParserService $sitemapParser): array
    {
        $sitemapUrl = $config['sitemap_url'] ?? null;
        if (!$sitemapUrl) return [];

        $items = $sitemapParser->parse(
            $sitemapUrl,
            $config['article_url_patterns'] ?? [],
            $config['ignore_url_patterns'] ?? [],
        );

        return array_map(fn ($item) => [
            'raw_url' => $item->rawUrl,
            'normalized_url' => $item->normalizedUrl,
            'url_hash' => $item->urlHash,
            'guid' => null,
            'title_raw' => $item->title,
            'body_raw' => null,
            'raw_payload' => [
                'sitemap_lastmod' => $item->lastmod,
                'sitemap_pub_date' => $item->publicationDate,
                'sitemap_keywords' => $item->keywords,
            ],
        ], $items);
    }

    private function discoverViaListing(array $config, ListingDiscoveryService $listingService, int $sourceId): array
    {
        $items = $listingService->discover($config, $sourceId);

        return array_map(fn ($item) => [
            'raw_url' => $item->rawUrl,
            'normalized_url' => $item->normalizedUrl,
            'url_hash' => $item->urlHash,
            'guid' => null,
            'title_raw' => $item->title,
            'body_raw' => null,
            'raw_payload' => [
                'listing_image' => $item->imageUrl,
                'listing_excerpt' => $item->excerpt,
            ],
        ], $items);
    }

    /**
     * Persist or update a raw item (Model 1: canonical unique per source).
     */
    private function persistRawItem(NewsSource $source, NewsSourceRun $run, array $data): NewsRawItem
    {
        return NewsRawItem::firstOrCreate(
            [
                'news_source_id' => $source->id,
                'url_hash' => $data['url_hash'],
            ],
            [
                'news_source_run_id' => $run->id,
                'last_seen_run_id' => $run->id,
                'raw_url' => $data['raw_url'],
                'normalized_url' => $data['normalized_url'],
                'guid' => $data['guid'],
                'title_raw' => $data['title_raw'],
                'body_raw' => $data['body_raw'],
                'raw_payload' => $data['raw_payload'],
                'first_seen_at' => now(),
                'last_seen_at' => now(),
                'processing_status' => RawItemStatus::Pending,
            ]
        );
    }

    private function updateSourceMetrics(NewsSource $source, NewsSourceRun $run, int $responseTimeMs, int $itemsFound): void
    {
        // Calculate next_sync_at based on throttle_config
        $throttle = $source->throttle_config ?? [];
        $intervalMin = $throttle['crawl_interval_min'] ?? 30;
        $intervalMax = $throttle['crawl_interval_max'] ?? 120;

        // Simple auto-adjust: if found items, use min interval; if not, use max
        $nextInterval = $itemsFound > 0 ? $intervalMin : $intervalMax;

        $source->update([
            'last_sync_at' => now(),
            'next_sync_at' => now()->addMinutes($nextInterval),
            'consecutive_failures' => 0,
            'success_rate' => $this->calculateSuccessRate($source),
            'avg_response_ms' => $responseTimeMs,
            'last_items_found' => $itemsFound,
        ]);
    }

    private function calculateSuccessRate(NewsSource $source): float
    {
        $recentRuns = NewsSourceRun::where('news_source_id', $source->id)
            ->orderByDesc('started_at')
            ->limit(20)
            ->get();

        if ($recentRuns->isEmpty()) return 100;

        $successCount = $recentRuns->whereIn('status', [SourceRunStatus::Success, SourceRunStatus::Partial])->count();
        return round($successCount / $recentRuns->count() * 100, 1);
    }
}
