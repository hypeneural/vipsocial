<?php

namespace App\Modules\NewsRadar\Services;

class ListingItem
{
    public function __construct(
        public readonly string $rawUrl,
        public readonly string $normalizedUrl,
        public readonly string $urlHash,
        public readonly ?string $title,
        public readonly ?string $imageUrl,
        public readonly ?string $excerpt,
    ) {}
}
