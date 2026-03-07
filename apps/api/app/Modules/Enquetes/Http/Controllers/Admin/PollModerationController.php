<?php

namespace App\Modules\Enquetes\Http\Controllers\Admin;

use App\Modules\Enquetes\Models\Poll;
use App\Modules\Enquetes\Models\PollVote;
use App\Modules\Enquetes\Services\PollResultService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Throwable;

class PollModerationController extends BaseController
{
    public function __construct(private readonly PollResultService $service)
    {
    }

    public function invalidateVote(string $voteId): JsonResponse
    {
        $vote = PollVote::query()->with('poll')->find($voteId);

        if ($vote === null) {
            throw (new ModelNotFoundException())->setModel(PollVote::class, [$voteId]);
        }

        try {
            $updated = $this->service->invalidateVote(
                $vote,
                (string) request()->input('reason', 'Invalidado manualmente'),
                request()->user()?->id
            );

            return $this->jsonSuccess([
                'vote' => [
                    'id' => $updated->id,
                    'status' => $updated->status,
                    'invalidated_at' => optional($updated->invalidated_at)?->toIso8601String(),
                    'invalidated_reason' => $updated->invalidated_reason,
                ],
            ], 'Voto invalidado com sucesso');
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao invalidar voto', 'POLL_VOTE_INVALIDATE_FAILED', 500);
        }
    }

    public function rebuildSnapshots(int $id): JsonResponse
    {
        $poll = Poll::query()->withTrashed()->find($id);

        if ($poll === null) {
            throw (new ModelNotFoundException())->setModel(Poll::class, [$id]);
        }

        try {
            $this->service->rebuildSnapshots($poll);

            return $this->jsonSuccess([
                'poll_id' => $poll->id,
            ], 'Snapshots reconstruidos com sucesso');
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao reconstruir snapshots', 'POLL_REBUILD_SNAPSHOTS_FAILED', 500);
        }
    }
}
