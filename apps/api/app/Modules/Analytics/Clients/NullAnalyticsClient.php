<?php

namespace App\Modules\Analytics\Clients;

class NullAnalyticsClient implements AnalyticsClientInterface
{
    public function fetchKpis(array $query): array
    {
        return [
            'period' => [
                'start_date' => $query['date_context']['start'] ?? null,
                'end_date' => $query['date_context']['end'] ?? null,
            ],
            'totals' => [
                'users' => 0,
                'active_users' => 0,
                'new_users' => 0,
                'sessions' => 0,
                'pageviews' => 0,
                'avg_engagement_time_sec' => 0,
                'engagement_rate' => 0,
            ],
            'comparison' => [
                'users_pct' => 0,
                'active_users_pct' => 0,
                'sessions_pct' => 0,
                'pageviews_pct' => 0,
            ],
        ];
    }

    public function fetchTopPages(array $query): array
    {
        return [
            'items' => [],
            'total_views' => 0,
            'total_unique_users' => 0,
        ];
    }

    public function fetchCities(array $query): array
    {
        return [
            'items' => [],
            'total_pageviews' => 0,
        ];
    }

    public function fetchAcquisition(array $query): array
    {
        $mode = $query['mode'] ?? 'session';

        if ($mode === 'session') {
            return [
                'mode' => 'session',
                'rows' => [],
            ];
        }

        return [
            'mode' => $mode,
            'items' => [],
            'totals' => [
                'sessions' => 0,
                'users' => 0,
                'pageviews' => 0,
            ],
        ];
    }

    public function fetchRealtime(array $query = []): array
    {
        return [
            'active_users_30m' => 0,
        ];
    }

    public function fetchTimeseries(array $query): array
    {
        $metrics = $query['metrics'] ?? [$query['metric'] ?? null];
        $metrics = array_values(array_filter($metrics, fn($metric) => is_string($metric) && $metric !== ''));

        return [
            'metric' => count($metrics) === 1 ? $metrics[0] : null,
            'ga4_metric' => count($metrics) === 1 ? $metrics[0] : null,
            'metrics' => $metrics,
            'ga4_metrics' => $metrics,
            'granularity' => $query['granularity'] ?? 'day',
            'points' => [],
        ];
    }
}
