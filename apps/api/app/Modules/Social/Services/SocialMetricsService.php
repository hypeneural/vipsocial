<?php

namespace App\Modules\Social\Services;

use App\Modules\Social\Models\SocialMetricDefinition;
use App\Modules\Social\Models\SocialProfile;
use App\Modules\Social\Models\SocialProfileMetricValue;
use App\Modules\Social\Models\SocialProfileSnapshot;
use App\Modules\Social\Models\SocialSyncRun;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class SocialMetricsService
{
    public function profilesMetrics(string $window): array
    {
        [$normalizedWindow, $windowStart, $today] = $this->resolveWindow($window);
        $ttl = max(1, (int) config('social.cache.dashboard_ttl_sec', 300));
        $cacheKey = "social:profiles:metrics:{$normalizedWindow}";

        return Cache::remember($cacheKey, $ttl, function () use ($normalizedWindow, $windowStart, $today) {
            $profiles = SocialProfile::query()
                ->active()
                ->orderBy('sort_order')
                ->orderBy('network')
                ->orderBy('handle')
                ->get();

            return [
                'window' => $normalizedWindow,
                'items' => $profiles->map(
                    fn(SocialProfile $profile) => $this->buildProfileMetrics($profile, $windowStart, $today)
                )->values()->all(),
            ];
        });
    }

    public function profileMetrics(string $profileId, string $window): array
    {
        [$normalizedWindow, $windowStart, $today] = $this->resolveWindow($window);
        $ttl = max(1, (int) config('social.cache.dashboard_ttl_sec', 300));
        $cacheKey = "social:profiles:metrics:{$profileId}:{$normalizedWindow}";

        return Cache::remember($cacheKey, $ttl, function () use ($profileId, $normalizedWindow, $windowStart, $today) {
            $profile = SocialProfile::query()->find($profileId);
            if ($profile === null) {
                throw (new ModelNotFoundException())->setModel(SocialProfile::class, [$profileId]);
            }

            $payload = $this->buildProfileMetrics($profile, $windowStart, $today);
            $payload['window'] = $normalizedWindow;

            return $payload;
        });
    }

    private function buildProfileMetrics(
        SocialProfile $profile,
        CarbonImmutable $windowStart,
        CarbonImmutable $today
    ): array {
        $snapshots = SocialProfileSnapshot::query()
            ->where('social_profile_id', $profile->id)
            ->whereDate('metric_date', '<=', $today->toDateString())
            ->with(['metricValues.definition'])
            ->orderBy('metric_date')
            ->get();

        /** @var SocialProfileSnapshot|null $currentSnapshot */
        $currentSnapshot = $snapshots->last();
        $currentValue = $this->primaryMetricValue($currentSnapshot, $profile->primary_metric_code);
        $latestRun = SocialSyncRun::query()
            ->where('social_profile_id', $profile->id)
            ->orderByDesc('finished_at')
            ->orderByDesc('created_at')
            ->first();

        $previousDaySnapshot = $this->snapshotAtOrBefore($snapshots, $today->subDay());
        $sevenDaysSnapshot = $this->snapshotAtOrBefore($snapshots, $today->subDays(7));
        $thirtyDaysSnapshot = $this->snapshotAtOrBefore($snapshots, $today->subDays(30));

        $growthDay = $this->delta($currentValue, $this->primaryMetricValue($previousDaySnapshot, $profile->primary_metric_code));
        $growth7d = $this->delta($currentValue, $this->primaryMetricValue($sevenDaysSnapshot, $profile->primary_metric_code));
        $growth30d = $this->delta($currentValue, $this->primaryMetricValue($thirtyDaysSnapshot, $profile->primary_metric_code));

        return [
            'id' => $profile->id,
            'network' => $profile->network,
            'handle' => $profile->handle,
            'display_name' => $profile->display_name ?: $profile->handle,
            'external_profile_id' => $profile->external_profile_id,
            'url' => $profile->url,
            'avatar_url' => $profile->avatar_url,
            'primary_metric_code' => $profile->primary_metric_code,
            'primary_metric_label' => $this->metricLabel($profile->primary_metric_code),
            'current_value' => $this->normalizeNumber($currentValue),
            'growth_day' => $this->normalizeNumber($growthDay),
            'growth_7d' => $this->normalizeNumber($growth7d),
            'growth_30d' => $this->normalizeNumber($growth30d),
            'growth_day_pct' => $this->percentage($growthDay, $this->primaryMetricValue($previousDaySnapshot, $profile->primary_metric_code)),
            'growth_7d_pct' => $this->percentage($growth7d, $this->primaryMetricValue($sevenDaysSnapshot, $profile->primary_metric_code)),
            'growth_30d_pct' => $this->percentage($growth30d, $this->primaryMetricValue($thirtyDaysSnapshot, $profile->primary_metric_code)),
            'status' => $this->profileStatus($latestRun),
            'last_sync_error' => $latestRun?->error_message,
            'last_snapshot_date' => $currentSnapshot?->metric_date?->toDateString(),
            'last_synced_at' => $profile->last_synced_at?->toIso8601String(),
            'metrics' => $this->snapshotMetrics($currentSnapshot),
            'series' => $this->series($snapshots, $windowStart, $profile->primary_metric_code),
        ];
    }

    private function metricLabel(string $code): string
    {
        $definition = SocialMetricDefinition::query()
            ->where('code', $code)
            ->first();

        return $definition?->label ?? $code;
    }

    private function primaryMetricValue(?SocialProfileSnapshot $snapshot, string $metricCode): ?float
    {
        if ($snapshot === null) {
            return null;
        }

        /** @var SocialProfileMetricValue|null $metric */
        $metric = $snapshot->metricValues
            ->first(fn(SocialProfileMetricValue $item) => $item->definition?->code === $metricCode);

        if ($metric === null || $metric->value_number === null) {
            return null;
        }

        return (float) $metric->value_number;
    }

    private function snapshotAtOrBefore(Collection $snapshots, CarbonImmutable $targetDate): ?SocialProfileSnapshot
    {
        return $snapshots
            ->filter(fn(SocialProfileSnapshot $snapshot) => $snapshot->metric_date?->lte($targetDate))
            ->last();
    }

    private function delta(?float $current, ?float $baseline): ?float
    {
        if ($current === null || $baseline === null) {
            return null;
        }

        return $current - $baseline;
    }

    private function percentage(?float $delta, ?float $baseline): ?float
    {
        if ($delta === null || $baseline === null || $baseline == 0.0) {
            return null;
        }

        return round(($delta / $baseline) * 100, 2);
    }

    private function normalizeNumber(?float $value): int|float|null
    {
        if ($value === null) {
            return null;
        }

        if (fmod($value, 1.0) === 0.0) {
            return (int) $value;
        }

        return round($value, 4);
    }

    private function profileStatus(?SocialSyncRun $latestRun): string
    {
        if ($latestRun === null) {
            return 'pending';
        }

        return match ($latestRun->status) {
            SocialSyncRun::STATUS_SUCCEEDED => 'ok',
            SocialSyncRun::STATUS_FAILED => 'error',
            default => 'pending',
        };
    }

    private function snapshotMetrics(?SocialProfileSnapshot $snapshot): array
    {
        if ($snapshot === null) {
            return [];
        }

        return $snapshot->metricValues
            ->sortBy(fn(SocialProfileMetricValue $value) => $value->definition?->sort_order ?? 999)
            ->map(function (SocialProfileMetricValue $value) {
                return [
                    'code' => $value->definition?->code,
                    'label' => $value->definition?->label ?? $value->raw_key,
                    'group' => $value->definition?->metric_group,
                    'unit' => $value->definition?->unit,
                    'value_number' => $value->value_number !== null ? $this->normalizeNumber((float) $value->value_number) : null,
                    'value_text' => $value->value_text,
                    'value_json' => $value->value_json,
                    'raw_key' => $value->raw_key,
                ];
            })
            ->values()
            ->all();
    }

    private function series(Collection $snapshots, CarbonImmutable $windowStart, string $primaryMetricCode): array
    {
        return $snapshots
            ->filter(fn(SocialProfileSnapshot $snapshot) => $snapshot->metric_date?->gte($windowStart))
            ->map(function (SocialProfileSnapshot $snapshot) use ($primaryMetricCode) {
                return [
                    'date' => $snapshot->metric_date?->toDateString(),
                    'label' => $snapshot->metric_date?->format('d/m'),
                    'value' => $this->normalizeNumber($this->primaryMetricValue($snapshot, $primaryMetricCode)),
                    'captured_at' => $snapshot->captured_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array{0:string,1:CarbonImmutable,2:CarbonImmutable}
     */
    private function resolveWindow(string $window): array
    {
        $normalized = strtolower(trim($window));
        $days = match ($normalized) {
            '7d' => 7,
            '30d' => 30,
            '90d' => 90,
            default => (int) str_replace('d', '', (string) config('social.dashboard_default_window', '30d')),
        };

        $normalizedWindow = "{$days}d";
        $timezone = (string) config('social.timezone', config('app.timezone', 'UTC'));
        $today = CarbonImmutable::now($timezone)->startOfDay();
        $windowStart = $today->subDays($days)->startOfDay();

        return [$normalizedWindow, $windowStart, $today];
    }
}
