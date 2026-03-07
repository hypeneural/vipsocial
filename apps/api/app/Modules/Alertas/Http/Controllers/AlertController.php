<?php

namespace App\Modules\Alertas\Http\Controllers;

use App\Modules\Alertas\Http\Requests\AlertListRequest;
use App\Modules\Alertas\Http\Requests\StoreAlertRequest;
use App\Modules\Alertas\Http\Requests\UpdateAlertRequest;
use App\Modules\Alertas\Models\Alert;
use App\Modules\Alertas\Services\AlertDispatchService;
use App\Modules\Alertas\Services\AlertService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use RuntimeException;
use Throwable;

class AlertController extends BaseController
{
    public function __construct(
        private readonly AlertService $service,
        private readonly AlertDispatchService $dispatchService
    ) {
    }

    public function index(AlertListRequest $request): JsonResponse
    {
        $paginator = $this->service->paginate($request->validated());
        $items = collect($paginator->items())
            ->map(fn(Alert $alert) => $this->service->serialize($alert))
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

    public function show(int $id): JsonResponse
    {
        $alert = Alert::query()
            ->with(['destinations', 'scheduleRules'])
            ->withCount('destinations')
            ->find($id);

        if ($alert === null) {
            throw (new ModelNotFoundException())->setModel(Alert::class, [$id]);
        }

        return $this->jsonSuccess($this->service->serialize($alert));
    }

    public function store(StoreAlertRequest $request): JsonResponse
    {
        try {
            $alert = $this->service->create(
                validated: $request->validated(),
                userId: $request->user()?->id
            );

            return $this->jsonCreated(
                $this->service->serialize($alert),
                'Alerta criado com sucesso'
            );
        } catch (RuntimeException $e) {
            return $this->jsonError($e->getMessage(), 'VALIDATION_ERROR', 422);
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao criar alerta', 'ALERT_CREATE_FAILED', 500);
        }
    }

    public function update(int $id, UpdateAlertRequest $request): JsonResponse
    {
        $alert = Alert::query()->with(['destinations', 'scheduleRules'])->find($id);
        if ($alert === null) {
            throw (new ModelNotFoundException())->setModel(Alert::class, [$id]);
        }

        try {
            $updated = $this->service->update(
                alert: $alert,
                validated: $request->validated(),
                userId: $request->user()?->id
            );

            return $this->jsonSuccess(
                $this->service->serialize($updated),
                'Alerta atualizado com sucesso'
            );
        } catch (RuntimeException $e) {
            return $this->jsonError($e->getMessage(), 'VALIDATION_ERROR', 422);
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao atualizar alerta', 'ALERT_UPDATE_FAILED', 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $alert = Alert::query()->find($id);
        if ($alert === null) {
            throw (new ModelNotFoundException())->setModel(Alert::class, [$id]);
        }

        try {
            $this->service->archive($alert, request()->user()?->id);

            return $this->jsonDeleted('Alerta arquivado com sucesso');
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao arquivar alerta', 'ALERT_ARCHIVE_FAILED', 500);
        }
    }

    public function toggle(int $id): JsonResponse
    {
        $alert = Alert::query()->find($id);
        if ($alert === null) {
            throw (new ModelNotFoundException())->setModel(Alert::class, [$id]);
        }

        try {
            $updated = $this->service->toggle($alert, request()->user()?->id);

            return $this->jsonSuccess(
                $this->service->serialize($updated),
                'Status do alerta atualizado com sucesso'
            );
        } catch (RuntimeException $e) {
            return $this->jsonError($e->getMessage(), 'VALIDATION_ERROR', 422);
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao alternar status do alerta', 'ALERT_TOGGLE_FAILED', 500);
        }
    }

    public function duplicate(int $id): JsonResponse
    {
        $alert = Alert::query()->with(['destinations', 'scheduleRules'])->find($id);
        if ($alert === null) {
            throw (new ModelNotFoundException())->setModel(Alert::class, [$id]);
        }

        try {
            $clone = $this->service->duplicate($alert, request()->user()?->id);

            return $this->jsonCreated(
                $this->service->serialize($clone),
                'Alerta duplicado com sucesso'
            );
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao duplicar alerta', 'ALERT_DUPLICATE_FAILED', 500);
        }
    }

    public function send(int $id): JsonResponse
    {
        $alert = Alert::query()->with(['destinations', 'scheduleRules'])->find($id);
        if ($alert === null) {
            throw (new ModelNotFoundException())->setModel(Alert::class, [$id]);
        }

        try {
            $run = $this->dispatchService->dispatchManual($alert, request()->user()?->id);

            if ($run === null) {
                return $this->jsonError(
                    'Alerta sem destinos ativos para envio',
                    'ALERT_NO_ACTIVE_DESTINATIONS',
                    422
                );
            }

            return $this->jsonSuccess([
                'dispatch_run' => $this->serializeRun($run->fresh(['logs', 'alert'])),
            ], 'Envio manual agendado com sucesso');
        } catch (RuntimeException $e) {
            return $this->jsonError($e->getMessage(), 'VALIDATION_ERROR', 422);
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao disparar alerta manualmente', 'ALERT_SEND_FAILED', 500);
        }
    }

    private function serializeRun($run): array
    {
        return [
            'dispatch_run_id' => $run->id,
            'alert_id' => $run->alert_id,
            'trigger_type' => $run->trigger_type,
            'status' => $run->status,
            'scheduled_for' => $run->scheduled_for?->toIso8601String(),
            'destinations_total' => (int) $run->destinations_total,
            'destinations_success' => (int) $run->destinations_success,
            'destinations_failed' => (int) $run->destinations_failed,
            'started_at' => $run->started_at?->toIso8601String(),
            'finished_at' => $run->finished_at?->toIso8601String(),
            'created_at' => $run->created_at?->toIso8601String(),
        ];
    }
}
