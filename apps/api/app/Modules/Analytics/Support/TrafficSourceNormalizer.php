<?php

namespace App\Modules\Analytics\Support;

final class TrafficSourceNormalizer
{
    private const DIRECT_LABEL = 'Direct';
    private const DIRECT_GROUP = 'Direct';

    private array $rules;

    public function __construct(?array $rules = null)
    {
        $this->rules = $this->sanitizeRules($this->resolveRules($rules));
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
                'group_label' => $this->groupLabel(self::DIRECT_GROUP),
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
                    'group_label' => $this->groupLabel($rule['group']),
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
                'source_normalized' => 'Outras Buscas',
                'group' => 'Search',
                'group_label' => $this->groupLabel('Search'),
                'confidence' => 'medium',
            ];
        }

        if (str_contains($channel, 'social')) {
            return [
                'source_key' => 'other_social',
                'source_normalized' => 'Outras Redes Sociais',
                'group' => 'Social',
                'group_label' => $this->groupLabel('Social'),
                'confidence' => 'medium',
            ];
        }

        if (str_contains($channel, 'video')) {
            return [
                'source_key' => 'other_video',
                'source_normalized' => 'Outros Videos',
                'group' => 'Video',
                'group_label' => $this->groupLabel('Video'),
                'confidence' => 'medium',
            ];
        }

        if (str_contains($channel, 'email')) {
            return [
                'source_key' => 'other_email',
                'source_normalized' => 'Outros Emails',
                'group' => 'Email',
                'group_label' => $this->groupLabel('Email'),
                'confidence' => 'medium',
            ];
        }

        return [
            'source_key' => 'other',
            'source_normalized' => 'Outras Origens',
            'group' => 'Referral',
            'group_label' => $this->groupLabel('Referral'),
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

        if (!empty($sanitized) && $this->hasCoreRules($sanitized)) {
            return $sanitized;
        }

        return self::defaultRules();
    }

    private function resolveRules(?array $rules): array
    {
        if (is_array($rules) && !empty($rules)) {
            return $rules;
        }

        if (function_exists('config')) {
            try {
                $candidate = config('analytics_sources.rules');
                if (is_array($candidate) && !empty($candidate)) {
                    return $candidate;
                }
            } catch (\Throwable) {
                // Config helper can exist without a bootstrapped container in isolated unit tests.
            }
        }

        if (function_exists('base_path')) {
            try {
                $path = base_path('config/analytics_sources.php');
                if (is_string($path) && is_file($path)) {
                    $fileConfig = require $path;
                    $candidate = $fileConfig['rules'] ?? null;
                    if (is_array($candidate) && !empty($candidate)) {
                        return $candidate;
                    }
                }
            } catch (\Throwable) {
                // Base path helper may not be fully available in isolated unit tests.
            }
        }

        return self::defaultRules();
    }

    private function groupLabel(string $group): string
    {
        return match (strtolower(trim($group))) {
            'direct' => 'Direto',
            'search' => 'Buscas',
            'social' => 'Redes Sociais',
            'video' => 'Videos',
            'messaging' => 'Mensagens',
            'email' => 'Email',
            'ai' => 'IA',
            default => 'Referencias',
        };
    }

    private function hasCoreRules(array $rules): bool
    {
        $keys = array_map(
            static fn(array $rule): string => strtolower((string) ($rule['key'] ?? '')),
            $rules
        );

        return in_array('google', $keys, true)
            && in_array('facebook', $keys, true)
            && in_array('whatsapp', $keys, true);
    }

    private static function defaultRules(): array
    {
        return [
            [
                'key' => 'whatsapp',
                'label' => 'WhatsApp',
                'group' => 'Messaging',
                'patterns' => [
                    '/^tvvip\.social$/i',
                    '/(^|\.)roteiro\.tvvip\.social$/i',
                    '/^wa\.me$/i',
                    '/^api\.whatsapp\.com$/i',
                    '/^web\.whatsapp\.com$/i',
                    '/^l\.whatsapp\.com$/i',
                    '/(^|\.)whatsapp\.com$/i',
                    '/^l\.wl\.co$/i',
                    '/\bwhatsapp\b/i',
                    '/\bwa\.me\b/i',
                ],
            ],
            [
                'key' => 'facebook',
                'label' => 'Facebook',
                'group' => 'Social',
                'patterns' => [
                    '/(^|\.)facebook\.com$/i',
                    '/^(m|l|lm|mbasic|web)\.facebook\.com$/i',
                    '/^fb\.com$/i',
                    '/^fb\.me$/i',
                    '/^fb$/i',
                    '/\bfacebook\b/i',
                ],
            ],
            [
                'key' => 'instagram',
                'label' => 'Instagram',
                'group' => 'Social',
                'patterns' => [
                    '/(^|\.)instagram\.com$/i',
                    '/^(l|lm|m)\.instagram\.com$/i',
                    '/^ig$/i',
                    '/\binstagram\b/i',
                ],
            ],
            [
                'key' => 'youtube',
                'label' => 'YouTube',
                'group' => 'Video',
                'patterns' => [
                    '/(^|\.)youtube\.com$/i',
                    '/^(m|music|gaming)\.youtube\.com$/i',
                    '/^youtu\.be$/i',
                    '/\byoutube\b/i',
                ],
            ],
            [
                'key' => 'x',
                'label' => 'X/Twitter',
                'group' => 'Social',
                'patterns' => [
                    '/^t\.co$/i',
                    '/(^|\.)twitter\.com$/i',
                    '/(^|\.)x\.com$/i',
                    '/\btwitter\b/i',
                ],
            ],
            [
                'key' => 'gemini',
                'label' => 'Gemini',
                'group' => 'AI',
                'patterns' => [
                    '/^gemini\.google\.[a-z.]{2,}$/i',
                ],
            ],
            [
                'key' => 'gmail',
                'label' => 'Gmail',
                'group' => 'Email',
                'patterns' => [
                    '/^mail\.google\.com$/i',
                    '/(^|\.)gmail\.com$/i',
                ],
            ],
            [
                'key' => 'google_news',
                'label' => 'Google News',
                'group' => 'Search',
                'patterns' => [
                    '/^news\.google\.[a-z.]{2,}$/i',
                ],
            ],
            [
                'key' => 'google',
                'label' => 'Google',
                'group' => 'Search',
                'patterns' => [
                    '/^google$/i',
                    '/(^|\.)google\.[a-z.]{2,}$/i',
                    '/^trends\.google\.com(\.[a-z.]{2,})?$/i',
                    '/^g\.co$/i',
                ],
            ],
            [
                'key' => 'bing',
                'label' => 'Bing',
                'group' => 'Search',
                'patterns' => [
                    '/^bing$/i',
                    '/(^|\.)bing\.com$/i',
                    '/^[a-z0-9-]+\.bing\.com$/i',
                ],
            ],
            [
                'key' => 'msn',
                'label' => 'MSN / Microsoft Start',
                'group' => 'Search',
                'patterns' => [
                    '/(^|\.)msn\.com$/i',
                    '/^ntp\.msn\.com$/i',
                ],
            ],
            [
                'key' => 'yahoo',
                'label' => 'Yahoo',
                'group' => 'Search',
                'patterns' => [
                    '/^yahoo$/i',
                    '/(^|\.)yahoo\.com$/i',
                    '/(^|\.)search\.yahoo\.com$/i',
                    '/^br\.search\.yahoo\.com$/i',
                ],
            ],
            [
                'key' => 'duckduckgo',
                'label' => 'DuckDuckGo',
                'group' => 'Search',
                'patterns' => [
                    '/^duckduckgo$/i',
                    '/(^|\.)duckduckgo\.com$/i',
                ],
            ],
            [
                'key' => 'ecosia',
                'label' => 'Ecosia',
                'group' => 'Search',
                'patterns' => [
                    '/(^|\.)ecosia\.org$/i',
                ],
            ],
            [
                'key' => 'kwai',
                'label' => 'Kwai',
                'group' => 'Social',
                'patterns' => [
                    '/(^|\.)kwai\.com$/i',
                    '/\bkwai\b/i',
                ],
            ],
            [
                'key' => 'chatgpt',
                'label' => 'ChatGPT',
                'group' => 'AI',
                'patterns' => [
                    '/^chatgpt\.com$/i',
                ],
            ],
            [
                'key' => 'other',
                'label' => 'Outras Origens',
                'group' => 'Referral',
                'patterns' => [
                    '/.*/',
                ],
            ],
        ];
    }
}
