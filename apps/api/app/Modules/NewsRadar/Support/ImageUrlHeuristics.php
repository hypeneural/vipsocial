<?php

namespace App\Modules\NewsRadar\Support;

class ImageUrlHeuristics
{
    private const TRACKING_HOSTS = [
        'api.dino.com.br',
    ];

    public static function sanitize(
        ?string $url,
        ?int $width = null,
        ?int $height = null,
        ?string $style = null,
    ): ?string {
        $normalized = self::normalize($url);

        return self::isUsable($normalized, $width, $height, $style) ? $normalized : null;
    }

    public static function isUsable(
        ?string $url,
        ?int $width = null,
        ?int $height = null,
        ?string $style = null,
    ): bool {
        $normalized = self::normalize($url);
        if ($normalized === null) {
            return false;
        }

        if (preg_match('#^(?:data|javascript):#i', $normalized)) {
            return false;
        }

        $host = mb_strtolower((string) parse_url($normalized, PHP_URL_HOST));
        $path = mb_strtolower((string) parse_url($normalized, PHP_URL_PATH));
        if (in_array($host, self::TRACKING_HOSTS, true) && str_contains($path, '/v2/news/tr/')) {
            return false;
        }

        if ($width !== null && $width > 0 && $width <= 1) {
            return false;
        }

        if ($height !== null && $height > 0 && $height <= 1) {
            return false;
        }

        $styleValue = mb_strtolower(trim((string) $style));
        if ($styleValue !== '' && preg_match('/(?:width|max-width|height|max-height)\s*:\s*1px\b/u', $styleValue)) {
            return false;
        }

        if (preg_match('#(?:pixel|tracking|spacer)\.(?:gif|png|jpe?g|webp)$#i', $path)) {
            return false;
        }

        return true;
    }

    private static function normalize(?string $url): ?string
    {
        if (! is_string($url)) {
            return null;
        }

        $normalized = trim(html_entity_decode($url, ENT_QUOTES | ENT_HTML5, 'UTF-8'));

        return $normalized !== '' ? $normalized : null;
    }
}
