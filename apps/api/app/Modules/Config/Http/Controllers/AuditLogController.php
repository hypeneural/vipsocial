<?php

namespace App\Modules\Config\Http\Controllers;

use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends BaseController
{
    /**
     * GET /audit/logs — Paginated audit logs with filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = Activity::query()
            ->with('causer:id,name,email,avatar_url')
            ->latest();

        // Filter by user
        if ($request->filled('user_id')) {
            $query->where('causer_id', $request->user_id)
                ->where('causer_type', \App\Models\User::class);
        }

        // Filter by module (stored in properties->action)
        if ($request->filled('module')) {
            $query->where('properties->module', $request->module);
        }

        // Filter by action
        if ($request->filled('action')) {
            $query->where('properties->action', $request->action);
        }

        // Search in description
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('properties->resource_name', 'like', "%{$search}%");
            });
        }

        // Date range
        if ($request->filled('start_date')) {
            $start = \Carbon\Carbon::parse($request->start_date)->setTimezone(config('app.timezone'));
            $query->where('created_at', '>=', $start);
        }
        if ($request->filled('end_date')) {
            $end = \Carbon\Carbon::parse($request->end_date)->setTimezone(config('app.timezone'));
            $query->where('created_at', '<=', $end);
        }

        $logs = $query->paginate($request->get('per_page', 20));

        $data = collect($logs->items())->map(fn(Activity $log) => $this->formatLog($log));

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'from' => $logs->firstItem(),
                'to' => $logs->lastItem(),
            ],
        ]);
    }

    /**
     * GET /audit/logs/{id} — Single log detail
     */
    public function show(int $id): JsonResponse
    {
        $log = Activity::with('causer:id,name,email,avatar_url')->findOrFail($id);
        return $this->jsonSuccess($this->formatLog($log));
    }

    /**
     * GET /audit/stats — Audit statistics
     */
    public function stats(): JsonResponse
    {
        $today = now()->startOfDay();

        $totalLogs = Activity::count();
        $logsToday = Activity::where('created_at', '>=', $today)->count();
        $activeUsersToday = Activity::where('created_at', '>=', $today)
            ->whereNotNull('causer_id')
            ->distinct('causer_id')
            ->count('causer_id');

        // Most active module
        $mostActiveModule = Activity::selectRaw("JSON_UNQUOTE(JSON_EXTRACT(properties, '$.module')) as module, COUNT(*) as cnt")
            ->whereNotNull('properties->module')
            ->groupBy('module')
            ->orderByDesc('cnt')
            ->first();

        // Actions breakdown
        $actionsBreakdown = Activity::selectRaw("JSON_UNQUOTE(JSON_EXTRACT(properties, '$.action')) as action, COUNT(*) as cnt")
            ->whereNotNull('properties->action')
            ->groupBy('action')
            ->pluck('cnt', 'action')
            ->toArray();

        return $this->jsonSuccess([
            'total_logs' => $totalLogs,
            'logs_today' => $logsToday,
            'active_users_today' => $activeUsersToday,
            'most_active_module' => $mostActiveModule?->module ?? 'auth',
            'actions_breakdown' => $actionsBreakdown,
        ]);
    }

    /**
     * GET /audit/users — Users with activity (for filter dropdown)
     */
    public function users(): JsonResponse
    {
        $users = Activity::whereNotNull('causer_id')
            ->where('causer_type', \App\Models\User::class)
            ->distinct('causer_id')
            ->with('causer:id,name,email')
            ->get()
            ->pluck('causer')
            ->filter()
            ->unique('id')
            ->map(fn($user) => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])
            ->values();

        return $this->jsonSuccess($users);
    }

    /**
     * GET /audit/export — Export logs as CSV
     */
    public function export(Request $request): StreamedResponse
    {
        $query = Activity::query()
            ->with('causer:id,name,email')
            ->latest();

        if ($request->filled('user_id')) {
            $query->where('causer_id', $request->user_id)
                ->where('causer_type', \App\Models\User::class);
        }
        if ($request->filled('module')) {
            $query->where('properties->module', $request->module);
        }
        if ($request->filled('action')) {
            $query->where('properties->action', $request->action);
        }
        if ($request->filled('start_date')) {
            $start = \Carbon\Carbon::parse($request->start_date)->setTimezone(config('app.timezone'));
            $query->where('created_at', '>=', $start);
        }
        if ($request->filled('end_date')) {
            $end = \Carbon\Carbon::parse($request->end_date)->setTimezone(config('app.timezone'));
            $query->where('created_at', '<=', $end);
        }

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Usuário', 'Email', 'Ação', 'Módulo', 'Descrição', 'Recurso', 'IP', 'Origem', 'Data/Hora']);

            $query->chunk(500, function ($logs) use ($handle) {
                foreach ($logs as $log) {
                    $props = $log->properties;
                    fputcsv($handle, [
                        $log->id,
                        $log->causer?->name ?? 'Sistema',
                        $log->causer?->email ?? '-',
                        $props['action'] ?? '-',
                        $props['module'] ?? '-',
                        $log->description,
                        $props['resource_name'] ?? '-',
                        $log->ip_address ?? '-',
                        $log->origin ?? '-',
                        $log->created_at->format('d/m/Y H:i:s'),
                    ]);
                }
            });

            fclose($handle);
        }, 'audit-logs-' . now()->format('Y-m-d') . '.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    // ── Private Helpers ─────────────────────────────────

    private function formatLog(Activity $log): array
    {
        $props = $log->properties->toArray();
        $causer = $log->causer;

        return [
            'id' => (string) $log->id,
            'user_id' => $causer ? (string) $causer->id : null,
            'user_name' => $causer?->name ?? 'Sistema',
            'user_email' => $causer?->email ?? '-',
            'user_avatar' => $causer?->avatar_url ?? null,
            'action' => $props['action'] ?? 'update',
            'module' => $props['module'] ?? 'config',
            'resource_type' => $log->subject_type ? class_basename($log->subject_type) : null,
            'resource_id' => $log->subject_id ? (string) $log->subject_id : null,
            'resource_name' => $props['resource_name'] ?? null,
            'description' => $log->description,
            'ip_address' => $log->ip_address ?? '-',
            'user_agent' => $log->user_agent ?? '-',
            'metadata' => array_diff_key($props, array_flip(['action', 'module', 'resource_name', 'changes'])),
            'changes' => $props['changes'] ?? null,
            'created_at' => $log->created_at->toIso8601String(),
        ];
    }
}
