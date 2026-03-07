<?php

namespace App\Modules\Enquetes\Http\Controllers\Admin;

use App\Modules\Enquetes\Http\Requests\Admin\StorePollPlacementRequest;
use App\Modules\Enquetes\Http\Requests\Admin\UpdatePollPlacementRequest;
use App\Modules\Enquetes\Models\Poll;
use App\Modules\Enquetes\Models\PollPlacement;
use App\Modules\Enquetes\Services\PollPlacementService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Throwable;

class PollPlacementController extends BaseController
{
    public function __construct(private readonly PollPlacementService $service)
    {
    }

    public function index(int $id): JsonResponse
    {
        $poll = Poll::query()->find($id);

        if ($poll === null) {
            throw (new ModelNotFoundException())->setModel(Poll::class, [$id]);
        }

        return $this->jsonSuccess(
            $this->service->listForPoll($poll)
                ->map(fn(PollPlacement $placement) => $this->service->serialize($placement))
                ->values()
                ->all()
        );
    }

    public function store(int $id, StorePollPlacementRequest $request): JsonResponse
    {
        $poll = Poll::query()->find($id);

        if ($poll === null) {
            throw (new ModelNotFoundException())->setModel(Poll::class, [$id]);
        }

        try {
            $placement = $this->service->create($poll, $request->validated());

            return $this->jsonCreated($this->service->serialize($placement), 'Placement criado com sucesso');
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao criar placement', 'POLL_PLACEMENT_CREATE_FAILED', 500);
        }
    }

    public function update(int $placementId, UpdatePollPlacementRequest $request): JsonResponse
    {
        try {
            $placement = $this->service->update($this->findPlacement($placementId), $request->validated());

            return $this->jsonSuccess($this->service->serialize($placement), 'Placement atualizado com sucesso');
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao atualizar placement', 'POLL_PLACEMENT_UPDATE_FAILED', 500);
        }
    }

    public function toggle(int $placementId): JsonResponse
    {
        try {
            $placement = $this->service->toggle($this->findPlacement($placementId));

            return $this->jsonSuccess($this->service->serialize($placement), 'Placement atualizado com sucesso');
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao alternar placement', 'POLL_PLACEMENT_TOGGLE_FAILED', 500);
        }
    }

    private function findPlacement(int $placementId): PollPlacement
    {
        $placement = PollPlacement::query()->with('site')->find($placementId);

        if ($placement === null) {
            throw (new ModelNotFoundException())->setModel(PollPlacement::class, [$placementId]);
        }

        return $placement;
    }
}
