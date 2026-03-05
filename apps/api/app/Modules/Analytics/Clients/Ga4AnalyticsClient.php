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
use Google\Analytics\Data\V1beta\RunReportResponse;

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

        $response = $this->runCoreReport($query, new RunReportRequest([
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

        return $this->withQuota([
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
        ], $response, $query);
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
                new Dimension(['name' => 'hostName']),
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

        $response = $this->runCoreReport($query, $request);
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
            $hostName = $dimensionValues[2] ?? null;
            $fullUrl = $dimensionValues[3] ?? null;

            $items[] = [
                'rank' => $index + 1,
                'path' => $path,
                'host_name' => $hostName,
                'full_url' => $fullUrl,
                'slug' => $this->extractSlug($path),
                'title' => $title,
                'views' => $views,
                'percentage_of_total' => $totalViews > 0 ? round(($views / $totalViews) * 100, 2) : 0,
            ];
        }

        return $this->withQuota([
            'items' => $items,
            'total_views' => $totalViews,
        ], $response, $query);
    }

    public function fetchCities(array $query): array
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
                new Dimension(['name' => 'city']),
            ],
            'metrics' => [
                new Metric(['name' => 'screenPageViews']),
                new Metric(['name' => 'totalUsers']),
            ],
            'order_bys' => [
                new OrderBy([
                    'metric' => new MetricOrderBy(['metric_name' => 'screenPageViews']),
                    'desc' => true,
                ]),
            ],
            'limit' => $limit,
        ]);

        $dimensionFilter = $this->buildHostNameFilter($query);
        if ($dimensionFilter instanceof FilterExpression) {
            $request->setDimensionFilter($dimensionFilter);
        }

        $response = $this->runCoreReport($query, $request);
        $rows = iterator_to_array($response->getRows());

        $totalPageviews = 0;
        foreach ($rows as $row) {
            $values = $this->metricValues($row);
            $totalPageviews += (int) ($values[0] ?? 0);
        }

        $items = [];
        foreach ($rows as $index => $row) {
            $dimensions = $this->dimensionValues($row);
            $values = $this->metricValues($row);
            $pageviews = (int) ($values[0] ?? 0);
            $users = (int) ($values[1] ?? 0);

            $items[] = [
                'rank' => $index + 1,
                'city' => $dimensions[0] ?? '(not set)',
                'pageviews' => $pageviews,
                'users' => $users,
                'share_pageviews_pct' => $totalPageviews > 0 ? round(($pageviews / $totalPageviews) * 100, 2) : 0,
            ];
        }

        return $this->withQuota([
            'items' => $items,
            'total_pageviews' => $totalPageviews,
        ], $response, $query);
    }

    public function fetchAcquisition(array $query): array
    {
        $mode = $query['mode'] ?? 'session';
        $limit = (int) ($query['limit'] ?? 10);

        if ($mode === 'first_user') {
            return $this->fetchAcquisitionByFirstUser($query, $limit);
        }

        return $this->fetchAcquisitionBySession($query, $limit);
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
        $metrics = array_values(array_filter(
            $query['metrics'] ?? [$query['metric'] ?? null],
            fn($metric) => is_string($metric) && $metric !== ''
        ));

        if (empty($metrics)) {
            $metrics = ['pageviews'];
        }

        $ga4Metrics = array_map(fn(string $metric) => AnalyticsMetricsMap::toGa4Metric($metric), $metrics);
        $granularity = $query['granularity'];
        $dimension = $this->timeseriesDimension($granularity);
        $keepEmptyRows = (bool) ($query['keep_empty_rows'] ?? false);

        $response = $this->runCoreReport($query, new RunReportRequest([
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
                ...array_map(fn(string $ga4Metric) => new Metric(['name' => $ga4Metric]), $ga4Metrics),
            ],
            'order_bys' => [
                new OrderBy([
                    'dimension' => new DimensionOrderBy(['dimension_name' => $dimension]),
                    'desc' => false,
                ]),
            ],
            'keep_empty_rows' => $keepEmptyRows,
        ]));

        $points = [];
        foreach ($response->getRows() as $row) {
            $dimensionValues = $this->dimensionValues($row);
            $metricValues = $this->metricValues($row);
            $rawLabel = $dimensionValues[0] ?? '';
            $basePoint = [
                'period' => $rawLabel,
                'label' => $this->formatTimeseriesLabel($rawLabel, $granularity),
            ];

            if (count($metrics) === 1) {
                $value = (float) ($metricValues[0] ?? 0);
                if (AnalyticsMetricsMap::isPercentageMetric($metrics[0])) {
                    $value = round($value * 100, 2);
                }
                $points[] = array_merge($basePoint, ['value' => $value]);
                continue;
            }

            $values = [];
            foreach ($metrics as $index => $metric) {
                $value = (float) ($metricValues[$index] ?? 0);
                if (AnalyticsMetricsMap::isPercentageMetric($metric)) {
                    $value = round($value * 100, 2);
                }

                $values[$metric] = $value;
            }

            $points[] = array_merge($basePoint, ['values' => $values]);
        }

        return $this->withQuota([
            'metric' => count($metrics) === 1 ? $metrics[0] : null,
            'ga4_metric' => count($ga4Metrics) === 1 ? $ga4Metrics[0] : null,
            'metrics' => $metrics,
            'ga4_metrics' => $ga4Metrics,
            'granularity' => $granularity,
            'points' => $points,
        ], $response, $query);
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

        $hostFilter = $this->buildHostNameFilter($query);
        if ($hostFilter instanceof FilterExpression) {
            $filters[] = $hostFilter;
        }

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

    private function fetchAcquisitionBySession(array $query, int $limit): array
    {
        $request = new RunReportRequest([
            'property' => $this->propertyName(),
            'date_ranges' => [
                new DateRange([
                    'start_date' => $query['date_context']['start'],
                    'end_date' => $query['date_context']['end'],
                ]),
            ],
            'dimensions' => [
                new Dimension(['name' => 'sessionDefaultChannelGroup']),
            ],
            'metrics' => [
                new Metric(['name' => 'sessions']),
                new Metric(['name' => 'totalUsers']),
                new Metric(['name' => 'screenPageViews']),
            ],
            'order_bys' => [
                new OrderBy([
                    'metric' => new MetricOrderBy(['metric_name' => 'sessions']),
                    'desc' => true,
                ]),
            ],
            'limit' => $limit,
        ]);

        $response = $this->runCoreReport($query, $request);
        $rows = iterator_to_array($response->getRows());

        $totals = [
            'sessions' => 0,
            'users' => 0,
            'pageviews' => 0,
        ];

        foreach ($rows as $row) {
            $values = $this->metricValues($row);
            $totals['sessions'] += (int) ($values[0] ?? 0);
            $totals['users'] += (int) ($values[1] ?? 0);
            $totals['pageviews'] += (int) ($values[2] ?? 0);
        }

        $items = [];
        foreach ($rows as $index => $row) {
            $dimensions = $this->dimensionValues($row);
            $values = $this->metricValues($row);
            $sessions = (int) ($values[0] ?? 0);

            $items[] = [
                'rank' => $index + 1,
                'origin' => $dimensions[0] ?? '(not set)',
                'sessions' => $sessions,
                'users' => (int) ($values[1] ?? 0),
                'pageviews' => (int) ($values[2] ?? 0),
                'share_sessions_pct' => $totals['sessions'] > 0 ? round(($sessions / $totals['sessions']) * 100, 2) : 0,
            ];
        }

        return $this->withQuota([
            'mode' => 'session',
            'items' => $items,
            'totals' => $totals,
        ], $response, $query);
    }

    private function fetchAcquisitionByFirstUser(array $query, int $limit): array
    {
        $response = $this->runCoreReport($query, new RunReportRequest([
            'property' => $this->propertyName(),
            'date_ranges' => [
                new DateRange([
                    'start_date' => $query['date_context']['start'],
                    'end_date' => $query['date_context']['end'],
                ]),
            ],
            'dimensions' => [
                new Dimension(['name' => 'firstUserDefaultChannelGroup']),
            ],
            'metrics' => [
                new Metric(['name' => 'totalUsers']),
            ],
            'order_bys' => [
                new OrderBy([
                    'metric' => new MetricOrderBy(['metric_name' => 'totalUsers']),
                    'desc' => true,
                ]),
            ],
            'limit' => $limit,
        ]));

        $rows = iterator_to_array($response->getRows());
        $totalUsers = 0;
        foreach ($rows as $row) {
            $values = $this->metricValues($row);
            $totalUsers += (int) ($values[0] ?? 0);
        }

        $items = [];
        foreach ($rows as $index => $row) {
            $dimensions = $this->dimensionValues($row);
            $users = (int) ($this->metricValues($row)[0] ?? 0);

            $items[] = [
                'rank' => $index + 1,
                'origin' => $dimensions[0] ?? '(not set)',
                'users' => $users,
                'share_users_pct' => $totalUsers > 0 ? round(($users / $totalUsers) * 100, 2) : 0,
            ];
        }

        return $this->withQuota([
            'mode' => 'first_user',
            'items' => $items,
            'totals' => [
                'users' => $totalUsers,
            ],
        ], $response, $query);
    }

    private function runCoreReport(array $query, RunReportRequest $request): RunReportResponse
    {
        if ($this->wantsDebugQuota($query) && method_exists($request, 'setReturnPropertyQuota')) {
            $request->setReturnPropertyQuota(true);
        }

        return $this->client()->runReport($request);
    }

    private function withQuota(array $payload, RunReportResponse $response, array $query): array
    {
        if (!$this->wantsDebugQuota($query)) {
            return $payload;
        }

        $quota = $this->extractQuota($response);
        if ($quota === null) {
            return $payload;
        }

        $payload['_quota'] = $quota;

        return $payload;
    }

    private function wantsDebugQuota(array $query): bool
    {
        return filter_var($query['debug_quota'] ?? false, FILTER_VALIDATE_BOOLEAN);
    }

    private function extractQuota(RunReportResponse $response): ?array
    {
        if (!method_exists($response, 'getPropertyQuota')) {
            return null;
        }

        $propertyQuota = $response->getPropertyQuota();
        if (!is_object($propertyQuota)) {
            return null;
        }

        $quota = [];
        $fields = [
            'tokens_per_day' => 'getTokensPerDay',
            'tokens_per_hour' => 'getTokensPerHour',
            'tokens_per_project_per_hour' => 'getTokensPerProjectPerHour',
            'concurrent_requests' => 'getConcurrentRequests',
            'server_errors_per_project_per_hour' => 'getServerErrorsPerProjectPerHour',
            'potentially_thresholded_requests_per_hour' => 'getPotentiallyThresholdedRequestsPerHour',
        ];

        foreach ($fields as $key => $getter) {
            if (!method_exists($propertyQuota, $getter)) {
                continue;
            }

            $status = $this->mapQuotaStatus($propertyQuota->{$getter}());
            if ($status !== null) {
                $quota[$key] = $status;
            }
        }

        return empty($quota) ? null : $quota;
    }

    private function mapQuotaStatus(mixed $status): ?array
    {
        if (!is_object($status)) {
            return null;
        }

        $consumed = method_exists($status, 'getConsumed') ? (int) $status->getConsumed() : null;
        $remaining = method_exists($status, 'getRemaining') ? (int) $status->getRemaining() : null;

        if ($consumed === null && $remaining === null) {
            return null;
        }

        return array_filter([
            'consumed' => $consumed,
            'remaining' => $remaining,
        ], static fn($value) => $value !== null);
    }

    private function buildHostNameFilter(array $query): ?FilterExpression
    {
        if (empty($query['host_name'])) {
            return null;
        }

        return new FilterExpression([
            'filter' => new Filter([
                'field_name' => 'hostName',
                'string_filter' => new StringFilter([
                    'match_type' => MatchType::EXACT,
                    'value' => $query['host_name'],
                    'case_sensitive' => false,
                ]),
            ]),
        ]);
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
