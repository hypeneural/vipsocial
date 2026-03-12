<?php

namespace App\Modules\NewsRadar\Services;

use GuzzleHttp\Cookie\CookieJar;
use Illuminate\Support\Facades\Http;
use Symfony\Component\Process\Process;

class HttpFetchService
{
    private int $defaultTimeout = 30;
    private string $defaultUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36';
    private int $maxChallengeRetries = 2;

    /**
     * Fetch a URL and return the HTML body.
     */
    public function fetch(string $url, array $options = []): HttpFetchResult
    {
        $timeout = $options['timeout'] ?? $this->defaultTimeout;
        $userAgent = $options['user_agent'] ?? $this->defaultUserAgent;
        $headers = $this->buildHeaders($userAgent, $options['headers'] ?? []);
        $cookieJar = new CookieJar();
        $startTime = microtime(true);

        try {
            $result = $this->sendRequest($url, $headers, $timeout, $cookieJar);
            if ($this->shouldRetryTransportError($result)) {
                $headers = $this->buildTransportRetryHeaders($headers);
                $result = $this->sendRequest($url, $headers, $timeout, $cookieJar);
            }

            if ($this->shouldRetryTransportError($result)) {
                $curlFallback = $this->fetchViaCurlBinary($url, $headers, $timeout);
                if ($curlFallback !== null) {
                    $result = $curlFallback;
                }
            }

            $retries = 0;
            while ($retries < $this->maxChallengeRetries && $this->shouldRetryChallenge($result, $cookieJar)) {
                $retries++;
                $retryUrl = $this->resolveChallengeUrl($url, $result->body) ?? $url;
                $headers = $this->buildChallengeHeaders($headers, $url, $retryUrl);
                $result = $this->sendRequest($retryUrl, $headers, $timeout, $cookieJar);
            }

            return new HttpFetchResult(
                success: $result->success,
                statusCode: $result->statusCode,
                body: $result->body,
                headers: $result->headers,
                responseTimeMs: (int) ((microtime(true) - $startTime) * 1000),
                error: $result->error,
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

    private function buildHeaders(string $userAgent, array $customHeaders = []): array
    {
        return array_merge([
            'User-Agent' => $userAgent,
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language' => 'pt-BR,pt;q=0.9,en;q=0.8',
        ], $customHeaders);
    }

    private function buildChallengeHeaders(array $headers, string $originalUrl, string $retryUrl): array
    {
        $headers['Referer'] = $originalUrl;
        $headers['Upgrade-Insecure-Requests'] = '1';
        $headers['Sec-Fetch-Site'] = $this->sameOrigin($originalUrl, $retryUrl) ? 'same-origin' : 'cross-site';
        $headers['Sec-Fetch-Mode'] = 'navigate';
        $headers['Sec-Fetch-Dest'] = 'document';
        $headers['Sec-Fetch-User'] = '?1';
        $headers['Cache-Control'] = 'max-age=0';
        $headers['Pragma'] = 'no-cache';

        return $headers;
    }

    private function buildTransportRetryHeaders(array $headers): array
    {
        $headers['Connection'] = 'close';

        return $headers;
    }

    private function sendRequest(string $url, array $headers, int $timeout, CookieJar $cookieJar): HttpFetchResult
    {
        $startTime = microtime(true);
        try {
            $response = Http::withHeaders($headers)
                ->withOptions([
                    'cookies' => $cookieJar,
                    'allow_redirects' => true,
                    'curl' => [
                        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                        CURLOPT_ENCODING => '',
                    ],
                ])
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

    private function shouldRetryChallenge(HttpFetchResult $result, CookieJar $cookieJar): bool
    {
        if (!$this->looksLikeJavascriptChallenge($result->body)) {
            return false;
        }

        if ($this->hasSetCookieHeader($result->headers)) {
            return true;
        }

        return count($cookieJar->toArray()) > 0;
    }

    private function shouldRetryTransportError(HttpFetchResult $result): bool
    {
        if ($result->statusCode !== 0 || empty($result->error)) {
            return false;
        }

        $error = mb_strtolower($result->error, 'UTF-8');

        return str_contains($error, 'empty reply from server')
            || str_contains($error, 'server closed abruptly')
            || str_contains($error, 'connection reset');
    }

    private function fetchViaCurlBinary(string $url, array $headers, int $timeout): ?HttpFetchResult
    {
        $headersFile = tempnam(sys_get_temp_dir(), 'vip-news-headers-');
        $bodyFile = tempnam(sys_get_temp_dir(), 'vip-news-body-');
        $cookiesFile = tempnam(sys_get_temp_dir(), 'vip-news-cookies-');

        if ($headersFile === false || $bodyFile === false || $cookiesFile === false) {
            return null;
        }

        try {
            $result = $this->runCurlProcess(
                url: $url,
                headers: $headers,
                timeout: $timeout,
                headersFile: $headersFile,
                bodyFile: $bodyFile,
                cookiesFile: $cookiesFile,
                includeCookies: false,
            );

            $retries = 0;
            while ($retries < $this->maxChallengeRetries && $this->shouldRetryCurlChallenge($result, $cookiesFile)) {
                $retries++;
                $retryUrl = $this->resolveChallengeUrl($url, $result->body) ?? $url;
                $headers = $this->buildChallengeHeaders($headers, $url, $retryUrl);
                $result = $this->runCurlProcess(
                    url: $retryUrl,
                    headers: $headers,
                    timeout: $timeout,
                    headersFile: $headersFile,
                    bodyFile: $bodyFile,
                    cookiesFile: $cookiesFile,
                    includeCookies: true,
                );
            }

            return $result;
        } catch (\Throwable) {
            return null;
        } finally {
            foreach ([$headersFile, $bodyFile, $cookiesFile] as $tempFile) {
                if (is_string($tempFile) && is_file($tempFile)) {
                    @unlink($tempFile);
                }
            }
        }
    }

    private function runCurlProcess(
        string $url,
        array $headers,
        int $timeout,
        string $headersFile,
        string $bodyFile,
        string $cookiesFile,
        bool $includeCookies,
    ): HttpFetchResult {
        @unlink($headersFile);
        @unlink($bodyFile);

        $command = [
            'curl',
            '-sS',
            '-L',
            '--max-time',
            (string) $timeout,
            '--connect-timeout',
            '10',
            '-D',
            $headersFile,
            '-c',
            $cookiesFile,
            '-o',
            $bodyFile,
        ];

        if ($includeCookies) {
            $command[] = '-b';
            $command[] = $cookiesFile;
        }

        foreach ($headers as $name => $value) {
            if (mb_strtolower((string) $name, 'UTF-8') === 'user-agent') {
                $command[] = '-A';
                $command[] = (string) $value;
                continue;
            }

            $command[] = '-H';
            $command[] = sprintf('%s: %s', $name, $value);
        }

        $command[] = $url;

        $startTime = microtime(true);
        $process = new Process($command);
        $process->run();
        $responseTimeMs = (int) ((microtime(true) - $startTime) * 1000);

        $rawHeaders = is_file($headersFile) ? (file_get_contents($headersFile) ?: '') : '';
        $headers = $this->parseCurlHeaders($rawHeaders);
        $statusCode = $this->parseCurlStatusCode($rawHeaders);
        $body = is_file($bodyFile) ? (file_get_contents($bodyFile) ?: '') : '';
        $body = $this->normalizeBodyEncoding($body, $headers);

        $stderr = trim($process->getErrorOutput());
        $error = null;
        if (!$process->isSuccessful()) {
            $error = $stderr !== '' ? $stderr : sprintf('curl exit code %d', $process->getExitCode() ?? 1);
        } elseif ($statusCode >= 400) {
            $error = "HTTP {$statusCode}";
        }

        return new HttpFetchResult(
            success: $process->isSuccessful() && $statusCode >= 200 && $statusCode < 400,
            statusCode: $statusCode,
            body: $body,
            headers: $headers,
            responseTimeMs: $responseTimeMs,
            error: $error,
        );
    }

    private function shouldRetryCurlChallenge(HttpFetchResult $result, string $cookiesFile): bool
    {
        if (!$this->looksLikeJavascriptChallenge($result->body)) {
            return false;
        }

        if ($this->hasSetCookieHeader($result->headers)) {
            return true;
        }

        return $this->cookieFileHasEntries($cookiesFile);
    }

    private function parseCurlHeaders(string $rawHeaders): array
    {
        $headerBlock = $this->extractLastHeaderBlock($rawHeaders);
        if ($headerBlock === '') {
            return [];
        }

        $headers = [];
        $lines = preg_split('/\r?\n/', trim($headerBlock)) ?: [];
        array_shift($lines);

        foreach ($lines as $line) {
            $parts = explode(':', $line, 2);
            if (count($parts) !== 2) {
                continue;
            }

            $name = trim($parts[0]);
            $value = trim($parts[1]);
            if ($name === '' || $value === '') {
                continue;
            }

            $lowerName = mb_strtolower($name, 'UTF-8');
            $headers[$lowerName] ??= [];
            $headers[$lowerName][] = $value;
        }

        return $headers;
    }

    private function parseCurlStatusCode(string $rawHeaders): int
    {
        $headerBlock = $this->extractLastHeaderBlock($rawHeaders);
        if ($headerBlock === '') {
            return 0;
        }

        if (preg_match('/^HTTP\/\S+\s+(\d{3})/m', $headerBlock, $matches) === 1) {
            return (int) $matches[1];
        }

        return 0;
    }

    private function extractLastHeaderBlock(string $rawHeaders): string
    {
        $trimmed = trim($rawHeaders);
        if ($trimmed === '') {
            return '';
        }

        $blocks = preg_split('/\r?\n\r?\n(?=HTTP\/)/', $trimmed);
        if ($blocks === false || $blocks === []) {
            return $trimmed;
        }

        return (string) end($blocks);
    }

    private function cookieFileHasEntries(string $cookiesFile): bool
    {
        if (!is_file($cookiesFile)) {
            return false;
        }

        $lines = file($cookiesFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return false;
        }

        foreach ($lines as $line) {
            if ($line !== '' && !str_starts_with($line, '#')) {
                return true;
            }
        }

        return false;
    }

    private function looksLikeJavascriptChallenge(string $body): bool
    {
        $trimmed = trim($body);
        if ($trimmed === '' || strlen($trimmed) > 4096) {
            return false;
        }

        return preg_match('/window\.location(?:\.href)?\s*=\s*[\'"][^\'"]+[\'"]/i', $trimmed) === 1
            || preg_match('/window\.location\.replace\(\s*[\'"][^\'"]+[\'"]\s*\)/i', $trimmed) === 1;
    }

    private function hasSetCookieHeader(array $headers): bool
    {
        return $this->headerValues($headers, 'set-cookie') !== [];
    }

    private function resolveChallengeUrl(string $currentUrl, string $body): ?string
    {
        if (
            preg_match('/window\.location(?:\.href)?\s*=\s*[\'"]([^\'"]+)[\'"]/i', $body, $matches) !== 1
            && preg_match('/window\.location\.replace\(\s*[\'"]([^\'"]+)[\'"]\s*\)/i', $body, $matches) !== 1
        ) {
            return null;
        }

        $target = trim($matches[1] ?? '');
        if ($target === '') {
            return null;
        }

        if (preg_match('#^https?://#i', $target) === 1) {
            return $target;
        }

        $parts = parse_url($currentUrl);
        if ($parts === false || empty($parts['scheme']) || empty($parts['host'])) {
            return $currentUrl;
        }

        $origin = $parts['scheme'] . '://' . $parts['host'];
        if (!empty($parts['port'])) {
            $origin .= ':' . $parts['port'];
        }

        if (str_starts_with($target, '/')) {
            return $origin . $target;
        }

        $path = $parts['path'] ?? '/';
        $directory = preg_replace('#/[^/]*$#', '/', $path) ?: '/';

        return $origin . $directory . $target;
    }

    private function sameOrigin(string $left, string $right): bool
    {
        $leftParts = parse_url($left);
        $rightParts = parse_url($right);

        if ($leftParts === false || $rightParts === false) {
            return false;
        }

        return ($leftParts['scheme'] ?? null) === ($rightParts['scheme'] ?? null)
            && ($leftParts['host'] ?? null) === ($rightParts['host'] ?? null)
            && ($leftParts['port'] ?? null) === ($rightParts['port'] ?? null);
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
