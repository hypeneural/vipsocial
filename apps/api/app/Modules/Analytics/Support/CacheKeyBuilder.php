<?php

namespace App\Modules\Analytics\Support;

final class CacheKeyBuilder
{
    public static function build(string $propertyId, string $endpoint, array $payload): string
    {
        $normalized = self::normalize($payload);
        $hash = hash('sha256', json_encode($normalized, JSON_UNESCAPED_SLASHES));

        return "analytics:{$propertyId}:{$endpoint}:{$hash}";
    }

    private static function normalize(array $payload): array
    {
        ksort($payload);

        foreach ($payload as $key => $value) {
            if (is_array($value)) {
                $payload[$key] = self::normalize($value);
            }
        }

        return $payload;
    }
}

