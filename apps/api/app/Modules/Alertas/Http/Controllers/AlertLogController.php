<?php

namespace App\Modules\Alertas\Http\Controllers;

use App\Modules\Alertas\Http\Requests\AlertLogListRequest;
use App\Modules\Alertas\Models\Alert;
use App\Modules\Alertas\Models\AlertDispatchLog;
use App\Modules\Alertas\Models\AlertDispatchRun;
use App\Modules\Alertas\Support\AlertDatePresenter;
use App\Modules\Alertas\Services\AlertDispatchService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use RuntimeException;
use Throwable;

class AlertLogController extends BaseController
{
    public function __construct(private readonly AlertDispatchService $dispatchService)
    {
    }

    public function index(AlertLogListRequest $request): JsonResponse
    {
        return $this->respondWithLogs($request->validated());
    }

    public function byAlert(int $id, AlertLogListRequest $request): JsonResponse
    {
        $alert = Alert::query()->find($id);
        if ($alert === null) {
            throw (new ModelNotFoundException())->setModel(Alert::class, [$id]);
        }

        $filters = array_merge($request->validated(), [
            'alert_id' => $id,
        ]);

        return $this->respondWithLogs($filters);
    }

    public function retry(string $logId): JsonResponse
    {
        $log = AlertDispatchLog::query()->find($logId);
        if ($log === null) {
            throw (new ModelNotFoundException())->setModel(AlertDispatchLog::class, [$logId]);
        }

        try {
            $run = $this->dispatchService->retryLog($log, request()->user()?->id);

            if ($run === null) {
                return $this->jsonError(
                    'Destino do log original nao esta mais ativo para retry',
                    'ALERT_RETRY_NOT_AVAILABLE',
                    422
                );
            }

            return $this->jsonSuccess([
                'dispatch_run' => $this->serializeRun($run->fresh(['logs', 'alert'])),
            ], 'Retry agendado com sucesso');
        } catch (RuntimeException $e) {
            return $this->jsonError($e->getMessage(), 'VALIDATION_ERROR', 422);
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao agendar retry do log', 'ALERT_LOG_RETRY_FAILED', 500);
        }
    }

    public function showRun(string $id): JsonResponse
    {
        $run = AlertDispatchRun::query()->with(['logs', 'alert', 'scheduleRule'])->find($id);
        if ($run === null) {
            throw (new ModelNotFoundException())->setModel(AlertDispatchRun::class, [$id]);
        }

        return $this->jsonSuccess($this->serializeRun($run));
    }

    private function respondWithLogs(array $filters): JsonResponse
    {
        $perPage = min(100, max(1, (int) ($filters['per_page'] ?? 20)));

        $query = AlertDispatchLog::query()
            ->with('run')
            ->latest('created_at');

        if (isset($filters['alert_id'])) {
            $query->where('alert_id', (int) $filters['alert_id']);
        }

        if (isset($filters['destination_id'])) {
            $query->where('destination_id', (int) $filters['destination_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', (string) $filters['status']);
        }

        if (!empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($builder) use ($search): void {
                $builder->where('alert_title_snapshot', 'like', "%{$search}%")
                    ->orWhere('destination_name_snapshot', 'like', "%{$search}%")
                    ->orWhere('target_value', 'like', "%{$search}%")
                    ->orWhere('provider_message_id', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', (string) $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', (string) $filters['end_date']);
        }

        $paginator = $query->paginate($perPage)->withQueryString();
        $items = collect($paginator->items())
            ->map(fn(AlertDispatchLog $log) => $this->serializeLog($log))
            ->values()
            ->all();

        return response()->json([
            'success' => true,
            'data' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            'message' => '',
        ]);
    }

    private function serializeRun(AlertDispatchRun $run): array
    {
        return [
            'dispatch_run_id' => $run->id,
            'alert_id' => $run->alert_id,
            'alert_title' => $run->alert?->title,
            'schedule_rule_id' => $run->schedule_rule_id,
            'trigger_type' => $run->trigger_type,
            'source_log_id' => $run->source_log_id,
            'source_context' => $run->source_context,
            'scheduled_for' => AlertDatePresenter::isoFromStored($run, 'scheduled_for'),
            'status' => $run->status,
            'destinations_total' => (int) $run->destinations_total,
            'destinations_success' => (int) $run->destinations_success,
            'destinations_failed' => (int) $run->destinations_failed,
            'started_at' => AlertDatePresenter::isoFromStored($run, 'started_at'),
            'finished_at' => AlertDatePresenter::isoFromStored($run, 'finished_at'),
            'error_message' => $run->error_message,
            'created_at' => AlertDatePresenter::isoFromValue($run->created_at),
            'updated_at' => AlertDatePresenter::isoFromValue($run->updated_at),
            'logs' => $run->relationLoaded('logs')
                ? $run->logs->map(fn(AlertDispatchLog $log) => $this->serializeLog($log))->values()->all()
                : [],
        ];
    }

    private function serializeLog(AlertDispatchLog $log): array
    {
        return [
            'log_id' => $log->id,
            'dispatch_run_id' => $log->dispatch_run_id,
            'alert_id' => $log->alert_id,
            'alert_title' => $log->alert_title_snapshot,
            'destination_id' => $log->destination_id,
            'destination_name' => $log->destination_name_snapshot,
            'status' => $log->status,
            'trigger_type' => $log->run?->trigger_type,
            'target_kind' => $log->target_kind,
            'target_value' => $log->target_value,
            'provider' => $log->provider,
            'sent_at' => AlertDatePresenter::isoFromStored($log, 'sent_at'),
            'created_at' => AlertDatePresenter::isoFromValue($log->created_at),
            'success' => $log->status === AlertDispatchLog::STATUS_SUCCESS,
            'response_message_id' => $log->provider_message_id,
            'response_zaap_id' => $log->provider_zaap_id,
            'response_id' => $log->provider_response_id,
            'error_message' => $log->error_message,
        ];
    }
}
