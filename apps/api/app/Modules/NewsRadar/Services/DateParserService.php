<?php

namespace App\Modules\NewsRadar\Services;

use Carbon\Carbon;

class DateParserService
{
    /**
     * Parse a raw date string using preprocessors, custom formats, and Carbon autodetect.
     *
     * @return DateParseResult
     */
    public function parse(
        string $rawDate,
        array $dateFormats = [],
        string $timezoneDefault = 'America/Sao_Paulo',
        array $preprocessors = [],
        ?string $source = null
    ): DateParseResult {
        $processed = $this->preprocess($rawDate, $preprocessors);

        // Try configured formats first
        foreach ($dateFormats as $format) {
            try {
                $parsed = Carbon::createFromFormat($format, $processed, $timezoneDefault);
                if ($parsed && $parsed->isValid()) {
                    return new DateParseResult(
                        raw: $rawDate,
                        parsed: $parsed,
                        utc: $parsed->copy()->utc(),
                        timezone: $timezoneDefault,
                        source: $source ?? 'configured_format',
                    );
                }
            } catch (\Throwable) {
                continue;
            }
        }

        // Fallback: Carbon autodetect
        try {
            $parsed = Carbon::parse($processed, $timezoneDefault);
            if ($parsed->isValid()) {
                return new DateParseResult(
                    raw: $rawDate,
                    parsed: $parsed,
                    utc: $parsed->copy()->utc(),
                    timezone: $timezoneDefault,
                    source: $source ?? 'carbon_autodetect',
                );
            }
        } catch (\Throwable) {
            // Could not parse
        }

        return new DateParseResult(
            raw: $rawDate,
            parsed: null,
            utc: null,
            timezone: $timezoneDefault,
            source: 'unparseable',
        );
    }

    /**
     * Apply preprocessors to the raw date string before parsing.
     */
    private function preprocess(string $raw, array $preprocessors): string
    {
        $result = $raw;

        foreach ($preprocessors as $preprocessor) {
            $type = $preprocessor['type'] ?? '';

            switch ($type) {
                case 'replace':
                    $search = $preprocessor['search'] ?? '';
                    $replace = $preprocessor['replace'] ?? '';
                    $result = str_replace($search, $replace, $result);
                    break;

                case 'trim':
                    $result = trim($result);
                    break;

                case 'regex_extract':
                    $pattern = $preprocessor['pattern'] ?? '';
                    if ($pattern && preg_match($pattern, $result, $matches)) {
                        $result = $matches[1] ?? $matches[0];
                    }
                    break;
            }
        }

        return $result;
    }
}

class DateParseResult
{
    public function __construct(
        public readonly string $raw,
        public readonly ?Carbon $parsed,
        public readonly ?Carbon $utc,
        public readonly string $timezone,
        public readonly string $source,
    ) {}

    public function wasSuccessful(): bool
    {
        return $this->parsed !== null;
    }

    public function toArray(): array
    {
        return [
            'raw' => $this->raw,
            'parsed' => $this->parsed?->toIso8601String(),
            'utc' => $this->utc?->toIso8601String(),
            'timezone' => $this->timezone,
            'source' => $this->source,
        ];
    }
}
