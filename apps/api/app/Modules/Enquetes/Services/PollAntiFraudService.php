<?php

namespace App\Modules\Enquetes\Services;

use App\Modules\Enquetes\Models\Poll;
use App\Modules\Enquetes\Models\PollSession;
use App\Modules\Enquetes\Models\PollVote;
use App\Modules\Enquetes\Models\PollVoteLock;
use Carbon\CarbonImmutable;

class PollAntiFraudService
{
    public function check(Poll $poll, ?PollSession $session, array $context): array
    {
        $now = CarbonImmutable::now($poll->timezone ?: (string) config('enquetes.timezone', 'America/Sao_Paulo'));

        $candidates = [
            'session' => $session?->session_token_hash,
            'fingerprint' => $context['fingerprint_hash'] ?? null,
            'external_user' => $context['external_user_hash'] ?? null,
            'ip_window' => $context['ip_hash'] ?? null,
        ];

        foreach ($candidates as $scope => $key) {
            if (blank($key)) {
                continue;
            }

            $locked = PollVoteLock::query()
                ->where('poll_id', $poll->id)
                ->where('lock_scope', $scope)
                ->where('lock_key', $key)
                ->where(function ($query) use ($now): void {
                    $query->whereNull('locked_until')
                        ->orWhere('locked_until', '>', $now->toDateTimeString());
                })
                ->first();

            if ($locked !== null) {
                return [
                    'blocked' => true,
                    'block_reason' => $this->reasonForLimitMode($poll->vote_limit_mode),
                    'risk_score' => 100.0,
                    'lock_scope' => $scope,
                ];
            }
        }

        return [
            'blocked' => false,
            'block_reason' => null,
            'risk_score' => 0.0,
            'lock_scope' => null,
        ];
    }

    public function persistLocks(Poll $poll, PollVote $vote, ?PollSession $session, array $context): void
    {
        $lockedUntil = $this->lockedUntil($poll);
        $locks = [
            'session' => $session?->session_token_hash,
            'fingerprint' => $context['fingerprint_hash'] ?? null,
            'external_user' => $context['external_user_hash'] ?? null,
            'ip_window' => $context['ip_hash'] ?? null,
        ];

        foreach ($locks as $scope => $key) {
            if (blank($key)) {
                continue;
            }

            PollVoteLock::query()->updateOrCreate(
                [
                    'poll_id' => $poll->id,
                    'lock_scope' => $scope,
                    'lock_key' => $key,
                ],
                [
                    'vote_id' => $vote->id,
                    'locked_until' => $lockedUntil,
                ]
            );
        }
    }

    private function lockedUntil(Poll $poll): ?string
    {
        $now = CarbonImmutable::now($poll->timezone ?: (string) config('enquetes.timezone', 'America/Sao_Paulo'));

        return match ($poll->vote_limit_mode) {
            Poll::LIMIT_ONCE_EVER => null,
            Poll::LIMIT_ONCE_PER_DAY => $now->endOfDay()->toDateTimeString(),
            Poll::LIMIT_ONCE_PER_WINDOW => $now->addMinutes((int) ($poll->vote_cooldown_minutes ?? 0))->toDateTimeString(),
            default => null,
        };
    }

    private function reasonForLimitMode(string $voteLimitMode): string
    {
        return match ($voteLimitMode) {
            Poll::LIMIT_ONCE_PER_DAY => 'ALREADY_VOTED_TODAY',
            Poll::LIMIT_ONCE_PER_WINDOW => 'ALREADY_VOTED_IN_WINDOW',
            default => 'ALREADY_VOTED',
        };
    }
}
