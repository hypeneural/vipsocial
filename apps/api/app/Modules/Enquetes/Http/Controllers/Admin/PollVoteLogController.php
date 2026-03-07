<?php

namespace App\Modules\Enquetes\Http\Controllers\Admin;

use App\Modules\Enquetes\Models\Poll;
use App\Modules\Enquetes\Models\PollVote;
use App\Modules\Enquetes\Models\PollVoteAttempt;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;

class PollVoteLogController extends BaseController
{
    public function attempts(int $id): JsonResponse
    {
        $this->findPoll($id);
        $perPage = min(max((int) request()->integer('per_page', 20), 1), 100);

        $paginator = PollVoteAttempt::query()
            ->where('poll_id', $id)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => collect($paginator->items())->map(fn(PollVoteAttempt $attempt) => $this->serializeAttempt($attempt))->all(),
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

    public function votes(int $id): JsonResponse
    {
        $this->findPoll($id);
        $perPage = min(max((int) request()->integer('per_page', 20), 1), 100);

        $paginator = PollVote::query()
            ->with(['option', 'placement'])
            ->where('poll_id', $id)
            ->orderByDesc('accepted_at')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => collect($paginator->items())->map(fn(PollVote $vote) => $this->serializeVote($vote))->all(),
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

    public function showAttempt(string $attemptId): JsonResponse
    {
        $attempt = PollVoteAttempt::query()->find($attemptId);

        if ($attempt === null) {
            throw (new ModelNotFoundException())->setModel(PollVoteAttempt::class, [$attemptId]);
        }

        return $this->jsonSuccess($this->serializeAttempt($attempt));
    }

    public function showVote(string $voteId): JsonResponse
    {
        $vote = PollVote::query()->with(['option', 'placement'])->find($voteId);

        if ($vote === null) {
            throw (new ModelNotFoundException())->setModel(PollVote::class, [$voteId]);
        }

        return $this->jsonSuccess($this->serializeVote($vote));
    }

    private function serializeAttempt(PollVoteAttempt $attempt): array
    {
        return [
            'id' => $attempt->id,
            'poll_id' => $attempt->poll_id,
            'poll_placement_id' => $attempt->poll_placement_id,
            'poll_session_id' => $attempt->poll_session_id,
            'status' => $attempt->status,
            'block_reason' => $attempt->block_reason,
            'risk_score' => $attempt->risk_score !== null ? (float) $attempt->risk_score : null,
            'ip_hash' => $attempt->ip_hash,
            'fingerprint_hash' => $attempt->fingerprint_hash,
            'external_user_hash' => $attempt->external_user_hash,
            'browser_family' => $attempt->browser_family,
            'os_family' => $attempt->os_family,
            'device_type' => $attempt->device_type,
            'country' => $attempt->country,
            'region' => $attempt->region,
            'city' => $attempt->city,
            'asn' => $attempt->asn,
            'provider' => $attempt->provider,
            'meta' => $attempt->meta ?? [],
            'created_at' => optional($attempt->created_at)?->toIso8601String(),
            'updated_at' => optional($attempt->updated_at)?->toIso8601String(),
        ];
    }

    private function serializeVote(PollVote $vote): array
    {
        return [
            'id' => $vote->id,
            'poll_id' => $vote->poll_id,
            'option_id' => $vote->option_id,
            'option_label' => $vote->option?->label,
            'poll_placement_id' => $vote->poll_placement_id,
            'placement_name' => $vote->placement?->placement_name,
            'poll_session_id' => $vote->poll_session_id,
            'vote_attempt_id' => $vote->vote_attempt_id,
            'status' => $vote->status,
            'accepted_at' => optional($vote->accepted_at)?->toIso8601String(),
            'invalidated_at' => optional($vote->invalidated_at)?->toIso8601String(),
            'invalidated_reason' => $vote->invalidated_reason,
            'created_at' => optional($vote->created_at)?->toIso8601String(),
            'updated_at' => optional($vote->updated_at)?->toIso8601String(),
        ];
    }

    private function findPoll(int $id): Poll
    {
        $poll = Poll::query()->withTrashed()->find($id);

        if ($poll === null) {
            throw (new ModelNotFoundException())->setModel(Poll::class, [$id]);
        }

        return $poll;
    }
}
