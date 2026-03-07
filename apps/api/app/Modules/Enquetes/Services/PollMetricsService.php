<?php

namespace App\Modules\Enquetes\Services;

use App\Modules\Enquetes\Models\Poll;
use App\Modules\Enquetes\Models\PollResultSnapshot;
use App\Modules\Enquetes\Models\PollVote;
use App\Modules\Enquetes\Models\PollVoteAttempt;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class PollMetricsService
{
    public function __construct(private readonly PollService $pollService)
    {
    }

    public function overview(): array
    {
        $totalPolls = Poll::query()->count();
        $livePolls = Poll::query()->live()->count();
        $votesAccepted = PollVote::query()->valid()->count();
        $votesBlocked = PollVoteAttempt::query()->where('status', PollVoteAttempt::STATUS_BLOCKED)->count();
        $uniqueSessions = DB::table('poll_sessions')
            ->select('poll_id', 'session_token_hash')
            ->distinct()
            ->count();
        $impressions = DB::table('poll_events')
            ->whereIn('event_type', ['widget_loaded', 'widget_visible'])
            ->count();

        return [
            'total_polls' => $totalPolls,
            'live_polls' => $livePolls,
            'votes_accepted' => $votesAccepted,
            'votes_blocked' => $votesBlocked,
            'unique_sessions' => $uniqueSessions,
            'impressions' => $impressions,
            'conversion_rate' => $uniqueSessions > 0
                ? round($votesAccepted / $uniqueSessions, 4)
                : 0.0,
        ];
    }

    public function dashboard(int $id): array
    {
        $poll = $this->findPoll($id);
        $overview = $this->buildOverview($poll);

        return [
            'poll' => $this->pollService->serialize($poll),
            'overview' => $overview,
            'options' => $this->optionsBreakdown($id),
            'timeseries' => $this->timeseries($id)['series'],
        ];
    }

    public function pollOverview(int $id): array
    {
        $poll = $this->findPoll($id);

        return [
            'poll' => $this->pollService->serialize($poll),
            'overview' => $this->buildOverview($poll),
        ];
    }

    public function timeseries(int $id, string $window = '30d', ?string $bucketType = null): array
    {
        $poll = $this->findPoll($id);
        $resolvedBucketType = $this->resolveBucketType($window, $bucketType);
        $cutoff = $this->windowCutoff($window, $poll->timezone);

        $series = PollResultSnapshot::query()
            ->where('poll_id', $poll->id)
            ->where('bucket_type', $resolvedBucketType)
            ->where('bucket_at', '>=', $cutoff)
            ->orderBy('bucket_at')
            ->get()
            ->map(fn(PollResultSnapshot $snapshot) => [
                'bucket_type' => $snapshot->bucket_type,
                'bucket_at' => optional($snapshot->bucket_at)?->toIso8601String(),
                'impressions' => $snapshot->impressions,
                'unique_sessions' => $snapshot->unique_sessions,
                'votes_accepted' => $snapshot->votes_accepted,
                'votes_blocked' => $snapshot->votes_blocked,
                'conversion_rate' => (float) $snapshot->conversion_rate,
                'payload' => $snapshot->payload ?? [],
            ])
            ->all();

        return [
            'poll' => [
                'id' => $poll->id,
                'public_id' => $poll->public_id,
                'title' => $poll->title,
                'status' => $poll->status,
            ],
            'window' => $window,
            'bucket_type' => $resolvedBucketType,
            'series' => $series,
        ];
    }

    public function optionsBreakdown(int $id): array
    {
        $poll = $this->findPoll($id);
        $totalVotes = PollVote::query()
            ->where('poll_id', $poll->id)
            ->valid()
            ->count();

        $counts = PollVote::query()
            ->select('option_id', DB::raw('COUNT(*) as aggregate'))
            ->where('poll_id', $poll->id)
            ->valid()
            ->groupBy('option_id')
            ->pluck('aggregate', 'option_id');

        return $poll->options
            ->sortBy('sort_order')
            ->values()
            ->map(function ($option) use ($counts, $totalVotes) {
                $votes = (int) ($counts[$option->id] ?? 0);

                return array_merge($this->pollService->serializeOption($option), [
                    'votes' => $votes,
                    'percentage' => $totalVotes > 0 ? round(($votes / $totalVotes) * 100, 2) : 0.0,
                ]);
            })
            ->all();
    }

    public function placementsBreakdown(int $id): array
    {
        $poll = $this->findPoll($id);
        $acceptedByPlacement = PollVote::query()
            ->select('poll_placement_id', DB::raw('COUNT(*) as aggregate'))
            ->where('poll_id', $poll->id)
            ->valid()
            ->groupBy('poll_placement_id')
            ->pluck('aggregate', 'poll_placement_id');

        $blockedByPlacement = PollVoteAttempt::query()
            ->select('poll_placement_id', DB::raw('COUNT(*) as aggregate'))
            ->where('poll_id', $poll->id)
            ->where('status', PollVoteAttempt::STATUS_BLOCKED)
            ->groupBy('poll_placement_id')
            ->pluck('aggregate', 'poll_placement_id');

        $sessionsByPlacement = DB::table('poll_sessions')
            ->select('poll_placement_id', DB::raw('COUNT(DISTINCT session_token_hash) as aggregate'))
            ->where('poll_id', $poll->id)
            ->groupBy('poll_placement_id')
            ->pluck('aggregate', 'poll_placement_id');

        return $poll->placements
            ->sortBy('placement_name')
            ->values()
            ->map(function ($placement) use ($acceptedByPlacement, $blockedByPlacement, $sessionsByPlacement) {
                return [
                    'id' => $placement->id,
                    'public_id' => $placement->public_id,
                    'placement_name' => $placement->placement_name,
                    'site_name' => $placement->site?->name,
                    'canonical_url' => $placement->canonical_url,
                    'is_active' => (bool) $placement->is_active,
                    'votes_accepted' => (int) ($acceptedByPlacement[$placement->id] ?? 0),
                    'votes_blocked' => (int) ($blockedByPlacement[$placement->id] ?? 0),
                    'unique_sessions' => (int) ($sessionsByPlacement[$placement->id] ?? 0),
                ];
            })
            ->all();
    }

    public function locationsBreakdown(int $id): array
    {
        $poll = $this->findPoll($id);
        $rows = PollVoteAttempt::query()
            ->select([
                DB::raw("COALESCE(country, 'Desconhecido') as country"),
                DB::raw("COALESCE(region, 'Desconhecido') as region"),
                DB::raw("COALESCE(city, 'Desconhecido') as city"),
                DB::raw('COUNT(*) as attempts'),
                DB::raw("SUM(CASE WHEN status = '" . PollVoteAttempt::STATUS_ACCEPTED . "' THEN 1 ELSE 0 END) as accepted"),
                DB::raw("SUM(CASE WHEN status = '" . PollVoteAttempt::STATUS_BLOCKED . "' THEN 1 ELSE 0 END) as blocked"),
            ])
            ->where('poll_id', $poll->id)
            ->groupBy(
                DB::raw("COALESCE(country, 'Desconhecido')"),
                DB::raw("COALESCE(region, 'Desconhecido')"),
                DB::raw("COALESCE(city, 'Desconhecido')")
            )
            ->orderByDesc('attempts')
            ->limit(25)
            ->get();

        return $rows->map(fn($row) => [
            'country' => $row->country,
            'region' => $row->region,
            'city' => $row->city,
            'attempts' => (int) $row->attempts,
            'accepted' => (int) $row->accepted,
            'blocked' => (int) $row->blocked,
        ])->all();
    }

    public function providersBreakdown(int $id): array
    {
        return $this->aggregateAttemptsByColumn($this->findPoll($id)->id, 'provider', 'provider');
    }

    public function devicesBreakdown(int $id): array
    {
        return $this->aggregateAttemptsByColumn($this->findPoll($id)->id, 'device_type', 'device_type');
    }

    public function browsersBreakdown(int $id): array
    {
        return $this->aggregateAttemptsByColumn($this->findPoll($id)->id, 'browser_family', 'browser_family');
    }

    public function publicResults(Poll $poll): array
    {
        $totalVotes = PollVote::query()->where('poll_id', $poll->id)->valid()->count();

        $options = $poll->options
            ->where('is_active', true)
            ->sortBy('sort_order')
            ->values()
            ->map(function ($option) use ($poll, $totalVotes) {
                $votes = PollVote::query()
                    ->where('poll_id', $poll->id)
                    ->where('option_id', $option->id)
                    ->valid()
                    ->count();

                return array_merge($this->pollService->serializeOption($option), [
                    'votes' => $votes,
                    'percentage' => $totalVotes > 0 ? round(($votes / $totalVotes) * 100, 2) : 0.0,
                ]);
            })
            ->all();

        return [
            'poll' => [
                'public_id' => $poll->public_id,
                'question' => $poll->question,
                'status' => $poll->status,
                'selection_type' => $poll->selection_type,
                'results_visibility' => $poll->results_visibility,
            ],
            'total_votes' => $totalVotes,
            'options' => $options,
        ];
    }

    private function aggregateAttemptsByColumn(int $pollId, string $column, string $key): array
    {
        $rows = PollVoteAttempt::query()
            ->select([
                DB::raw("COALESCE({$column}, 'Desconhecido') as {$key}"),
                DB::raw('COUNT(*) as attempts'),
                DB::raw("SUM(CASE WHEN status = '" . PollVoteAttempt::STATUS_ACCEPTED . "' THEN 1 ELSE 0 END) as accepted"),
                DB::raw("SUM(CASE WHEN status = '" . PollVoteAttempt::STATUS_BLOCKED . "' THEN 1 ELSE 0 END) as blocked"),
            ])
            ->where('poll_id', $pollId)
            ->groupBy(DB::raw("COALESCE({$column}, 'Desconhecido')"))
            ->orderByDesc('attempts')
            ->limit(25)
            ->get();

        return $rows->map(fn($row) => [
            $key => $row->{$key},
            'attempts' => (int) $row->attempts,
            'accepted' => (int) $row->accepted,
            'blocked' => (int) $row->blocked,
        ])->all();
    }

    private function buildOverview(Poll $poll): array
    {
        $totalVotes = PollVote::query()->where('poll_id', $poll->id)->valid()->count();
        $blockedVotes = PollVoteAttempt::query()
            ->where('poll_id', $poll->id)
            ->where('status', PollVoteAttempt::STATUS_BLOCKED)
            ->count();
        $uniqueSessions = DB::table('poll_sessions')
            ->where('poll_id', $poll->id)
            ->distinct('session_token_hash')
            ->count('session_token_hash');
        $impressions = DB::table('poll_events')
            ->where('poll_id', $poll->id)
            ->whereIn('event_type', ['widget_loaded', 'widget_visible'])
            ->count();

        $topOption = collect($this->optionsBreakdown($poll->id))
            ->sortByDesc('votes')
            ->first();

        return [
            'impressions' => $impressions,
            'unique_sessions' => $uniqueSessions,
            'votes_accepted' => $totalVotes,
            'votes_blocked' => $blockedVotes,
            'conversion_rate' => $uniqueSessions > 0 ? round($totalVotes / $uniqueSessions, 4) : 0.0,
            'top_option' => $topOption,
        ];
    }

    private function findPoll(int $id): Poll
    {
        $poll = Poll::query()
            ->withTrashed()
            ->with(['options', 'placements.site'])
            ->find($id);

        if ($poll === null) {
            throw (new ModelNotFoundException())->setModel(Poll::class, [$id]);
        }

        return $poll;
    }

    private function resolveBucketType(string $window, ?string $bucketType): string
    {
        if (in_array($bucketType, ['hour', 'day'], true)) {
            return $bucketType;
        }

        return $window === '24h' ? 'hour' : 'day';
    }

    private function windowCutoff(string $window, string $timezone): CarbonImmutable
    {
        $now = CarbonImmutable::now($timezone);

        return match ($window) {
            '24h' => $now->subDay()->startOfHour(),
            '7d' => $now->subDays(7)->startOfDay(),
            '90d' => $now->subDays(90)->startOfDay(),
            default => $now->subDays(30)->startOfDay(),
        };
    }
}
