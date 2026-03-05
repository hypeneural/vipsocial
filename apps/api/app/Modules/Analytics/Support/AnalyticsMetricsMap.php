<?php

namespace App\Modules\Analytics\Support;

final class AnalyticsMetricsMap
{
    public const MAP = [
        'users' => [
            'ga4_metric' => 'totalUsers',
            'description' => 'Usuarios unicos no periodo.',
            'percentage' => false,
        ],
        'active_users' => [
            'ga4_metric' => 'activeUsers',
            'description' => 'Usuarios ativos no periodo (nao realtime).',
            'percentage' => false,
        ],
        'new_users' => [
            'ga4_metric' => 'newUsers',
            'description' => 'Novos usuarios no periodo.',
            'percentage' => false,
        ],
        'sessions' => [
            'ga4_metric' => 'sessions',
            'description' => 'Numero total de sessoes.',
            'percentage' => false,
        ],
        'pageviews' => [
            'ga4_metric' => 'screenPageViews',
            'description' => 'Visualizacoes de pagina/tela.',
            'percentage' => false,
        ],
        'avg_engagement_time_sec' => [
            'ga4_metric' => 'userEngagementDuration',
            'description' => 'Duracao de engajamento, normalizada para media por usuario ativo.',
            'percentage' => false,
        ],
        'engagement_rate' => [
            'ga4_metric' => 'engagementRate',
            'description' => 'Taxa de engajamento.',
            'percentage' => true,
        ],
        'realtime_active_users_30m' => [
            'ga4_metric' => 'activeUsers',
            'description' => 'Usuarios ativos nos ultimos 30 minutos.',
            'percentage' => false,
        ],
    ];

    public static function toGa4Metric(string $internalMetric): string
    {
        return self::MAP[$internalMetric]['ga4_metric'] ?? $internalMetric;
    }

    public static function isPercentageMetric(string $internalMetric): bool
    {
        return (bool) (self::MAP[$internalMetric]['percentage'] ?? false);
    }

    public static function allowedInternalMetrics(): array
    {
        return array_keys(self::MAP);
    }
}

