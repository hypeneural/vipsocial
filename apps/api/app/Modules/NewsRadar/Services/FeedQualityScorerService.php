<?php

namespace App\Modules\NewsRadar\Services;

use App\Modules\NewsRadar\Enums\FeedQualityProfile;

class FeedQualityScorerService
{
    /**
     * Score a set of parsed feed items for completeness.
     *
     * @param FeedItemDto[] $items (3–5 items is ideal)
     * @return FeedQualityScore
     */
    public function score(array $items): FeedQualityScore
    {
        if (empty($items)) {
            return new FeedQualityScore(
                score: 0,
                profile: FeedQualityProfile::TeaserOnly,
                flags: [],
                fieldCoverage: [],
            );
        }

        $sample = array_slice($items, 0, 5);
        $count = count($sample);

        $fields = [
            'title' => 0,
            'link' => 0,
            'date' => 0,
            'body_rich' => 0,
            'image' => 0,
            'author' => 0,
            'categories' => 0,
            'excerpt' => 0,
        ];

        foreach ($sample as $item) {
            if (!empty($item->title)) $fields['title']++;
            if (!empty($item->rawUrl)) $fields['link']++;
            if (!empty($item->publishedAtRaw)) $fields['date']++;
            if (!empty($item->bodyHtml) && mb_strlen($item->bodyHtml) > 600) $fields['body_rich']++;
            if (!empty($item->heroImageUrl)) $fields['image']++;
            if (!empty($item->authorRaw)) $fields['author']++;
            if (!empty($item->categoriesRaw)) $fields['categories']++;
            if (!empty($item->excerpt)) $fields['excerpt']++;
        }

        // Calculate percentages
        $coverage = array_map(fn ($v) => round($v / $count * 100), $fields);

        // Calculate weighted score
        $score = 0;
        $score += ($coverage['title'] > 0) ? 20 : 0;
        $score += ($coverage['link'] > 0) ? 20 : 0;
        $score += ($coverage['date'] > 50) ? 15 : 0;
        $score += ($coverage['body_rich'] > 50) ? 20 : 0;
        $score += ($coverage['image'] > 30) ? 10 : 0;
        $score += ($coverage['author'] > 30) ? 5 : 0;
        $score += ($coverage['categories'] > 30) ? 5 : 0;
        $score += ($coverage['excerpt'] > 30) ? 5 : 0;

        // Determine profile
        $profile = match (true) {
            $score >= 80 => FeedQualityProfile::Full,
            $score >= 50 => FeedQualityProfile::Partial,
            default => FeedQualityProfile::TeaserOnly,
        };

        // Detect flags
        $flags = [];
        if ($coverage['body_rich'] > 70) $flags[] = 'has_full_content';
        if ($coverage['image'] > 50) $flags[] = 'has_inline_images';
        if ($coverage['categories'] > 50) $flags[] = 'has_categories';
        if ($coverage['author'] > 50) $flags[] = 'has_authors';

        // WordPress detection
        $hasWpSignals = false;
        foreach ($sample as $item) {
            if ($item->bodyHtml && (
                str_contains($item->bodyHtml, 'wp-content') ||
                str_contains($item->bodyHtml, 'apareceu primeiro em')
            )) {
                $hasWpSignals = true;
                break;
            }
        }
        if ($hasWpSignals) {
            $flags[] = 'wordpress_like';
            $flags[] = 'has_boilerplate';
        }

        return new FeedQualityScore(
            score: $score,
            profile: $profile,
            flags: $flags,
            fieldCoverage: $coverage,
        );
    }

    /**
     * Suggest fetch_detail_mode based on quality profile.
     */
    public function suggestFetchDetailMode(FeedQualityProfile $profile): string
    {
        return match ($profile) {
            FeedQualityProfile::Full => 'never',
            FeedQualityProfile::Partial => 'when_incomplete',
            FeedQualityProfile::TeaserOnly => 'always',
        };
    }
}

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
