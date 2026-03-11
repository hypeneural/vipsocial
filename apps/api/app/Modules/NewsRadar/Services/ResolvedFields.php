<?php

namespace App\Modules\NewsRadar\Services;

class ResolvedFields
{
    public function __construct(
        public readonly ?string $title,
        public readonly ?string $subtitle,
        public readonly ?string $authorRaw,
        public readonly ?string $bodyHtml,
        public readonly ?string $bodyText,
        public readonly ?string $excerpt,
        public readonly ?string $heroImageUrl,
        public readonly ?string $publishedAtRaw,
        public readonly ?string $publishedAtParsed,
        public readonly ?string $publishedAtUtc,
        public readonly ?string $publishedAtTimezone,
        public readonly ?string $publishedAtSource,
        public readonly array $categoriesRaw,
        public readonly int $extractionCompleteness,
        public readonly array $fieldAudit,
    ) {}
}
