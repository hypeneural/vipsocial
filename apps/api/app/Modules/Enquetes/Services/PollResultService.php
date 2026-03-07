<?php

namespace App\Modules\Enquetes\Services;

use App\Modules\Enquetes\Models\Poll;
use App\Modules\Enquetes\Models\PollResultSnapshot;
use App\Modules\Enquetes\Models\PollVote;
use App\Modules\Enquetes\Models\PollVoteAttempt;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

class PollResultService
{
    public function reconcileAll(): int
    {
        $count = 0;

        Poll::query()->withTrashed()->chunkById(100, function ($polls) use (&$count): void {
            foreach ($polls as $poll) {
                $this->rebuildSnapshots($poll);
                $count++;
            }
        });

        return $count;
    }

    public function rebuildSnapshots(Poll $poll): void
    {
        $timezone = $poll->timezone ?: (string) config('enquetes.timezone', 'America/Sao_Paulo');
        $now = CarbonImmutable::now($timezone);
        $earliest = $this->resolveEarliestBucketStart($poll, $timezone);

        PollResultSnapshot::query()
            ->where('poll_id', $poll->id)
            ->delete();

        foreach (CarbonPeriod::create($earliest->startOfHour(), '1 hour', $now->startOfHour()) as $bucketAt) {
            $this->upsertSnapshot($poll, 'hour', CarbonImmutable::instance($bucketAt));
        }

        foreach (CarbonPeriod::create($earliest->startOfDay(), '1 day', $now->startOfDay()) as $bucketAt) {
            $this->upsertSnapshot($poll, 'day', CarbonImmutable::instance($bucketAt));
        }
    }

    public function invalidateVote(PollVote $vote, string $reason, ?int $userId = null): PollVote
    {
        if ($vote->status === PollVote::STATUS_INVALIDATED) {
            return $vote->fresh();
        }

        DB::transaction(function () use ($vote, $reason): void {
            $vote->status = PollVote::STATUS_INVALIDATED;
            $vote->invalidated_at = now();
            $vote->invalidated_reason = $reason;
            $vote->save();
        });

        $poll = Poll::query()->withTrashed()->findOrFail($vote->poll_id);
        $this->rebuildSnapshots($poll);

        return $vote->fresh();
    }

    private function resolveEarliestBucketStart(Poll $poll, string $timezone): CarbonImmutable
    {
        $earliest = collect([
            $poll->created_at,
            PollVote::query()->where('poll_id', $poll->id)->min('accepted_at'),
            PollVoteAttempt::query()->where('poll_id', $poll->id)->min('created_at'),
            DB::table('poll_sessions')->where('poll_id', $poll->id)->min('first_seen_at'),
            DB::table('poll_events')->where('poll_id', $poll->id)->min('created_at'),
        ])
            ->filter()
            ->map(fn($value) => $this->asImmutable($value, $timezone))
            ->sort()
            ->first();

        return $earliest instanceof CarbonImmutable
            ? $earliest
            : CarbonImmutable::now($timezone);
    }

    private function asImmutable(mixed $value, string $timezone): CarbonImmutable
    {
        if ($value instanceof CarbonImmutable) {
            return $value->shiftTimezone($timezone);
        }

        if ($value instanceof CarbonInterface) {
            return CarbonImmutable::instance($value)->shiftTimezone($timezone);
        }

        return CarbonImmutable::parse((string) $value, $timezone);
    }

    private function upsertSnapshot(Poll $poll, string $bucketType, CarbonImmutable $bucketAt): void
    {
        $periodEnd = $bucketType === 'hour' ? $bucketAt->endOfHour() : $bucketAt->endOfDay();

        $acceptedVotes = PollVote::query()
            ->where('poll_id', $poll->id)
            ->valid()
            ->where('accepted_at', '<=', $periodEnd)
            ->count();

        $blockedVotes = PollVoteAttempt::query()
            ->where('poll_id', $poll->id)
            ->where('status', PollVoteAttempt::STATUS_BLOCKED)
            ->where('created_at', '<=', $periodEnd)
            ->count();

        $uniqueSessions = DB::table('poll_sessions')
            ->where('poll_id', $poll->id)
            ->where('first_seen_at', '<=', $periodEnd)
            ->distinct('session_token_hash')
            ->count('session_token_hash');

        $impressions = DB::table('poll_events')
            ->where('poll_id', $poll->id)
            ->whereIn('event_type', ['widget_loaded', 'widget_visible'])
            ->where('created_at', '<=', $periodEnd)
            ->count();

        PollResultSnapshot::query()->updateOrCreate(
            [
                'poll_id' => $poll->id,
                'bucket_type' => $bucketType,
                'bucket_at' => $bucketAt->toDateTimeString(),
            ],
            [
                'impressions' => $impressions,
                'unique_sessions' => $uniqueSessions,
                'votes_accepted' => $acceptedVotes,
                'votes_blocked' => $blockedVotes,
                'conversion_rate' => $uniqueSessions > 0 ? round($acceptedVotes / $uniqueSessions, 4) : 0.0,
                'payload' => [
                    'reconciled_at' => now()->toIso8601String(),
                    'reconciled_by' => 'poll_result_service',
                ],
            ]
        );
    }
}
