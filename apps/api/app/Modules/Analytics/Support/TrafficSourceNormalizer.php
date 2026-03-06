<?php

namespace App\Modules\Analytics\Support;

final class TrafficSourceNormalizer
{
    private const DIRECT_LABEL = 'Direct';
    private const DIRECT_GROUP = 'Direct';

    private array $rules;

    public function __construct(?array $rules = null)
    {
        $configuredRules = $rules;
        if ($configuredRules === null && function_exists('config')) {
            $candidate = config('analytics_sources.rules');
            if (is_array($candidate)) {
                $configuredRules = $candidate;
            }
        }

        $this->rules = $this->sanitizeRules($configuredRules ?? []);
    }

    public function normalize(?string $channelRaw, ?string $sourceRaw, ?string $mediumRaw, ?string $sourceMediumRaw): array
    {
        $channel = $this->normalizeToken($channelRaw);
        $source = $this->normalizeToken($sourceRaw);
        $medium = $this->normalizeToken($mediumRaw);

        if (
            str_contains($channel, 'direct') ||
            ($source === '(direct)' && $medium === '(none)')
        ) {
            return [
                'source_key' => 'direct',
                'source_normalized' => self::DIRECT_LABEL,
                'group' => self::DIRECT_GROUP,
                'confidence' => 'high',
            ];
        }

        $candidate = $this->normalizeSourceCandidate($sourceRaw, $sourceMediumRaw);
        foreach ($this->rules as $rule) {
            if (($rule['key'] ?? '') === 'other') {
                continue;
            }

            foreach ($rule['patterns'] as $pattern) {
                if (preg_match($pattern, $candidate) !== 1) {
                    continue;
                }

                return [
                    'source_key' => $rule['key'],
                    'source_normalized' => $rule['label'],
                    'group' => $rule['group'],
                    'confidence' => $rule['key'] === 'other' ? 'low' : 'high',
                ];
            }
        }

        return $this->fallbackByChannel($channel);
    }

    public function resolveSourceRaw(?string $sessionManualSource, ?string $sessionSource): string
    {
        if (!$this->isEmptyOrNotSet($sessionManualSource)) {
            return trim((string) $sessionManualSource);
        }

        if ($this->isEmptyOrNotSet($sessionSource)) {
            return '(not set)';
        }

        return trim((string) $sessionSource);
    }

    private function normalizeSourceCandidate(?string $sourceRaw, ?string $sourceMediumRaw): string
    {
        $source = trim((string) ($sourceRaw ?? ''));
        if ($this->isEmptyOrNotSet($source)) {
            $source = trim((string) ($sourceMediumRaw ?? ''));
        }

        if ($this->isEmptyOrNotSet($source)) {
            return '';
        }

        $normalized = strtolower($source);
        if (str_contains($normalized, ' / ')) {
            $normalized = trim((string) explode(' / ', $normalized, 2)[0]);
        }
        $normalized = preg_replace('#^\w+://#', '', $normalized) ?? $normalized;
        $normalized = preg_replace('#^//#', '', $normalized) ?? $normalized;

        $host = parse_url("https://{$normalized}", PHP_URL_HOST);
        if (is_string($host) && $host !== '') {
            $normalized = $host;
        } else {
            $normalized = preg_replace('#[/?#].*$#', '', $normalized) ?? $normalized;
        }

        if (str_contains($normalized, '@')) {
            $segments = explode('@', $normalized);
            $candidateHost = end($segments);
            if (is_string($candidateHost) && $candidateHost !== '') {
                $host = parse_url("https://{$candidateHost}", PHP_URL_HOST);
                if (is_string($host) && $host !== '') {
                    $normalized = $host;
                }
            }
        }

        if (str_contains($normalized, ':')) {
            $host = parse_url("https://{$normalized}", PHP_URL_HOST);
            if (is_string($host) && $host !== '') {
                $normalized = $host;
            }
        }

        $normalized = preg_replace('/^www\./', '', $normalized) ?? $normalized;
        $normalized = rtrim($normalized, '.');

        return trim($normalized);
    }

    private function normalizeToken(?string $value): string
    {
        return strtolower(trim((string) ($value ?? '')));
    }

    private function isEmptyOrNotSet(?string $value): bool
    {
        $normalized = $this->normalizeToken($value);

        return $normalized === '' || $normalized === '(not set)';
    }

    private function fallbackByChannel(string $channel): array
    {
        if (str_contains($channel, 'search')) {
            return [
                'source_key' => 'other_search',
                'source_normalized' => 'Other Search',
                'group' => 'Search',
                'confidence' => 'medium',
            ];
        }

        if (str_contains($channel, 'social')) {
            return [
                'source_key' => 'other_social',
                'source_normalized' => 'Other Social',
                'group' => 'Social',
                'confidence' => 'medium',
            ];
        }

        if (str_contains($channel, 'video')) {
            return [
                'source_key' => 'other_video',
                'source_normalized' => 'Other Video',
                'group' => 'Video',
                'confidence' => 'medium',
            ];
        }

        if (str_contains($channel, 'email')) {
            return [
                'source_key' => 'other_email',
                'source_normalized' => 'Other Email',
                'group' => 'Email',
                'confidence' => 'medium',
            ];
        }

        return [
            'source_key' => 'other',
            'source_normalized' => 'Other',
            'group' => 'Referral',
            'confidence' => 'low',
        ];
    }

    private function sanitizeRules(array $rules): array
    {
        $sanitized = [];
        foreach ($rules as $rule) {
            if (!is_array($rule)) {
                continue;
            }

            $key = trim((string) ($rule['key'] ?? ''));
            $label = trim((string) ($rule['label'] ?? ''));
            $group = trim((string) ($rule['group'] ?? 'Referral'));
            $patterns = array_values(array_filter(
                is_array($rule['patterns'] ?? null) ? $rule['patterns'] : [],
                static fn($pattern): bool => is_string($pattern) && $pattern !== ''
            ));

            if ($key === '' || $label === '' || empty($patterns)) {
                continue;
            }

            $sanitized[] = [
                'key' => $key,
                'label' => $label,
                'group' => $group !== '' ? $group : 'Referral',
                'patterns' => $patterns,
            ];
        }

        if (!empty($sanitized)) {
            return $sanitized;
        }

        return [
            [
                'key' => 'other',
                'label' => 'Other',
                'group' => 'Referral',
                'patterns' => ['/.*/'],
            ],
        ];
    }
}
