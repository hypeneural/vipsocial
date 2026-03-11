<?php

namespace App\Modules\NewsRadar\Services;

class FeedParseResult
{
    public function __construct(
        public readonly bool $success,
        public readonly array $items,
        public readonly ?string $feedTitle,
        public readonly string $feedUrl,
        public readonly ?string $error,
    ) {}

    public function count(): int
    {
        return count($this->items);
    }
}
