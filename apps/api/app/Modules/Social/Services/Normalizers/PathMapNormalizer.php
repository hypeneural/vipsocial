<?php

namespace App\Modules\Social\Services\Normalizers;

use App\Modules\Social\Models\SocialProfile;
use Carbon\CarbonImmutable;
use RuntimeException;

class PathMapNormalizer implements SocialMetricNormalizer
{
    public function type(): string
    {
        return 'path_map';
    }

    public function version(): string
    {
        return '1.0.0';
    }

    public function normalize(
        SocialProfile $profile,
        array $items,
        CarbonImmutable $capturedAt,
        string $metricDate
    ): array {
        $config = (array) ($profile->normalizer_config ?? []);
        $itemIndex = max(0, (int) ($config['item_index'] ?? 0));
        $item = $items[$itemIndex] ?? null;

        if (!is_array($item)) {
            throw new RuntimeException('Item do dataset nao encontrado para normalizacao');
        }

        $identityPaths = (array) ($config['identity_paths'] ?? []);
        $metricPaths = (array) ($config['metric_paths'] ?? []);

        $identity = [
            'external_id' => $this->resolveValue($item, $identityPaths['external_id'] ?? null, $profile->external_profile_id)['value'],
            'handle' => $this->resolveValue($item, $identityPaths['handle'] ?? null, $profile->handle)['value'],
            'display_name' => $this->resolveValue($item, $identityPaths['display_name'] ?? null, $profile->display_name)['value'],
            'profile_url' => $this->resolveValue($item, $identityPaths['profile_url'] ?? null, $profile->url)['value'],
            'avatar_url' => $this->resolveValue($item, $identityPaths['avatar_url'] ?? null, $profile->avatar_url)['value'],
        ];

        $metrics = [];
        foreach ($metricPaths as $code => $paths) {
            $resolved = $this->resolveValue($item, $paths);
            if ($resolved['value'] === null) {
                continue;
            }

            $metrics[] = [
                'code' => (string) $code,
                'raw_key' => $resolved['raw_key'],
                ...$this->normalizeMetricValue($resolved['value']),
            ];
        }

        return [
            'profile' => $identity,
            'metric_date' => $metricDate,
            'captured_at' => $capturedAt->toIso8601String(),
            'metrics' => $metrics,
            'raw_item' => $item,
        ];
    }

    private function resolveValue(array $item, mixed $paths, mixed $fallback = null): array
    {
        $candidates = is_array($paths) ? $paths : [$paths];

        foreach ($candidates as $path) {
            if (!is_string($path) || trim($path) === '') {
                continue;
            }

            $value = data_get($item, $path);
            if ($value !== null && $value !== '') {
                return [
                    'value' => $value,
                    'raw_key' => $path,
                ];
            }
        }

        return [
            'value' => $fallback,
            'raw_key' => is_string($paths) ? $paths : null,
        ];
    }

    private function normalizeMetricValue(mixed $value): array
    {
        if (is_string($value)) {
            $candidate = str_replace([' ', ','], ['', ''], trim($value));
            if ($candidate !== '' && is_numeric($candidate)) {
                $value = $candidate;
            }
        }

        if (is_numeric($value)) {
            $number = (float) $value;

            return [
                'value_number' => fmod($number, 1.0) === 0.0 ? (int) $number : $number,
                'value_text' => null,
                'value_json' => null,
            ];
        }

        if (is_array($value)) {
            return [
                'value_number' => null,
                'value_text' => null,
                'value_json' => $value,
            ];
        }

        return [
            'value_number' => null,
            'value_text' => is_scalar($value) ? (string) $value : null,
            'value_json' => null,
        ];
    }
}
