<?php

namespace App\Modules\Analytics\Clients;

use App\Modules\Analytics\Exceptions\AnalyticsUnavailableException;
use App\Modules\Analytics\Support\AnalyticsMetricsMap;
use Carbon\CarbonImmutable;
use Google\Analytics\Data\V1beta\Client\BetaAnalyticsDataClient;
use Google\Analytics\Data\V1beta\DateRange;
use Google\Analytics\Data\V1beta\Dimension;
use Google\Analytics\Data\V1beta\Filter;
use Google\Analytics\Data\V1beta\Filter\StringFilter;
use Google\Analytics\Data\V1beta\Filter\StringFilter\MatchType;
use Google\Analytics\Data\V1beta\FilterExpression;
use Google\Analytics\Data\V1beta\FilterExpressionList;
use Google\Analytics\Data\V1beta\Metric;
use Google\Analytics\Data\V1beta\OrderBy;
use Google\Analytics\Data\V1beta\OrderBy\DimensionOrderBy;
use Google\Analytics\Data\V1beta\OrderBy\MetricOrderBy;
use Google\Analytics\Data\V1beta\Row;
use Google\Analytics\Data\V1beta\RunRealtimeReportRequest;
use Google\Analytics\Data\V1beta\RunReportRequest;

class Ga4AnalyticsClient implements AnalyticsClientInterface
{
    private ?BetaAnalyticsDataClient $client = null;

    public function __construct(
        private readonly string $propertyId,
        private readonly string $credentialsPath
    ) {
    }

    public function fetchKpis(array $query): array
    {
        $dateRanges = [
            new DateRange([
                'start_date' => $query['date_context']['start'],
                'end_date' => $query['date_context']['end'],
                'name' => 'primary',
            ]),
        ];

        if (!empty($query['date_context']['compare_start']) && !empty($query['date_context']['compare_end'])) {
            $dateRanges[] = new DateRange([
                'start_date' => $query['date_context']['compare_start'],
                'end_date' => $query['date_context']['compare_end'],
                'name' => 'compare',
            ]);
        }

        $response = $this->client()->runReport(new RunReportRequest([
            'property' => $this->propertyName(),
            'date_ranges' => $dateRanges,
            'metrics' => [
                new Metric(['name' => 'totalUsers']),
                new Metric(['name' => 'activeUsers']),
                new Metric(['name' => 'newUsers']),
                new Metric(['name' => 'sessions']),
                new Metric(['name' => 'screenPageViews']),
                new Metric(['name' => 'userEngagementDuration']),
                new Metric(['name' => 'engagementRate']),
            ],
        ]));

        $rows = iterator_to_array($response->getRows());
        $primaryValues = isset($rows[0]) ? $this->metricValues($rows[0]) : [];
        $compareValues = isset($rows[1]) ? $this->metricValues($rows[1]) : [];

        $primary = $this->normalizeKpis($primaryValues);
        $compare = $this->normalizeKpis($compareValues);

        return [
            'period' => [
                'start_date' => $query['date_context']['start'],
                'end_date' => $query['date_context']['end'],
            ],
            'totals' => $primary,
            'comparison' => [
                'users_pct' => $this->percentChange($primary['users'], $compare['users'] ?? 0),
                'active_users_pct' => $this->percentChange($primary['active_users'], $compare['active_users'] ?? 0),
                'sessions_pct' => $this->percentChange($primary['sessions'], $compare['sessions'] ?? 0),
                'pageviews_pct' => $this->percentChange($primary['pageviews'], $compare['pageviews'] ?? 0),
            ],
        ];
    }

    public function fetchTopPages(array $query): array
    {
        $limit = (int) ($query['limit'] ?? 10);

        $request = new RunReportRequest([
            'property' => $this->propertyName(),
            'date_ranges' => [
                new DateRange([
                    'start_date' => $query['date_context']['start'],
                    'end_date' => $query['date_context']['end'],
                ]),
            ],
            'dimensions' => [
                new Dimension(['name' => 'pagePath']),
                new Dimension(['name' => 'pageTitle']),
                new Dimension(['name' => 'fullPageUrl']),
            ],
            'metrics' => [
                new Metric(['name' => 'screenPageViews']),
            ],
            'order_bys' => [
                new OrderBy([
                    'metric' => new MetricOrderBy(['metric_name' => 'screenPageViews']),
                    'desc' => true,
                ]),
            ],
            'limit' => $limit,
        ]);

        $dimensionFilter = $this->buildTopPagesFilter($query);
        if ($dimensionFilter instanceof FilterExpression) {
            $request->setDimensionFilter($dimensionFilter);
        }

        $response = $this->client()->runReport($request);
        $rows = iterator_to_array($response->getRows());

        $items = [];
        $totalViews = 0;
        foreach ($rows as $row) {
            $values = $this->metricValues($row);
            $totalViews += (int) ($values[0] ?? 0);
        }

        foreach ($rows as $index => $row) {
            $dimensionValues = $this->dimensionValues($row);
            $views = (int) ($this->metricValues($row)[0] ?? 0);
            $path = $dimensionValues[0] ?? '';
            $title = $dimensionValues[1] ?? '';
            $fullUrl = $dimensionValues[2] ?? null;

            $items[] = [
                'rank' => $index + 1,
                'path' => $path,
                'full_url' => $fullUrl,
                'slug' => $this->extractSlug($path),
                'title' => $title,
                'views' => $views,
                'percentage_of_total' => $totalViews > 0 ? round(($views / $totalViews) * 100, 2) : 0,
            ];
        }

        return [
            'items' => $items,
            'total_views' => $totalViews,
        ];
    }

    public function fetchRealtime(array $query = []): array
    {
        $response = $this->client()->runRealtimeReport(new RunRealtimeReportRequest([
            'property' => $this->propertyName(),
            'metrics' => [
                new Metric(['name' => 'activeUsers']),
            ],
        ]));

        $rows = iterator_to_array($response->getRows());
        $activeUsers = 0;
        if (!empty($rows)) {
            $values = $this->metricValues($rows[0]);
            $activeUsers = (int) ($values[0] ?? 0);
        }

        return [
            'active_users_30m' => $activeUsers,
        ];
    }

    public function fetchTimeseries(array $query): array
    {
        $metric = $query['metric'];
        $ga4Metric = AnalyticsMetricsMap::toGa4Metric($metric);
        $granularity = $query['granularity'];
        $dimension = $this->timeseriesDimension($granularity);

        $response = $this->client()->runReport(new RunReportRequest([
            'property' => $this->propertyName(),
            'date_ranges' => [
                new DateRange([
                    'start_date' => $query['date_context']['start'],
                    'end_date' => $query['date_context']['end'],
                ]),
            ],
            'dimensions' => [
                new Dimension(['name' => $dimension]),
            ],
            'metrics' => [
                new Metric(['name' => $ga4Metric]),
            ],
            'order_bys' => [
                new OrderBy([
                    'dimension' => new DimensionOrderBy(['dimension_name' => $dimension]),
                    'desc' => false,
                ]),
            ],
        ]));

        $points = [];
        foreach ($response->getRows() as $row) {
            $dimensionValues = $this->dimensionValues($row);
            $metricValues = $this->metricValues($row);
            $rawLabel = $dimensionValues[0] ?? '';
            $value = (float) ($metricValues[0] ?? 0);

            if (AnalyticsMetricsMap::isPercentageMetric($metric)) {
                $value = round($value * 100, 2);
            }

            $points[] = [
                'period' => $rawLabel,
                'label' => $this->formatTimeseriesLabel($rawLabel, $granularity),
                'value' => $value,
            ];
        }

        return [
            'metric' => $metric,
            'ga4_metric' => $ga4Metric,
            'granularity' => $granularity,
            'points' => $points,
        ];
    }

    private function client(): BetaAnalyticsDataClient
    {
        if ($this->client instanceof BetaAnalyticsDataClient) {
            return $this->client;
        }

        if (!is_file($this->credentialsPath)) {
            throw new AnalyticsUnavailableException('Credencial do Google Analytics nao encontrada');
        }

        $this->client = new BetaAnalyticsDataClient([
            'credentials' => $this->credentialsPath,
        ]);

        return $this->client;
    }

    private function propertyName(): string
    {
        return "properties/{$this->propertyId}";
    }

    private function metricValues(Row $row): array
    {
        $values = [];
        foreach ($row->getMetricValues() as $metricValue) {
            $values[] = (float) $metricValue->getValue();
        }

        return $values;
    }

    private function dimensionValues(Row $row): array
    {
        $values = [];
        foreach ($row->getDimensionValues() as $dimensionValue) {
            $values[] = $dimensionValue->getValue();
        }

        return $values;
    }

    private function normalizeKpis(array $values): array
    {
        $users = (int) ($values[0] ?? 0);
        $activeUsers = (int) ($values[1] ?? 0);
        $newUsers = (int) ($values[2] ?? 0);
        $sessions = (int) ($values[3] ?? 0);
        $pageviews = (int) ($values[4] ?? 0);
        $engagementDuration = (float) ($values[5] ?? 0);
        $engagementRate = (float) ($values[6] ?? 0);

        return [
            'users' => $users,
            'active_users' => $activeUsers,
            'new_users' => $newUsers,
            'sessions' => $sessions,
            'pageviews' => $pageviews,
            'avg_engagement_time_sec' => $activeUsers > 0 ? round($engagementDuration / $activeUsers, 2) : 0,
            'engagement_rate' => round($engagementRate * 100, 2),
        ];
    }

    private function percentChange(float|int $current, float|int $previous): float
    {
        if ($previous == 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 2);
    }

    private function buildTopPagesFilter(array $query): ?FilterExpression
    {
        $filters = [];

        if (!empty($query['path_prefix'])) {
            $filters[] = new FilterExpression([
                'filter' => new Filter([
                    'field_name' => 'pagePath',
                    'string_filter' => new StringFilter([
                        'match_type' => MatchType::BEGINS_WITH,
                        'value' => $query['path_prefix'],
                        'case_sensitive' => false,
                    ]),
                ]),
            ]);
        }

        if (!empty($query['exclude_prefix'])) {
            $excludeExpression = new FilterExpression([
                'filter' => new Filter([
                    'field_name' => 'pagePath',
                    'string_filter' => new StringFilter([
                        'match_type' => MatchType::BEGINS_WITH,
                        'value' => $query['exclude_prefix'],
                        'case_sensitive' => false,
                    ]),
                ]),
            ]);

            $filters[] = new FilterExpression([
                'not_expression' => $excludeExpression,
            ]);
        }

        if (count($filters) === 1) {
            return $filters[0];
        }

        if (count($filters) > 1) {
            return new FilterExpression([
                'and_group' => new FilterExpressionList([
                    'expressions' => $filters,
                ]),
            ]);
        }

        return null;
    }

    private function extractSlug(string $path): ?string
    {
        $trimmed = trim($path, '/');
        if ($trimmed === '') {
            return null;
        }

        $parts = explode('/', $trimmed);
        return end($parts) ?: null;
    }

    private function timeseriesDimension(string $granularity): string
    {
        return match ($granularity) {
            'day' => 'date',
            'week' => 'yearWeek',
            'month' => 'yearMonth',
            default => 'date',
        };
    }

    private function formatTimeseriesLabel(string $label, string $granularity): string
    {
        if ($granularity === 'day' && preg_match('/^\d{8}$/', $label)) {
            return CarbonImmutable::createFromFormat('Ymd', $label)->format('Y-m-d');
        }

        return $label;
    }
}

