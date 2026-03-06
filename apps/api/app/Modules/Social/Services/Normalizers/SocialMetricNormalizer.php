<?php

namespace App\Modules\Social\Services\Normalizers;

use App\Modules\Social\Models\SocialProfile;
use Carbon\CarbonImmutable;

interface SocialMetricNormalizer
{
    public function type(): string;

    public function version(): string;

    public function normalize(
        SocialProfile $profile,
        array $items,
        CarbonImmutable $capturedAt,
        string $metricDate
    ): array;
}
