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

            return new HttpFetchResult(
                success: $response->successful(),
                statusCode: $response->status(),
                body: $response->body(),
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
