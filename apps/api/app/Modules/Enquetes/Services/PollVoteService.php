<?php

namespace App\Modules\Enquetes\Services;

use App\Modules\Enquetes\Models\Poll;
use App\Modules\Enquetes\Models\PollEvent;
use App\Modules\Enquetes\Models\PollOption;
use App\Modules\Enquetes\Models\PollPlacement;
use App\Modules\Enquetes\Models\PollVote;
use App\Modules\Enquetes\Models\PollVoteAttempt;
use App\Modules\Enquetes\Support\PollStateResolver;
use App\Modules\Enquetes\Support\VoteContextResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PollVoteService
{
    public function __construct(
        private readonly VoteContextResolver $contextResolver,
        private readonly PollStateResolver $stateResolver,
        private readonly PollWidgetSessionService $sessionService,
        private readonly PollAntiFraudService $antiFraudService,
        private readonly PollMetricsService $metricsService
    ) {
    }

    public function submit(string $pollPublicId, array $payload, Request $request): array
    {
        return DB::transaction(function () use ($pollPublicId, $payload, $request): array {
            $poll = Poll::query()
                ->with('options')
                ->where('public_id', $pollPublicId)
                ->firstOrFail();

            $placement = PollPlacement::query()
                ->where('public_id', $payload['placement_public_id'])
                ->where('poll_id', $poll->id)
                ->where('is_active', true)
                ->firstOrFail();

            $state = $this->stateResolver->resolveWidgetState($poll);
            if ($state !== 'accepting_votes') {
                throw new RuntimeException('POLL_NOT_ACCEPTING_VOTES');
            }

            $options = PollOption::query()
                ->where('poll_id', $poll->id)
                ->whereIn('public_id', $payload['option_public_ids'])
                ->where('is_active', true)
                ->get();

            if ($options->count() !== count($payload['option_public_ids'])) {
                throw new RuntimeException('POLL_OPTION_NOT_FOUND');
            }

            $this->validateSelection($poll, $options->count());

            $sessionData = $this->sessionService->start($placement, $payload, $request);
            $session = $this->sessionService->findByToken($sessionData['session_token']);
            $context = $this->contextResolver->resolve($request, $payload);

            $attempt = PollVoteAttempt::query()->create([
                'poll_id' => $poll->id,
                'poll_placement_id' => $placement->id,
                'poll_session_id' => $session?->id,
                'status' => PollVoteAttempt::STATUS_ERROR,
                'ip_hash' => $context['ip_hash'],
                'fingerprint_hash' => $context['fingerprint_hash'],
                'external_user_hash' => $context['external_user_hash'],
                'user_agent' => $context['user_agent'],
                'meta' => array_merge($payload['meta'] ?? [], [
                    'option_public_ids' => $payload['option_public_ids'],
                ]),
            ]);

            $fraudResult = $this->antiFraudService->check($poll, $session, $context);

            if ($fraudResult['blocked'] === true) {
                $attempt->status = PollVoteAttempt::STATUS_BLOCKED;
                $attempt->block_reason = $fraudResult['block_reason'];
                $attempt->risk_score = $fraudResult['risk_score'];
                $attempt->save();

                PollEvent::query()->create([
                    'poll_id' => $poll->id,
                    'poll_placement_id' => $placement->id,
                    'poll_session_id' => $session?->id,
                    'event_type' => 'vote_blocked',
                    'meta' => [
                        'block_reason' => $fraudResult['block_reason'],
                    ],
                    'created_at' => now(),
                ]);

                return [
                    'accepted' => false,
                    'block_reason' => $fraudResult['block_reason'],
                    'message' => $this->blockedMessage($fraudResult['block_reason']),
                    'results_available' => false,
                    'results' => null,
                    'http_status' => 409,
                ];
            }

            $attempt->status = PollVoteAttempt::STATUS_ACCEPTED;
            $attempt->risk_score = $fraudResult['risk_score'];
            $attempt->save();

            $firstVote = null;
            foreach ($options as $option) {
                $vote = PollVote::query()->create([
                    'poll_id' => $poll->id,
                    'option_id' => $option->id,
                    'poll_placement_id' => $placement->id,
                    'poll_session_id' => $session?->id,
                    'vote_attempt_id' => $attempt->id,
                    'status' => PollVote::STATUS_VALID,
                    'ip_hash' => $context['ip_hash'],
                    'fingerprint_hash' => $context['fingerprint_hash'],
                    'external_user_hash' => $context['external_user_hash'],
                    'accepted_at' => now(),
                ]);

                $firstVote ??= $vote;
            }

            if ($firstVote !== null) {
                $this->antiFraudService->persistLocks($poll, $firstVote, $session, $context);
            }

            PollEvent::query()->create([
                'poll_id' => $poll->id,
                'poll_placement_id' => $placement->id,
                'poll_session_id' => $session?->id,
                'event_type' => 'vote_accepted',
                'meta' => [
                    'option_public_ids' => $payload['option_public_ids'],
                ],
                'created_at' => now(),
            ]);

            $resultsAvailable = in_array($poll->results_visibility, [Poll::RESULTS_LIVE, Poll::RESULTS_AFTER_VOTE], true);

            return [
                'accepted' => true,
                'message' => 'Voto registrado com sucesso.',
                'results_available' => $resultsAvailable,
                'results' => $resultsAvailable ? $this->metricsService->publicResults($poll->fresh('options')) : null,
                'http_status' => 200,
            ];
        });
    }

    private function validateSelection(Poll $poll, int $selectedCount): void
    {
        if ($poll->selection_type === Poll::SELECTION_SINGLE && $selectedCount !== 1) {
            throw new RuntimeException('POLL_SINGLE_SELECTION_REQUIRED');
        }

        if ($poll->selection_type === Poll::SELECTION_MULTIPLE) {
            $maxChoices = (int) ($poll->max_choices ?? 0);

            if ($selectedCount < 1 || ($maxChoices > 0 && $selectedCount > $maxChoices)) {
                throw new RuntimeException('POLL_MAX_CHOICES_EXCEEDED');
            }
        }
    }

    private function blockedMessage(string $blockReason): string
    {
        return match ($blockReason) {
            'ALREADY_VOTED_TODAY' => 'Voce ja votou nesta enquete hoje.',
            'ALREADY_VOTED_IN_WINDOW' => 'Voce ja votou nesta enquete recentemente.',
            default => 'Voce ja votou nesta enquete.',
        };
    }
}
