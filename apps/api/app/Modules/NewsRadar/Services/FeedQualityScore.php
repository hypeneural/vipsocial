<?php

namespace App\Modules\NewsRadar\Services;

use App\Modules\NewsRadar\Enums\FeedQualityProfile;

class FeedQualityScore
{
    public function __construct(
        public readonly int $score,
        public readonly FeedQualityProfile $profile,
        public readonly array $flags,
        public readonly array $fieldCoverage,
    ) {}

    public function toArray(): array
    {
        return [
            'score' => $this->score,
            'profile' => $this->profile->value,
            'flags' => $this->flags,
            'field_coverage' => $this->fieldCoverage,
        ];
    }
}
