<?php

namespace App\Modules\Analytics\Services;

use App\Modules\Analytics\Clients\AnalyticsClientInterface;
use App\Modules\Analytics\Exceptions\AnalyticsUnavailableException;
use App\Modules\Analytics\Support\CacheKeyBuilder;
use App\Modules\Analytics\Support\DateRangeResolver;
use App\Modules\Analytics\Support\TrafficSourceNormalizer;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Throwable;

class AnalyticsService
{
    private readonly string $propertyId;
    private readonly string $timezone;

    public function __construct(
        private readonly AnalyticsClientInterface $client,
        private readonly TrafficSourceNormalizer $trafficSourceNormalizer
    )
    {
        $this->propertyId = (string) config('analytics.property_id', 'unknown');
        $this->timezone = (string) env('ANALYTICS_TIMEZONE', (string) config('app.timezone', 'UTC'));
    }

    public function overview(array $query, array $includes): array
    {
        $includes = array_values(array_intersect($includes, ['kpis', 'top_pages', 'cities', 'acquisition', 'realtime']));
        if (empty($includes)) {
            $includes = ['kpis', 'top_pages', 'realtime'];
        }

        $segments = [];
        $segmentMeta = [];

        foreach ($includes as $include) {
            if ($include === 'kpis') {
                $result = $this->kpis($query);
            } elseif ($include === 'top_pages') {
                $result = $this->topPages($query);
            } elseif ($include === 'cities') {
                $result = $this->cities($query);
            } elseif ($include === 'acquisition') {
                $result = $this->acquisition($query);
            } else {
                $result = $this->realtime($query);
            }

            $segments[$include] = $result['data'];
            $segmentMeta[] = $result['meta'];
        }

        $source = collect($segmentMeta)->every(fn(array $meta) => ($meta['source'] ?? 'ga4') === 'cache')
            ? 'cache'
            : 'ga4';
        $stale = collect($segmentMeta)->contains(fn(array $meta) => (bool) ($meta['stale'] ?? false));
        $cacheTtl = (int) collect($segmentMeta)->pluck('cache_ttl_sec')->filter()->min();

        $dateContext = DateRangeResolver::resolve($query, $this->timezone);

        return [
            'data' => $segments,
            'meta' => $this->buildMeta($dateContext, $query['compare'] ?? 'none', $source, $stale, $cacheTtl),
        ];
    }

    public function kpis(array $query): array
    {
        $dateContext = DateRangeResolver::resolve($query, $this->timezone);
        $payload = array_merge($query, ['date_context' => $dateContext]);

        return $this->withCache(
            endpoint: 'kpis',
            query: $payload,
            ttlSec: (int) env('ANALYTICS_CACHE_TTL_KPIS', 600),
            resolver: fn() => $this->client->fetchKpis($payload)
        );
    }

    public function topPages(array $query): array
    {
        $dateContext = DateRangeResolver::resolve($query, $this->timezone);
        $payload = array_merge($query, ['date_context' => $dateContext]);

        return $this->withCache(
            endpoint: 'top_pages',
            query: $payload,
            ttlSec: (int) env('ANALYTICS_CACHE_TTL_TOP_PAGES', 1800),
            resolver: fn() => $this->client->fetchTopPages($payload)
        );
    }

    public function cities(array $query): array
    {
        $dateContext = DateRangeResolver::resolve($query, $this->timezone);
        $payload = array_merge($query, ['date_context' => $dateContext]);

        return $this->withCache(
            endpoint: 'cities',
            query: $payload,
            ttlSec: (int) env('ANALYTICS_CACHE_TTL_CITIES', 600),
            resolver: fn() => $this->client->fetchCities($payload)
        );
    }

    public function acquisition(array $query): array
    {
        $dateContext = DateRangeResolver::resolve($query, $this->timezone);
        $payload = array_merge($query, [
            'date_context' => $dateContext,
            'normalization_version' => 'acquisition_v2',
        ]);
        $limit = (int) ($payload['limit'] ?? 10);

        return $this->withCache(
            endpoint: 'acquisition',
            query: $payload,
            ttlSec: (int) env('ANALYTICS_CACHE_TTL_ACQUISITION', 1800),
            resolver: fn() => $this->normalizeAcquisitionPayload($this->client->fetchAcquisition($payload), $limit)
        );
    }

    public function realtime(array $query = []): array
    {
        return $this->withCache(
            endpoint: 'realtime',
            query: ['scope' => '30m'],
            ttlSec: (int) env('ANALYTICS_CACHE_TTL_REALTIME', 20),
            resolver: fn() => $this->client->fetchRealtime($query)
        );
    }

    public function timeseries(array $query, array $metrics = []): array
    {
        $dateContext = DateRangeResolver::resolve($query, $this->timezone);
        $resolvedMetrics = !empty($metrics) ? $metrics : (isset($query['metric']) ? [(string) $query['metric']] : []);
        $payload = array_merge($query, [
            'date_context' => $dateContext,
            'metrics' => $resolvedMetrics,
        ]);

        return $this->withCache(
            endpoint: 'timeseries',
            query: $payload,
            ttlSec: (int) env('ANALYTICS_CACHE_TTL_TIMESERIES', 900),
            resolver: fn() => $this->client->fetchTimeseries($payload)
        );
    }

    private function withCache(string $endpoint, array $query, int $ttlSec, callable $resolver): array
    {
        $baseKey = CacheKeyBuilder::build($this->propertyId, $endpoint, $query);
        $freshKey = "{$baseKey}:fresh";
        $staleKey = "{$baseKey}:stale";
        $staleTtl = max($ttlSec * 12, 3600);

        if (Cache::has($freshKey)) {
            [$data] = $this->splitDataAndMeta(Cache::get($freshKey));

            return [
                'data' => $data,
                'meta' => $this->buildMeta(
                    $query['date_context'] ?? null,
                    $query['compare'] ?? 'none',
                    'cache',
                    false,
                    $ttlSec
                ),
            ];
        }

        $lock = $this->acquireComputationLock("{$baseKey}:lock", 15);

        try {
            if ($lock !== null && Cache::has($freshKey)) {
                [$data] = $this->splitDataAndMeta(Cache::get($freshKey));

                return [
                    'data' => $data,
                    'meta' => $this->buildMeta(
                        $query['date_context'] ?? null,
                        $query['compare'] ?? 'none',
                        'cache',
                        false,
                        $ttlSec
                    ),
                ];
            }

            if ($lock === null) {
                for ($attempt = 0; $attempt < 5; $attempt++) {
                    usleep(200000);
                    if (Cache::has($freshKey)) {
                        [$data] = $this->splitDataAndMeta(Cache::get($freshKey));

                        return [
                            'data' => $data,
                            'meta' => $this->buildMeta(
                                $query['date_context'] ?? null,
                                $query['compare'] ?? 'none',
                                'cache',
                                false,
                                $ttlSec
                            ),
                        ];
                    }
                }
            }

            [$data, $extraMeta] = $this->splitDataAndMeta($resolver());
            Cache::put($freshKey, $data, $ttlSec);
            Cache::put($staleKey, $data, $staleTtl);

            return [
                'data' => $data,
                'meta' => array_merge(
                    $this->buildMeta(
                        $query['date_context'] ?? null,
                        $query['compare'] ?? 'none',
                        'ga4',
                        false,
                        $ttlSec
                    ),
                    $extraMeta
                ),
            ];
        } catch (Throwable $e) {
            report($e);

            if (Cache::has($staleKey)) {
                [$staleData] = $this->splitDataAndMeta(Cache::get($staleKey));

                return [
                    'data' => $staleData,
                    'meta' => $this->buildMeta(
                        $query['date_context'] ?? null,
                        $query['compare'] ?? 'none',
                        'cache',
                        true,
                        $ttlSec
                    ),
                ];
            }

            throw new AnalyticsUnavailableException(previous: $e);
        } finally {
            $this->releaseComputationLock($lock);
        }
    }

    private function splitDataAndMeta(mixed $payload): array
    {
        $data = is_array($payload) ? $payload : (array) $payload;
        $extraMeta = [];

        if (array_key_exists('_quota', $data)) {
            $extraMeta['quota'] = $data['_quota'];
            unset($data['_quota']);
        }

        return [$data, $extraMeta];
    }

    private function acquireComputationLock(string $key, int $seconds): mixed
    {
        try {
            $lock = Cache::lock($key, $seconds);
            if (is_object($lock) && method_exists($lock, 'get') && $lock->get()) {
                return $lock;
            }
        } catch (Throwable) {
            // Lock provider is optional; continue without distributed lock.
        }

        return null;
    }

    private function releaseComputationLock(mixed $lock): void
    {
        if (!is_object($lock) || !method_exists($lock, 'release')) {
            return;
        }

        try {
            $lock->release();
        } catch (Throwable) {
            // Best-effort release.
        }
    }

    private function buildMeta(?array $dateContext, string $compare, string $source, bool $stale, int $ttlSec): array
    {
        return [
            'property_id' => $this->propertyId,
            'date_range' => $dateContext
                ? [
                    'preset' => $dateContext['preset'],
                    'start' => $dateContext['start'],
                    'end' => $dateContext['end'],
                ]
                : null,
            'compare' => $compare,
            'timezone' => $this->timezone,
            'source' => $source,
            'stale' => $stale,
            'generated_at' => Carbon::now($this->timezone)->toIso8601String(),
            'cache_ttl_sec' => $ttlSec,
        ];
    }

    private function normalizeAcquisitionPayload(array $payload, int $limit): array
    {
        $mode = (string) ($payload['mode'] ?? 'session');
        if ($mode !== 'session') {
            return $payload;
        }

        $rows = $payload['rows'] ?? [];
        if (!is_array($rows)) {
            $rows = [];
        }

        return $this->normalizeSessionAcquisition($rows, $limit);
    }

    private function normalizeSessionAcquisition(array $rows, int $limit): array
    {
        $groups = [];
        $totals = [
            'sessions' => 0,
            'users' => 0,
            'pageviews' => 0,
        ];

        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }

            $sessions = (int) ($row['sessions'] ?? 0);
            $users = (int) ($row['users'] ?? 0);
            $pageviews = (int) ($row['pageviews'] ?? 0);
            $channelRaw = trim((string) ($row['channel_raw'] ?? '(not set)'));
            $sourceRaw = $this->trafficSourceNormalizer->resolveSourceRaw(
                $row['session_manual_source'] ?? null,
                $row['session_source'] ?? null
            );
            $normalized = $this->trafficSourceNormalizer->normalize(
                $channelRaw,
                $sourceRaw,
                (string) ($row['session_medium'] ?? ''),
                (string) ($row['session_source_medium'] ?? '')
            );

            $sourceNormalized = (string) ($normalized['source_normalized'] ?? 'Other');
            $sourceKey = (string) ($normalized['source_key'] ?? 'other');
            $group = (string) ($normalized['group'] ?? 'Referral');
            $confidence = (string) ($normalized['confidence'] ?? 'low');
            $key = strtolower("{$sourceNormalized}|{$group}");

            if (!array_key_exists($key, $groups)) {
                $groups[$key] = [
                    'source_key' => $sourceKey,
                    'channel_raw' => $channelRaw,
                    'source_raw' => $sourceRaw,
                    'source_normalized' => $sourceNormalized,
                    'group' => $group,
                    'confidence' => $confidence,
                    'sessions' => 0,
                    'users' => 0,
                    'pageviews' => 0,
                    '_best_sessions' => $sessions,
                    '_confidence_rank' => $this->confidenceRank($confidence),
                ];
            }

            $groups[$key]['sessions'] += $sessions;
            $groups[$key]['users'] += $users;
            $groups[$key]['pageviews'] += $pageviews;

            if ($sessions > $groups[$key]['_best_sessions']) {
                $groups[$key]['_best_sessions'] = $sessions;
                $groups[$key]['channel_raw'] = $channelRaw;
                $groups[$key]['source_raw'] = $sourceRaw;
            }

            $currentConfidenceRank = $this->confidenceRank($confidence);
            if ($currentConfidenceRank > $groups[$key]['_confidence_rank']) {
                $groups[$key]['_confidence_rank'] = $currentConfidenceRank;
                $groups[$key]['confidence'] = $confidence;
            }

            $totals['sessions'] += $sessions;
            $totals['users'] += $users;
            $totals['pageviews'] += $pageviews;
        }

        $items = array_values($groups);
        usort($items, static function (array $a, array $b): int {
            if ($a['sessions'] === $b['sessions']) {
                return $b['pageviews'] <=> $a['pageviews'];
            }

            return $b['sessions'] <=> $a['sessions'];
        });

        $items = array_slice($items, 0, max(1, $limit));
        $rank = 1;
        foreach ($items as &$item) {
            $item['rank'] = $rank++;
            $item['share_sessions_pct'] = $totals['sessions'] > 0
                ? round(($item['sessions'] / $totals['sessions']) * 100, 2)
                : 0;
            $item['share_pageviews_pct'] = $totals['pageviews'] > 0
                ? round(($item['pageviews'] / $totals['pageviews']) * 100, 2)
                : 0;

            unset($item['_best_sessions'], $item['_confidence_rank']);
        }
        unset($item);

        return [
            'mode' => 'session',
            'items' => $items,
            'totals' => $totals,
        ];
    }

    private function confidenceRank(string $confidence): int
    {
        return match (strtolower($confidence)) {
            'high' => 3,
            'medium' => 2,
            default => 1,
        };
    }
}
