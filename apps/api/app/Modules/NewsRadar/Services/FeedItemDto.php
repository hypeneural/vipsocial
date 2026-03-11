<?php

namespace App\Modules\NewsRadar\Services;

class FeedItemDto
{
    public function __construct(
        public readonly string $title,
        public readonly string $rawUrl,
        public readonly string $normalizedUrl,
        public readonly string $urlHash,
        public readonly ?string $guid,
        public readonly ?string $authorRaw,
        public readonly ?string $publishedAtRaw,
        public readonly ?string $bodyHtml,
        public readonly ?string $excerpt,
        public readonly array $categoriesRaw,
        public readonly ?string $heroImageUrl,
        public readonly array $rawPayload,
    ) {}
}
