<?php

namespace App\Modules\Alertas\Support;

use App\Modules\Alertas\Models\AlertScheduleRule;
use Carbon\CarbonImmutable;

class NextFiringResolver
{
    public function nextForRule(AlertScheduleRule $rule, ?CarbonImmutable $reference = null): ?CarbonImmutable
    {
        if (!$rule->active) {
            return null;
        }

        $timezone = (string) config('alertas.timezone', config('app.timezone', 'UTC'));
        $reference ??= CarbonImmutable::now($timezone);
        $reference = $reference->setTimezone($timezone)->startOfMinute();

        if ($rule->schedule_type === AlertScheduleRule::TYPE_SPECIFIC_DATE) {
            if ($rule->specific_date === null) {
                return null;
            }

            $candidate = CarbonImmutable::parse(
                $rule->specific_date->format('Y-m-d') . ' ' . $rule->time_hhmm,
                $timezone
            );

            return $candidate->greaterThanOrEqualTo($reference) ? $candidate : null;
        }

        if ($rule->schedule_type !== AlertScheduleRule::TYPE_WEEKLY || $rule->day_of_week === null) {
            return null;
        }

        for ($offset = 0; $offset <= 7; $offset++) {
            $candidateDay = $reference->addDays($offset);
            if ($candidateDay->dayOfWeek !== (int) $rule->day_of_week) {
                continue;
            }

            $candidate = CarbonImmutable::parse(
                $candidateDay->format('Y-m-d') . ' ' . $rule->time_hhmm,
                $timezone
            );

            if ($candidate->greaterThanOrEqualTo($reference)) {
                return $candidate;
            }
        }

        return null;
    }

    public function isDueAtMinute(AlertScheduleRule $rule, CarbonImmutable $minute): bool
    {
        $timezone = (string) config('alertas.timezone', config('app.timezone', 'UTC'));
        $minute = $minute->setTimezone($timezone)->startOfMinute();

        if (!$rule->active || $rule->time_hhmm !== $minute->format('H:i')) {
            return false;
        }

        return match ($rule->schedule_type) {
            AlertScheduleRule::TYPE_WEEKLY => (int) $rule->day_of_week === $minute->dayOfWeek,
            AlertScheduleRule::TYPE_SPECIFIC_DATE => $rule->specific_date?->toDateString() === $minute->toDateString(),
            default => false,
        };
    }

    public function latestDueForRule(AlertScheduleRule $rule, ?CarbonImmutable $reference = null): ?CarbonImmutable
    {
        if (!$rule->active) {
            return null;
        }

        $timezone = (string) config('alertas.timezone', config('app.timezone', 'UTC'));
        $reference ??= CarbonImmutable::now($timezone);
        $reference = $reference->setTimezone($timezone)->startOfMinute();

        if ($rule->schedule_type === AlertScheduleRule::TYPE_SPECIFIC_DATE) {
            if ($rule->specific_date === null) {
                return null;
            }

            $candidate = CarbonImmutable::parse(
                $rule->specific_date->format('Y-m-d') . ' ' . $rule->time_hhmm,
                $timezone
            );

            return $candidate->lessThanOrEqualTo($reference) ? $candidate : null;
        }

        if ($rule->schedule_type !== AlertScheduleRule::TYPE_WEEKLY || $rule->day_of_week === null) {
            return null;
        }

        for ($offset = 0; $offset <= 7; $offset++) {
            $candidateDay = $reference->subDays($offset);
            if ($candidateDay->dayOfWeek !== (int) $rule->day_of_week) {
                continue;
            }

            $candidate = CarbonImmutable::parse(
                $candidateDay->format('Y-m-d') . ' ' . $rule->time_hhmm,
                $timezone
            );

            if ($candidate->lessThanOrEqualTo($reference)) {
                return $candidate;
            }
        }

        return null;
    }
}
