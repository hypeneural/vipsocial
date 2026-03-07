<?php

namespace App\Modules\Enquetes\Http\Controllers\Admin;

use App\Modules\Enquetes\Http\Requests\Admin\PollListRequest;
use App\Modules\Enquetes\Http\Requests\Admin\StorePollRequest;
use App\Modules\Enquetes\Http\Requests\Admin\UpdatePollRequest;
use App\Modules\Enquetes\Models\Poll;
use App\Modules\Enquetes\Services\PollService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Throwable;

class PollController extends BaseController
{
    public function __construct(private readonly PollService $service)
    {
    }

    public function index(PollListRequest $request): JsonResponse
    {
        $paginator = $this->service->paginate($request->validated());
        $items = collect($paginator->items())
            ->map(fn(Poll $poll) => $this->service->serialize($poll))
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
        return $this->jsonSuccess($this->service->serialize($this->findPoll($id)));
    }

    public function store(StorePollRequest $request): JsonResponse
    {
        try {
            $poll = $this->service->create($request->validated(), $request->user()?->id);

            return $this->jsonCreated($this->service->serialize($poll), 'Enquete criada com sucesso');
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao criar enquete', 'POLL_CREATE_FAILED', 500);
        }
    }

    public function update(int $id, UpdatePollRequest $request): JsonResponse
    {
        try {
            $poll = $this->service->update($this->findPoll($id), $request->validated(), $request->user()?->id);

            return $this->jsonSuccess($this->service->serialize($poll), 'Enquete atualizada com sucesso');
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao atualizar enquete', 'POLL_UPDATE_FAILED', 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->archive($this->findPoll($id), request()->user()?->id);

            return $this->jsonDeleted('Enquete arquivada com sucesso');
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao arquivar enquete', 'POLL_ARCHIVE_FAILED', 500);
        }
    }

    public function updateStatus(int $id): JsonResponse
    {
        $poll = $this->findPoll($id);
        $status = (string) request()->input('status');

        try {
            $poll = $this->service->changeStatus($poll, $status, request()->user()?->id);

            return $this->jsonSuccess($this->service->serialize($poll), 'Status atualizado com sucesso');
        } catch (\RuntimeException $e) {
            return $this->jsonError($e->getMessage(), 'VALIDATION_ERROR', 422);
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao atualizar status', 'POLL_STATUS_UPDATE_FAILED', 500);
        }
    }

    public function duplicate(int $id): JsonResponse
    {
        try {
            $poll = $this->service->duplicate($this->findPoll($id), request()->user()?->id);

            return $this->jsonCreated($this->service->serialize($poll), 'Enquete duplicada com sucesso');
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao duplicar enquete', 'POLL_DUPLICATE_FAILED', 500);
        }
    }

    public function pause(int $id): JsonResponse
    {
        return $this->transitionStatus($id, Poll::STATUS_PAUSED, 'Enquete pausada com sucesso');
    }

    public function close(int $id): JsonResponse
    {
        return $this->transitionStatus($id, Poll::STATUS_CLOSED, 'Enquete encerrada com sucesso');
    }

    public function reopen(int $id): JsonResponse
    {
        return $this->transitionStatus($id, Poll::STATUS_LIVE, 'Enquete reaberta com sucesso');
    }

    private function transitionStatus(int $id, string $status, string $message): JsonResponse
    {
        try {
            $poll = $this->service->changeStatus($this->findPoll($id), $status, request()->user()?->id);

            return $this->jsonSuccess($this->service->serialize($poll), $message);
        } catch (\RuntimeException $e) {
            return $this->jsonError($e->getMessage(), 'VALIDATION_ERROR', 422);
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha na transicao de status', 'POLL_STATUS_TRANSITION_FAILED', 500);
        }
    }

    private function findPoll(int $id): Poll
    {
        $poll = Poll::query()->withTrashed()->with(['options', 'placements.site'])->find($id);

        if ($poll === null) {
            throw (new ModelNotFoundException())->setModel(Poll::class, [$id]);
        }

        return $poll;
    }
}
