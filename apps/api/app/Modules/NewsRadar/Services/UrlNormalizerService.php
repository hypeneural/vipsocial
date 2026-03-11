<?php

namespace App\Modules\NewsRadar\Services;

use League\Uri\Uri;
use League\Uri\Components\Query;

class UrlNormalizerService
{
    private const UTM_PARAMS = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
        'fbclid', 'gclid', 'mc_cid', 'mc_eid', 'ref',
    ];

    /**
     * Canonicalize a URL: remove UTMs, normalize trailing slash, force HTTPS.
     */
    public function normalize(string $rawUrl, ?string $relativeBase = null): string
    {
        $rawUrl = trim($rawUrl);

        if ($relativeBase && !preg_match('#^https?://#i', $rawUrl)) {
            $rawUrl = rtrim($relativeBase, '/') . '/' . ltrim($rawUrl, '/');
        }

        try {
            $uri = Uri::new($rawUrl);
        } catch (\Throwable) {
            return $rawUrl;
        }

        // Force HTTPS
        if ($uri->getScheme() === 'http') {
            $uri = $uri->withScheme('https');
        }

        // Remove UTM params
        $query = $uri->getQuery();
        if ($query) {
            $params = Query::fromUri($uri);
            $cleaned = [];
            foreach ($params as $key => $value) {
                if (!in_array(strtolower($key), self::UTM_PARAMS, true)) {
                    $cleaned[$key] = $value;
                }
            }
            $uri = $uri->withQuery(empty($cleaned) ? null : http_build_query($cleaned));
        }

        // Remove fragment
        $uri = $uri->withFragment(null);

        // Normalize trailing slash (remove from non-root paths)
        $path = $uri->getPath();
        if ($path && $path !== '/' && str_ends_with($path, '/')) {
            $uri = $uri->withPath(rtrim($path, '/'));
        }

        return (string) $uri;
    }

    /**
     * Generate SHA-256 hash of the canonical URL for deduplication.
     */
    public function hash(string $normalizedUrl): string
    {
        return hash('sha256', $normalizedUrl);
    }

    /**
     * Normalize + hash in one call.
     */
    public function normalizeAndHash(string $rawUrl, ?string $relativeBase = null): array
    {
        $normalized = $this->normalize($rawUrl, $relativeBase);

        return [
            'normalized_url' => $normalized,
            'url_hash' => $this->hash($normalized),
        ];
    }

    /**
     * Check if a URL matches any of the given patterns.
     */
    public function matchesPatterns(string $url, array $patterns): bool
    {
        foreach ($patterns as $pattern) {
            if (str_contains($url, $pattern)) {
                return true;
            }
            // Support regex patterns (starts with /)
            if (str_starts_with($pattern, '/') && @preg_match('#' . $pattern . '#i', $url)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Filter URLs: include those matching article patterns, exclude those matching ignore patterns.
     */
    public function filterUrls(array $urls, array $articlePatterns = [], array $ignorePatterns = []): array
    {
        return array_filter($urls, function (string $url) use ($articlePatterns, $ignorePatterns) {
            if (!empty($ignorePatterns) && $this->matchesPatterns($url, $ignorePatterns)) {
                return false;
            }

            if (!empty($articlePatterns)) {
                return $this->matchesPatterns($url, $articlePatterns);
            }

            return true;
        });
    }
}
