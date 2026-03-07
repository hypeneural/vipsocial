<?php

namespace App\Modules\Alertas\Services;

use App\Modules\Alertas\Models\Alert;
use App\Modules\Alertas\Models\AlertDestination;
use App\Modules\Alertas\Models\AlertDispatchLog;
use App\Modules\Alertas\Support\NextFiringResolver;
use Carbon\CarbonImmutable;

class AlertDashboardService
{
    public function __construct(private readonly NextFiringResolver $nextFiringResolver)
    {
    }

    public function stats(): array
    {
        $timezone = (string) config('alertas.timezone', config('app.timezone', 'UTC'));
        $now = CarbonImmutable::now($timezone);
        $startOfDay = $now->startOfDay();
        $last7Days = $now->subDays(6)->startOfDay();
        $nextFirings = $this->collectNextFirings();

        return [
            'total_destinations' => AlertDestination::query()->whereNull('archived_at')->count(),
            'active_destinations' => AlertDestination::query()->active()->count(),
            'total_alerts' => Alert::query()->whereNull('archived_at')->count(),
            'active_alerts' => Alert::query()->active()->count(),
            'next_firings_count' => $nextFirings->count(),
            'today_sent' => AlertDispatchLog::query()
                ->where('status', AlertDispatchLog::STATUS_SUCCESS)
                ->where('sent_at', '>=', $startOfDay)
                ->count(),
            'today_failed' => AlertDispatchLog::query()
                ->whereIn('status', [
                    AlertDispatchLog::STATUS_FAILED,
                    AlertDispatchLog::STATUS_CANCELLED,
                    AlertDispatchLog::STATUS_SKIPPED,
                ])
                ->where('created_at', '>=', $startOfDay)
                ->count(),
            'sent_last_7_days' => AlertDispatchLog::query()
                ->where('status', AlertDispatchLog::STATUS_SUCCESS)
                ->where('sent_at', '>=', $last7Days)
                ->count(),
            'failed_last_7_days' => AlertDispatchLog::query()
                ->whereIn('status', [
                    AlertDispatchLog::STATUS_FAILED,
                    AlertDispatchLog::STATUS_CANCELLED,
                    AlertDispatchLog::STATUS_SKIPPED,
                ])
                ->where('created_at', '>=', $last7Days)
                ->count(),
        ];
    }

    public function nextFirings(int $limit = 5): array
    {
        return $this->collectNextFirings()
            ->take($limit)
            ->values()
            ->all();
    }

    private function collectNextFirings()
    {
        $timezone = (string) config('alertas.timezone', config('app.timezone', 'UTC'));
        $now = CarbonImmutable::now($timezone)->startOfMinute();

        return Alert::query()
            ->active()
            ->with([
                'scheduleRules' => fn($query) => $query->active(),
                'destinations' => fn($query) => $query->active(),
            ])
            ->get()
            ->map(function (Alert $alert) use ($now): ?array {
                $nextFire = $alert->scheduleRules
                    ->map(fn($rule) => $this->nextFiringResolver->nextForRule($rule, $now))
                    ->filter()
                    ->sortBy(fn(CarbonImmutable $candidate) => $candidate->getTimestamp())
                    ->first();

                if ($nextFire === null || $alert->destinations->isEmpty()) {
                    return null;
                }

                $diffMs = max(0, $nextFire->getTimestamp() * 1000 - $now->getTimestamp() * 1000);

                return [
                    'alert_id' => $alert->id,
                    'alert_title' => $alert->title,
                    'next_fire_at' => $nextFire->toIso8601String(),
                    'scheduled_time' => $nextFire->format('H:i'),
                    'time_until' => $this->humanizeDiff($diffMs),
                    'time_until_ms' => $diffMs,
                    'destination_count' => $alert->destinations->count(),
                ];
            })
            ->filter()
            ->sortBy('next_fire_at')
            ->values();
    }

    public function recentLogs(int $limit = 10): array
    {
        return AlertDispatchLog::query()
            ->latest('created_at')
            ->limit($limit)
            ->get()
            ->map(function (AlertDispatchLog $log): array {
                return [
                    'log_id' => $log->id,
                    'alert_id' => $log->alert_id,
                    'alert_title' => $log->alert_title_snapshot,
                    'destination_id' => $log->destination_id,
                    'destination_name' => $log->destination_name_snapshot,
                    'status' => $log->status,
                    'target_kind' => $log->target_kind,
                    'target_value' => $log->target_value,
                    'provider' => $log->provider,
                    'sent_at' => $log->sent_at?->toIso8601String(),
                    'created_at' => $log->created_at?->toIso8601String(),
                    'success' => $log->status === AlertDispatchLog::STATUS_SUCCESS,
                    'response_message_id' => $log->provider_message_id,
                    'response_zaap_id' => $log->provider_zaap_id,
                    'error_message' => $log->error_message,
                ];
            })
            ->values()
            ->all();
    }

    private function humanizeDiff(int $diffMs): string
    {
        $diffMinutes = (int) floor($diffMs / 60000);

        if ($diffMinutes < 60) {
            return sprintf('Em %d minuto%s', $diffMinutes, $diffMinutes === 1 ? '' : 's');
        }

        $hours = intdiv($diffMinutes, 60);
        $minutes = $diffMinutes % 60;

        return sprintf('Em %dh %02dmin', $hours, $minutes);
    }
}
