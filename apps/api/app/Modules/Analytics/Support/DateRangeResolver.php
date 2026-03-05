<?php

namespace App\Modules\Analytics\Support;

use Carbon\CarbonImmutable;
use InvalidArgumentException;

final class DateRangeResolver
{
    public static function resolve(array $query, string $timezone): array
    {
        $preset = $query['date_preset'] ?? 'last_7_days';
        $compare = $query['compare'] ?? 'none';
        $today = CarbonImmutable::now($timezone)->startOfDay();

        switch ($preset) {
            case 'today':
                $start = $today;
                $end = $today;
                break;
            case 'yesterday':
                $start = $today->subDay();
                $end = $today->subDay();
                break;
            case 'last_7_days':
                $start = $today->subDays(6);
                $end = $today;
                break;
            case 'last_30_days':
                $start = $today->subDays(29);
                $end = $today;
                break;
            case 'month_to_date':
                $start = $today->startOfMonth();
                $end = $today;
                break;
            case 'custom':
                $start = CarbonImmutable::createFromFormat('Y-m-d', $query['start_date'], $timezone)->startOfDay();
                $end = CarbonImmutable::createFromFormat('Y-m-d', $query['end_date'], $timezone)->startOfDay();
                if ($start->gt($end)) {
                    throw new InvalidArgumentException('start_date nao pode ser maior que end_date');
                }
                break;
            default:
                throw new InvalidArgumentException("date_preset invalido: {$preset}");
        }

        $context = [
            'preset' => $preset,
            'start' => $start->toDateString(),
            'end' => $end->toDateString(),
            'compare' => $compare,
        ];

        if ($compare !== 'none') {
            [$compareStart, $compareEnd] = self::resolveComparisonRange($compare, $start, $end);
            $context['compare_start'] = $compareStart->toDateString();
            $context['compare_end'] = $compareEnd->toDateString();
        }

        return $context;
    }

    private static function resolveComparisonRange(string $compare, CarbonImmutable $start, CarbonImmutable $end): array
    {
        if ($compare === 'previous_period') {
            $days = $start->diffInDays($end) + 1;
            $compareEnd = $start->subDay();
            $compareStart = $compareEnd->subDays($days - 1);
            return [$compareStart, $compareEnd];
        }

        if ($compare === 'previous_year') {
            return [$start->subYear(), $end->subYear()];
        }

        throw new InvalidArgumentException("compare invalido: {$compare}");
    }
}

