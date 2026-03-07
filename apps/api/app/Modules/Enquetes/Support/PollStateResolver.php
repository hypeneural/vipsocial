<?php

namespace App\Modules\Enquetes\Support;

use App\Modules\Enquetes\Models\Poll;
use Carbon\CarbonImmutable;

class PollStateResolver
{
    public function resolveWidgetState(Poll $poll, ?CarbonImmutable $now = null): string
    {
        $current = $now ?? CarbonImmutable::now($poll->timezone ?: (string) config('enquetes.timezone', 'America/Sao_Paulo'));

        if ($poll->status === Poll::STATUS_PAUSED) {
            return 'paused';
        }

        if ($poll->status === Poll::STATUS_ARCHIVED) {
            return 'ended_hide';
        }

        if ($poll->status === Poll::STATUS_CLOSED) {
            return match ($poll->after_end_behavior) {
                Poll::END_HIDE_WIDGET => 'ended_hide',
                Poll::END_SHOW_CLOSED_MESSAGE => 'ended_closed_message',
                default => 'ended_results_only',
            };
        }

        if ($poll->starts_at !== null && $current->lt(CarbonImmutable::instance($poll->starts_at)->setTimezone($current->getTimezone()))) {
            return 'not_started';
        }

        if ($poll->ends_at !== null && $current->gte(CarbonImmutable::instance($poll->ends_at)->setTimezone($current->getTimezone()))) {
            return match ($poll->after_end_behavior) {
                Poll::END_HIDE_WIDGET => 'ended_hide',
                Poll::END_SHOW_CLOSED_MESSAGE => 'ended_closed_message',
                default => 'ended_results_only',
            };
        }

        return 'accepting_votes';
    }

    public function syncPersistedStatus(Poll $poll, ?CarbonImmutable $now = null): Poll
    {
        if (in_array($poll->status, [Poll::STATUS_PAUSED, Poll::STATUS_ARCHIVED], true)) {
            return $poll;
        }

        $current = $now ?? CarbonImmutable::now($poll->timezone ?: (string) config('enquetes.timezone', 'America/Sao_Paulo'));
        $nextStatus = $poll->status;

        if ($poll->ends_at !== null && $current->gte(CarbonImmutable::instance($poll->ends_at)->setTimezone($current->getTimezone()))) {
            $nextStatus = Poll::STATUS_CLOSED;
        } elseif ($poll->starts_at !== null && $current->lt(CarbonImmutable::instance($poll->starts_at)->setTimezone($current->getTimezone()))) {
            $nextStatus = Poll::STATUS_SCHEDULED;
        } elseif ($poll->starts_at === null || $current->gte(CarbonImmutable::instance($poll->starts_at)->setTimezone($current->getTimezone()))) {
            $nextStatus = Poll::STATUS_LIVE;
        }

        if ($nextStatus !== $poll->status) {
            $poll->status = $nextStatus;
            $poll->save();
        }

        return $poll;
    }
}
