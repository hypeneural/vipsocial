<?php

namespace App\Modules\Analytics\Services;

use App\Modules\Analytics\Clients\AnalyticsClientInterface;
use App\Modules\Analytics\Exceptions\AnalyticsUnavailableException;
use App\Modules\Analytics\Support\CacheKeyBuilder;
use App\Modules\Analytics\Support\DateRangeResolver;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Throwable;

class AnalyticsService
{
    private readonly string $propertyId;
    private readonly string $timezone;

    public function __construct(private readonly AnalyticsClientInterface $client)
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
        $payload = array_merge($query, ['date_context' => $dateContext]);

        return $this->withCache(
            endpoint: 'acquisition',
            query: $payload,
            ttlSec: (int) env('ANALYTICS_CACHE_TTL_ACQUISITION', 1800),
            resolver: fn() => $this->client->fetchAcquisition($payload)
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
}
