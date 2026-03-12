<?php

namespace App\Modules\NewsRadar\Http\Controllers;

use App\Modules\NewsRadar\Models\NewsItem;
use App\Modules\NewsRadar\Models\NewsItemAiLog;
use App\Modules\NewsRadar\Models\NewsSource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Carbon;

class NewsItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $allowedSortColumns = ['published_at_utc', 'created_at'];
        $sortBy = $request->input('sort_by', 'published_at_utc');
        $sortDir = $request->input('sort_dir', 'desc');

        if (! in_array($sortBy, $allowedSortColumns, true)) {
            $sortBy = 'published_at_utc';
        }

        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'desc';
        }

        $query = NewsItem::with(['source:id,name,source_type', 'aiMetadata:id,news_item_id,city,urgency,relevance_score,news_theme_id']);

        if ($request->filled('source_id')) {
            $query->where('news_source_id', $request->input('source_id'));
        }

        if ($request->filled('extraction_status')) {
            $query->where('extraction_status', $request->input('extraction_status'));
        }

        if ($request->filled('enrichment_status')) {
            $query->where('enrichment_status', $request->input('enrichment_status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('excerpt', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date_from')) {
            $query->where('published_at_utc', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->where('published_at_utc', '<=', $request->input('date_to'));
        }

        if ($request->filled('city')) {
            $query->whereHas('aiMetadata', fn ($q) => $q->where('city', $request->input('city')));
        }

        if ($request->filled('theme_id')) {
            $query->whereHas('aiMetadata', fn ($q) => $q->where('news_theme_id', $request->input('theme_id')));
        }

        if ($request->filled('urgency')) {
            $query->whereHas('aiMetadata', fn ($q) => $q->where('urgency', $request->input('urgency')));
        }

        // Delta polling for streaming: only items with id > after_id
        if ($request->filled('after_id')) {
            $query->where('id', '>', (int) $request->input('after_id'));
        }

        $query
            ->orderByRaw("{$sortBy} is null")
            ->orderBy($sortBy, $sortDir)
            ->orderBy('id', $sortDir);

        $items = $query->paginate($request->input('per_page', 20));

        return response()->json($items);
    }

    public function show(int $id): JsonResponse
    {
        $item = NewsItem::with([
            'source:id,name,homepage_url,source_type',
            'aiMetadata',
            'aiLogs',
            'media',
            'rawItem:id,raw_payload,first_seen_at,seen_count',
        ])->findOrFail($id);

        return response()->json($item);
    }

    public function related(int $id): JsonResponse
    {
        $item = NewsItem::findOrFail($id);

        // Basic related: same source, recent, similar categories
        $related = NewsItem::where('news_source_id', $item->news_source_id)
            ->where('id', '!=', $item->id)
            ->where('published_at_utc', '>=', now()->subDays(7))
            ->orderByDesc('published_at_utc')
            ->limit(5)
            ->get(['id', 'title', 'excerpt', 'hero_image_url', 'published_at_utc']);

        return response()->json(['data' => $related]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $dashboardTimezone = (string) config('news_radar.timezone', 'America/Sao_Paulo');
        $dashboardWeekStartsAt = $this->resolveWeekStartsAt();
        $dashboardNow = now($dashboardTimezone);
        $todayWindowStartLocal = $dashboardNow->copy()->startOfDay();
        $weekWindowStartLocal = $dashboardNow->copy()->startOfWeek($dashboardWeekStartsAt);
        $todayWindowStartUtc = $todayWindowStartLocal->copy()->utc();
        $weekWindowStartUtc = $weekWindowStartLocal->copy()->utc();
        $aiMonitorWindowStart = now()->subDays(7);

        $aiModelHealthSummary = NewsItemAiLog::query()
            ->selectRaw('stage, model, count(*) as attempts_total')
            ->selectRaw("sum(case when status = 'success' then 1 else 0 end) as attempts_success")
            ->selectRaw("sum(case when status = 'failed' then 1 else 0 end) as attempts_failed")
            ->selectRaw('max(created_at) as last_attempt_at')
            ->whereNotNull('model')
            ->where('created_at', '>=', $aiMonitorWindowStart)
            ->groupBy('stage', 'model')
            ->orderByDesc('attempts_failed')
            ->orderByDesc('last_attempt_at')
            ->limit(10)
            ->get();

        $aiModelHealthLogs = $aiModelHealthSummary->isEmpty()
            ? collect()
            : NewsItemAiLog::query()
                ->where('created_at', '>=', $aiMonitorWindowStart)
                ->where(function ($query) use ($aiModelHealthSummary) {
                    foreach ($aiModelHealthSummary as $row) {
                        $query->orWhere(function ($nested) use ($row) {
                            $nested->where('stage', $row->stage)
                                ->where('model', $row->model);
                        });
                    }
                })
                ->orderByDesc('created_at')
                ->get([
                    'id',
                    'news_item_id',
                    'stage',
                    'status',
                    'model',
                    'tokens_used',
                    'error_message',
                    'meta_json',
                    'created_at',
                ])
                ->groupBy(static fn (NewsItemAiLog $log): string => "{$log->stage}|{$log->model}");

        $aiModelHealth = $aiModelHealthSummary
            ->map(function ($row) use ($aiModelHealthLogs) {
                $groupKey = "{$row->stage}|{$row->model}";
                $logs = $aiModelHealthLogs->get($groupKey, collect())->values();
                $failedLogs = $logs->where('status', 'failed')->values();
                $successLogs = $logs->where('status', 'success')->values();

                $attemptsTotal = (int) $row->attempts_total;
                $attemptsFailed = (int) $row->attempts_failed;
                $attemptsSuccess = (int) $row->attempts_success;

                $fallbackNextModelCount = $failedLogs
                    ->filter(fn (NewsItemAiLog $log): bool => data_get($log->meta_json, 'next_action') === 'fallback_next_model')
                    ->count();
                $retrySameModelCount = $failedLogs
                    ->filter(fn (NewsItemAiLog $log): bool => data_get($log->meta_json, 'next_action') === 'retry_same_model_prompt_json')
                    ->count();
                $unresolvedFailures = $failedLogs
                    ->filter(fn (NewsItemAiLog $log): bool => ! in_array(
                        data_get($log->meta_json, 'next_action'),
                        ['fallback_next_model', 'retry_same_model_prompt_json'],
                        true,
                    ))
                    ->count();

                $healthStatus = match (true) {
                    $attemptsFailed === 0 => 'healthy',
                    $unresolvedFailures > 0 && $attemptsSuccess === 0 => 'critical',
                    $unresolvedFailures > 0 => 'unstable',
                    default => 'recovering',
                };

                $latestLog = $logs->first();
                $latestFailure = $failedLogs->first();
                $latestSuccess = $successLogs->first();

                return [
                    'stage' => $row->stage,
                    'model' => $row->model,
                    'health_status' => $healthStatus,
                    'attempts_total' => $attemptsTotal,
                    'attempts_success' => $attemptsSuccess,
                    'attempts_failed' => $attemptsFailed,
                    'failure_rate' => $attemptsTotal > 0
                        ? round($attemptsFailed / $attemptsTotal, 4)
                        : 0,
                    'success_rate' => $attemptsTotal > 0
                        ? round($attemptsSuccess / $attemptsTotal, 4)
                        : 0,
                    'unresolved_failures' => $unresolvedFailures,
                    'fallback_next_model_count' => $fallbackNextModelCount,
                    'retry_same_model_count' => $retrySameModelCount,
                    'last_attempt_at' => $row->last_attempt_at,
                    'last_error_message' => $latestFailure?->error_message,
                    'last_failure_at' => $latestFailure?->created_at,
                    'last_success_at' => $latestSuccess?->created_at,
                    'last_success_tokens_used' => $latestSuccess?->tokens_used,
                    'latest_log' => $latestLog ? [
                        'news_item_id' => $latestLog->news_item_id,
                        'status' => $latestLog->status,
                        'tokens_used' => $latestLog->tokens_used,
                        'error_message' => $latestLog->error_message,
                        'created_at' => $latestLog->created_at,
                        'meta_json' => $latestLog->meta_json,
                    ] : null,
                    'latest_failure' => $latestFailure ? [
                        'news_item_id' => $latestFailure->news_item_id,
                        'status' => $latestFailure->status,
                        'tokens_used' => $latestFailure->tokens_used,
                        'error_message' => $latestFailure->error_message,
                        'created_at' => $latestFailure->created_at,
                        'meta_json' => $latestFailure->meta_json,
                    ] : null,
                    'latest_success' => $latestSuccess ? [
                        'news_item_id' => $latestSuccess->news_item_id,
                        'status' => $latestSuccess->status,
                        'tokens_used' => $latestSuccess->tokens_used,
                        'error_message' => $latestSuccess->error_message,
                        'created_at' => $latestSuccess->created_at,
                        'meta_json' => $latestSuccess->meta_json,
                    ] : null,
                    'recent_logs' => $logs
                        ->take(5)
                        ->map(fn (NewsItemAiLog $log): array => [
                            'news_item_id' => $log->news_item_id,
                            'status' => $log->status,
                            'tokens_used' => $log->tokens_used,
                            'error_message' => $log->error_message,
                            'created_at' => $log->created_at,
                            'meta_json' => $log->meta_json,
                        ])
                        ->values(),
                    'category_breakdown' => $failedLogs
                        ->map(fn (NewsItemAiLog $log): string => (string) (data_get($log->meta_json, 'category') ?: 'sem_categoria'))
                        ->countBy()
                        ->all(),
                    'strategy_breakdown' => $logs
                        ->map(fn (NewsItemAiLog $log): string => (string) (data_get($log->meta_json, 'strategy') ?: 'sem_estrategia'))
                        ->countBy()
                        ->all(),
                    'next_action_breakdown' => $failedLogs
                        ->map(fn (NewsItemAiLog $log): string => (string) (data_get($log->meta_json, 'next_action') ?: 'sem_proximo_passo'))
                        ->countBy()
                        ->all(),
                    'provider_status_breakdown' => $failedLogs
                        ->map(fn (NewsItemAiLog $log): string => (string) (data_get($log->meta_json, 'provider_status') ?: 'sem_status'))
                        ->countBy()
                        ->all(),
                ];
            })
            ->values();

        $data = [
            'dashboard_timezone' => $dashboardTimezone,
            'dashboard_week_starts_at' => Carbon::getDays()[$dashboardWeekStartsAt] ?? 'sunday',
            'dashboard_generated_at' => $dashboardNow->toIso8601String(),
            'today_window_start_local' => $todayWindowStartLocal->toIso8601String(),
            'today_window_start_utc' => $todayWindowStartUtc->toIso8601String(),
            'week_window_start_local' => $weekWindowStartLocal->toIso8601String(),
            'week_window_start_utc' => $weekWindowStartUtc->toIso8601String(),
            'total_sources' => NewsSource::active()->count(),
            'total_items' => NewsItem::count(),
            'items_today' => NewsItem::where('created_at', '>=', $todayWindowStartUtc)->count(),
            'items_this_week' => NewsItem::where('created_at', '>=', $weekWindowStartUtc)->count(),
            'sources_with_failures' => NewsSource::active()->where('consecutive_failures', '>', 0)->count(),
            'sources_locked' => NewsSource::where('sync_locked_until', '>', now())->count(),

            'by_extraction_status' => NewsItem::selectRaw('extraction_status, count(*) as count')
                ->groupBy('extraction_status')
                ->pluck('count', 'extraction_status'),

            'by_enrichment_status' => NewsItem::selectRaw('enrichment_status, count(*) as count')
                ->groupBy('enrichment_status')
                ->pluck('count', 'enrichment_status'),

            'by_source' => NewsItem::selectRaw('news_source_id, count(*) as count')
                ->with('source:id,name')
                ->groupBy('news_source_id')
                ->orderByDesc('count')
                ->limit(10)
                ->get(),

            'failing_sources' => NewsSource::active()
                ->where('consecutive_failures', '>', 0)
                ->orderByDesc('consecutive_failures')
                ->limit(5)
                ->get(['id', 'name', 'consecutive_failures', 'last_sync_at']),

            'ai_model_health' => $aiModelHealth,
        ];

        return response()->json($data);
    }

    private function resolveWeekStartsAt(): int
    {
        return match (strtolower((string) config('news_radar.week_starts_at', 'sunday'))) {
            'monday' => Carbon::MONDAY,
            'tuesday' => Carbon::TUESDAY,
            'wednesday' => Carbon::WEDNESDAY,
            'thursday' => Carbon::THURSDAY,
            'friday' => Carbon::FRIDAY,
            'saturday' => Carbon::SATURDAY,
            default => Carbon::SUNDAY,
        };
    }
}
