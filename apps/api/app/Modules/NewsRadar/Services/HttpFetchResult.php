<?php

namespace App\Modules\NewsRadar\Services;

class HttpFetchResult
{
    public function __construct(
        public readonly bool $success,
        public readonly int $statusCode,
        public readonly string $body,
        public readonly array $headers,
        public readonly int $responseTimeMs,
        public readonly ?string $error = null,
    ) {}

    public function isHtml(): bool
    {
        $contentType = $this->headers['content-type'][0] ?? '';
        return str_contains($contentType, 'text/html');
    }

    public function isXml(): bool
    {
        $contentType = $this->headers['content-type'][0] ?? '';
        return str_contains($contentType, 'xml');
    }
}
