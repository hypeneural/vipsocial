<?php

namespace App\Modules\Alertas\Http\Controllers;

use App\Modules\Alertas\Http\Requests\DestinationListRequest;
use App\Modules\Alertas\Http\Requests\StoreAlertDestinationRequest;
use App\Modules\Alertas\Http\Requests\UpdateAlertDestinationRequest;
use App\Modules\Alertas\Models\AlertDestination;
use App\Modules\Alertas\Services\AlertDestinationService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use RuntimeException;
use Throwable;

class AlertDestinationController extends BaseController
{
    public function __construct(private readonly AlertDestinationService $service)
    {
    }

    public function index(DestinationListRequest $request): JsonResponse
    {
        $paginator = $this->service->paginate($request->validated());
        $items = collect($paginator->items())
            ->map(fn(AlertDestination $destination) => $this->service->serialize($destination))
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
        $destination = AlertDestination::query()->withCount('alerts')->find($id);
        if ($destination === null) {
            throw (new ModelNotFoundException())->setModel(AlertDestination::class, [$id]);
        }

        return $this->jsonSuccess($this->service->serialize($destination));
    }

    public function store(StoreAlertDestinationRequest $request): JsonResponse
    {
        try {
            $destination = $this->service->create(
                validated: $request->validated(),
                userId: $request->user()?->id
            );

            return $this->jsonCreated(
                $this->service->serialize($destination),
                'Destino criado com sucesso'
            );
        } catch (RuntimeException $e) {
            return $this->jsonError($e->getMessage(), 'VALIDATION_ERROR', 422);
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao criar destino', 'ALERT_DESTINATION_CREATE_FAILED', 500);
        }
    }

    public function update(int $id, UpdateAlertDestinationRequest $request): JsonResponse
    {
        $destination = AlertDestination::query()->find($id);
        if ($destination === null) {
            throw (new ModelNotFoundException())->setModel(AlertDestination::class, [$id]);
        }

        try {
            $updated = $this->service->update(
                destination: $destination,
                validated: $request->validated(),
                userId: $request->user()?->id
            );

            return $this->jsonSuccess(
                $this->service->serialize($updated),
                'Destino atualizado com sucesso'
            );
        } catch (RuntimeException $e) {
            return $this->jsonError($e->getMessage(), 'VALIDATION_ERROR', 422);
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao atualizar destino', 'ALERT_DESTINATION_UPDATE_FAILED', 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $destination = AlertDestination::query()->find($id);
        if ($destination === null) {
            throw (new ModelNotFoundException())->setModel(AlertDestination::class, [$id]);
        }

        try {
            $this->service->archive($destination, request()->user()?->id);

            return $this->jsonDeleted('Destino arquivado com sucesso');
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao arquivar destino', 'ALERT_DESTINATION_ARCHIVE_FAILED', 500);
        }
    }

    public function toggle(int $id): JsonResponse
    {
        $destination = AlertDestination::query()->find($id);
        if ($destination === null) {
            throw (new ModelNotFoundException())->setModel(AlertDestination::class, [$id]);
        }

        try {
            $updated = $this->service->toggle($destination, request()->user()?->id);

            return $this->jsonSuccess(
                $this->service->serialize($updated),
                'Status do destino atualizado com sucesso'
            );
        } catch (RuntimeException $e) {
            return $this->jsonError($e->getMessage(), 'VALIDATION_ERROR', 422);
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao alternar status do destino', 'ALERT_DESTINATION_TOGGLE_FAILED', 500);
        }
    }
}
