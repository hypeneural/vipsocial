<?php

namespace App\Modules\Enquetes\Services;

use App\Modules\Enquetes\Models\Poll;
use App\Modules\Enquetes\Models\PollVote;
use App\Modules\Enquetes\Models\PollVoteAttempt;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PollExportService
{
    public function __construct(private readonly PollMetricsService $metricsService)
    {
    }

    public function votesCsv(Poll $poll): StreamedResponse
    {
        $filename = "poll-{$poll->id}-votes.csv";

        return response()->streamDownload(function () use ($poll): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['vote_id', 'poll_id', 'option_id', 'status', 'accepted_at', 'placement_id', 'session_id', 'attempt_id', 'invalidated_at', 'invalidated_reason']);

            PollVote::query()
                ->where('poll_id', $poll->id)
                ->orderByDesc('accepted_at')
                ->chunk(500, function ($votes) use ($handle): void {
                    foreach ($votes as $vote) {
                        fputcsv($handle, [
                            $vote->id,
                            $vote->poll_id,
                            $vote->option_id,
                            $vote->status,
                            optional($vote->accepted_at)?->toIso8601String(),
                            $vote->poll_placement_id,
                            $vote->poll_session_id,
                            $vote->vote_attempt_id,
                            optional($vote->invalidated_at)?->toIso8601String(),
                            $vote->invalidated_reason,
                        ]);
                    }
                });

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function voteAttemptsCsv(Poll $poll): StreamedResponse
    {
        $filename = "poll-{$poll->id}-vote-attempts.csv";

        return response()->streamDownload(function () use ($poll): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['attempt_id', 'poll_id', 'status', 'block_reason', 'risk_score', 'placement_id', 'session_id', 'created_at']);

            PollVoteAttempt::query()
                ->where('poll_id', $poll->id)
                ->orderByDesc('created_at')
                ->chunk(500, function ($attempts) use ($handle): void {
                    foreach ($attempts as $attempt) {
                        fputcsv($handle, [
                            $attempt->id,
                            $attempt->poll_id,
                            $attempt->status,
                            $attempt->block_reason,
                            $attempt->risk_score,
                            $attempt->poll_placement_id,
                            $attempt->poll_session_id,
                            optional($attempt->created_at)?->toIso8601String(),
                        ]);
                    }
                });

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function optionsSummaryCsv(Poll $poll): StreamedResponse
    {
        $filename = "poll-{$poll->id}-options-summary.csv";
        $options = $this->metricsService->optionsBreakdown($poll->id);

        return response()->streamDownload(function () use ($options): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['option_id', 'public_id', 'label', 'votes', 'percentage', 'is_active']);

            foreach ($options as $option) {
                fputcsv($handle, [
                    $option['id'],
                    $option['public_id'],
                    $option['label'],
                    $option['votes'],
                    $option['percentage'],
                    $option['is_active'] ? '1' : '0',
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function placementsSummaryCsv(Poll $poll): StreamedResponse
    {
        $filename = "poll-{$poll->id}-placements-summary.csv";
        $placements = $this->metricsService->placementsBreakdown($poll->id);

        return response()->streamDownload(function () use ($placements): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['placement_id', 'public_id', 'placement_name', 'site_name', 'votes_accepted', 'votes_blocked', 'unique_sessions']);

            foreach ($placements as $placement) {
                fputcsv($handle, [
                    $placement['id'],
                    $placement['public_id'],
                    $placement['placement_name'],
                    $placement['site_name'],
                    $placement['votes_accepted'],
                    $placement['votes_blocked'],
                    $placement['unique_sessions'],
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
