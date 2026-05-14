<?php

namespace App\Modules\Externas\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

final class ExternalEventDateTime
{
    public const LOCAL_TIMEZONE = 'America/Sao_Paulo';

    private const EXPLICIT_TIMEZONE_PATTERN = '/(?:Z|[+-]\d{2}:?\d{2})$/i';

    public static function toUtcCarbon(mixed $value): ?CarbonImmutable
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof CarbonInterface) {
            return CarbonImmutable::instance($value)->setTimezone('UTC');
        }

        $raw = trim((string) $value);

        if ($raw === '') {
            return null;
        }

        $date = preg_match(self::EXPLICIT_TIMEZONE_PATTERN, $raw) === 1
            ? CarbonImmutable::parse($raw)
            : CarbonImmutable::parse($raw, self::LOCAL_TIMEZONE);

        return $date->setTimezone('UTC');
    }

    public static function toUtcDateTimeString(mixed $value): ?string
    {
        return self::toUtcCarbon($value)?->format('Y-m-d H:i:s');
    }
}
