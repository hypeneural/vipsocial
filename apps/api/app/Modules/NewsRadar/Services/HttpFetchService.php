<?php

namespace App\Modules\NewsRadar\Services;

use Illuminate\Support\Facades\Http;

class HttpFetchService
{
    private int $defaultTimeout = 30;
    private string $defaultUserAgent = 'VIPSocial-NewsRadar/1.0 (+https://vipsocial.com.br)';

    /**
     * Fetch a URL and return the HTML body.
     */
    public function fetch(string $url, array $options = []): HttpFetchResult
    {
        $timeout = $options['timeout'] ?? $this->defaultTimeout;
        $userAgent = $options['user_agent'] ?? $this->defaultUserAgent;
        $headers = array_merge([
            'User-Agent' => $userAgent,
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language' => 'pt-BR,pt;q=0.9,en;q=0.8',
        ], $options['headers'] ?? []);

        $startTime = microtime(true);

        try {
            $response = Http::withHeaders($headers)
                ->timeout($timeout)
                ->connectTimeout(10)
                ->get($url);

            $responseTimeMs = (int) ((microtime(true) - $startTime) * 1000);
            $body = $this->normalizeBodyEncoding($response->body(), $response->headers());

            return new HttpFetchResult(
                success: $response->successful(),
                statusCode: $response->status(),
                body: $body,
                headers: $response->headers(),
                responseTimeMs: $responseTimeMs,
                error: $response->successful() ? null : "HTTP {$response->status()}",
            );
        } catch (\Throwable $e) {
            $responseTimeMs = (int) ((microtime(true) - $startTime) * 1000);

            return new HttpFetchResult(
                success: false,
                statusCode: 0,
                body: '',
                headers: [],
                responseTimeMs: $responseTimeMs,
                error: $e->getMessage(),
            );
        }
    }

    private function normalizeBodyEncoding(string $body, array $headers): string
    {
        if ($body === '') {
            return $body;
        }

        $charset = $this->detectCharset($headers, $body);
        if ($charset === null) {
            if (mb_check_encoding($body, 'UTF-8')) {
                return $body;
            }

            return $body;
        }

        $normalizedCharset = strtoupper(trim($charset, "\"' \t\n\r\0\x0B"));
        if (in_array($normalizedCharset, ['UTF-8', 'UTF8', 'US-ASCII', 'ASCII'], true)) {
            return $body;
        }

        $converted = @iconv($normalizedCharset, 'UTF-8//IGNORE', $body);
        if ($converted === false || $converted === '') {
            $converted = @mb_convert_encoding($body, 'UTF-8', $normalizedCharset);
        }

        return is_string($converted) && $converted !== '' ? $converted : $body;
    }

    private function detectCharset(array $headers, string $body): ?string
    {
        foreach ($this->headerValues($headers, 'content-type') as $headerValue) {
            if (preg_match('/charset\s*=\s*([^\s;]+)/i', $headerValue, $matches)) {
                return $matches[1];
            }
        }

        if (preg_match('/<meta[^>]+charset=["\']?\s*([a-z0-9\-_]+)\s*["\']?/i', $body, $matches)) {
            return $matches[1];
        }

        if (preg_match('/<meta[^>]+content=["\'][^"\']*charset=([a-z0-9\-_]+)[^"\']*["\']/i', $body, $matches)) {
            return $matches[1];
        }

        return null;
    }

    private function headerValues(array $headers, string $headerName): array
    {
        foreach ($headers as $key => $values) {
            if (mb_strtolower((string) $key, 'UTF-8') !== mb_strtolower($headerName, 'UTF-8')) {
                continue;
            }

            if (is_string($values)) {
                return [$values];
            }

            return is_array($values) ? $values : [];
        }

        return [];
    }

    /**
     * Fetch XML content (for feeds and sitemaps).
     */
    public function fetchXml(string $url, array $options = []): HttpFetchResult
    {
        $options['headers'] = array_merge(
            $options['headers'] ?? [],
            ['Accept' => 'application/rss+xml,application/xml,text/xml;q=0.9']
        );

        return $this->fetch($url, $options);
    }
}
