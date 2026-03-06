<?php

namespace App\Modules\Social\Services;

use App\Modules\Social\Models\SocialSyncRun;
use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;

class SocialDashboardService
{
    public function __construct(private readonly SocialMetricsService $metricsService)
    {
    }

    public function dashboard(string $window): array
    {
        $normalizedWindow = strtolower(trim($window));
        $ttl = max(1, (int) config('social.cache.dashboard_ttl_sec', 300));
        $cacheKey = "social:dashboard:{$normalizedWindow}";

        return Cache::remember($cacheKey, $ttl, function () use ($window) {
            $profilesPayload = $this->metricsService->profilesMetrics($window);
            $cards = collect($profilesPayload['items'] ?? []);
            $timezone = (string) config('social.timezone', config('app.timezone', 'UTC'));
            $today = CarbonImmutable::now($timezone)->toDateString();
            $totalAudienceCurrent = (int) round((float) $cards
                ->sum(fn(array $item) => (float) ($item['current_value'] ?? 0)));

            return [
                'window' => $profilesPayload['window'] ?? $window,
                'summary' => [
                    'total_audience_current' => $totalAudienceCurrent,
                    'profiles_count' => $cards->count(),
                    'synced_today_count' => $cards->where('last_snapshot_date', $today)->count(),
                    'failed_today_count' => SocialSyncRun::query()
                        ->where('metric_date', $today)
                        ->where('status', SocialSyncRun::STATUS_FAILED)
                        ->distinct('social_profile_id')
                        ->count('social_profile_id'),
                    'cost_today_usd' => round((float) SocialSyncRun::query()
                        ->where('metric_date', $today)
                        ->sum('usage_total_usd'), 6),
                ],
                'cards' => $cards
                    ->map(fn(array $item) => Arr::except($item, ['series']))
                    ->values()
                    ->all(),
                'series' => $cards
                    ->mapWithKeys(fn(array $item) => [
                        $item['id'] => [
                            'profile_id' => $item['id'],
                            'network' => $item['network'],
                            'handle' => $item['handle'],
                            'display_name' => $item['display_name'],
                            'points' => $item['series'],
                        ],
                    ])
                    ->all(),
            ];
        });
    }
}
