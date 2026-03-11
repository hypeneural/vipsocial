<?php

namespace Tests\Unit\NewsRadar;

use App\Modules\NewsRadar\Enums\FeedQualityProfile;
use App\Modules\NewsRadar\Services\FeedItemDto;
use App\Modules\NewsRadar\Services\FeedQualityScorerService;
use Tests\TestCase;

class FeedQualityScorerServiceTest extends TestCase
{
    public function test_score_detects_full_profile_and_flags(): void
    {
        $service = new FeedQualityScorerService();

        $items = [
            $this->makeFeedItem(),
            $this->makeFeedItem([
                'title' => 'Materia 2',
                'rawUrl' => 'https://portal.test/materia-2',
                'normalizedUrl' => 'https://portal.test/materia-2',
            ]),
            $this->makeFeedItem([
                'title' => 'Materia 3',
                'rawUrl' => 'https://portal.test/materia-3',
                'normalizedUrl' => 'https://portal.test/materia-3',
            ]),
        ];

        $score = $service->score($items);

        $this->assertSame(100, $score->score);
        $this->assertSame(FeedQualityProfile::Full, $score->profile);
        $this->assertContains('has_full_content', $score->flags);
        $this->assertContains('has_inline_images', $score->flags);
        $this->assertContains('has_categories', $score->flags);
        $this->assertContains('has_authors', $score->flags);
        $this->assertSame('never', $service->suggestFetchDetailMode($score->profile, $score->flags, $score->fieldCoverage));
    }

    public function test_score_detects_partial_profile(): void
    {
        $service = new FeedQualityScorerService();

        $items = [
            $this->makeFeedItem([
                'bodyHtml' => '<p>Curto</p>',
                'heroImageUrl' => null,
                'authorRaw' => null,
                'categoriesRaw' => [],
            ]),
            $this->makeFeedItem([
                'title' => 'Parcial 2',
                'rawUrl' => 'https://portal.test/parcial-2',
                'normalizedUrl' => 'https://portal.test/parcial-2',
                'bodyHtml' => '<p>Curto</p>',
                'heroImageUrl' => null,
                'authorRaw' => null,
                'categoriesRaw' => [],
            ]),
        ];

        $score = $service->score($items);

        $this->assertSame(60, $score->score);
        $this->assertSame(FeedQualityProfile::Partial, $score->profile);
        $this->assertSame('when_incomplete', $service->suggestFetchDetailMode($score->profile, $score->flags, $score->fieldCoverage));
    }

    public function test_score_detects_teaser_only_profile(): void
    {
        $service = new FeedQualityScorerService();

        $items = [
            $this->makeFeedItem([
                'bodyHtml' => null,
                'excerpt' => null,
                'heroImageUrl' => null,
                'authorRaw' => null,
                'categoriesRaw' => [],
                'publishedAtRaw' => null,
            ]),
        ];

        $score = $service->score($items);

        $this->assertSame(40, $score->score);
        $this->assertSame(FeedQualityProfile::TeaserOnly, $score->profile);
        $this->assertSame('always', $service->suggestFetchDetailMode($score->profile, $score->flags, $score->fieldCoverage));
    }

    public function test_full_profile_with_boilerplate_or_missing_images_stays_when_incomplete(): void
    {
        $service = new FeedQualityScorerService();

        $items = [
            $this->makeFeedItem([
                'bodyHtml' => '<p>' . str_repeat('conteudo ', 120) . '</p><p>O post teste apareceu primeiro em Portal.</p>',
                'heroImageUrl' => null,
            ]),
            $this->makeFeedItem([
                'title' => 'Materia 2',
                'rawUrl' => 'https://portal.test/materia-2',
                'normalizedUrl' => 'https://portal.test/materia-2',
                'bodyHtml' => '<p>' . str_repeat('conteudo ', 120) . '</p>',
                'heroImageUrl' => null,
            ]),
        ];

        $score = $service->score($items);

        $this->assertSame(FeedQualityProfile::Full, $score->profile);
        $this->assertContains('has_boilerplate', $score->flags);
        $this->assertSame('when_incomplete', $service->suggestFetchDetailMode($score->profile, $score->flags, $score->fieldCoverage));
    }

    public function test_html_heavy_but_text_short_feed_does_not_score_as_full_content(): void
    {
        $service = new FeedQualityScorerService();

        $htmlHeavySummary = '<div>' . str_repeat('<span>curto</span>', 80) . '</div>';

        $items = [
            $this->makeFeedItem([
                'bodyHtml' => $htmlHeavySummary,
                'heroImageUrl' => 'https://portal.test/hero.jpg',
            ]),
            $this->makeFeedItem([
                'title' => 'Materia 2',
                'rawUrl' => 'https://portal.test/materia-2',
                'normalizedUrl' => 'https://portal.test/materia-2',
                'bodyHtml' => $htmlHeavySummary,
                'heroImageUrl' => 'https://portal.test/hero-2.jpg',
            ]),
        ];

        $score = $service->score($items);

        $this->assertSame(80, $score->score);
        $this->assertSame(FeedQualityProfile::Full, $score->profile);
        $this->assertSame(0.0, $score->fieldCoverage['body_rich']);
        $this->assertNotContains('has_full_content', $score->flags);
        $this->assertSame('when_incomplete', $service->suggestFetchDetailMode($score->profile, $score->flags, $score->fieldCoverage));
    }

    private function makeFeedItem(array $overrides = []): FeedItemDto
    {
        $url = $overrides['rawUrl'] ?? $overrides['normalizedUrl'] ?? 'https://portal.test/materia-1';

        return new FeedItemDto(
            title: $overrides['title'] ?? 'Materia 1',
            rawUrl: $url,
            normalizedUrl: $overrides['normalizedUrl'] ?? $url,
            urlHash: hash('sha256', $url),
            guid: $overrides['guid'] ?? 'guid-1',
            authorRaw: array_key_exists('authorRaw', $overrides) ? $overrides['authorRaw'] : 'Equipe VIP',
            publishedAtRaw: array_key_exists('publishedAtRaw', $overrides) ? $overrides['publishedAtRaw'] : '2026-03-11T10:00:00Z',
            bodyHtml: array_key_exists('bodyHtml', $overrides) ? $overrides['bodyHtml'] : ('<p>' . str_repeat('conteudo ', 100) . '</p>'),
            excerpt: array_key_exists('excerpt', $overrides) ? $overrides['excerpt'] : 'Resumo para scoring parcial ou full.',
            categoriesRaw: array_key_exists('categoriesRaw', $overrides) ? $overrides['categoriesRaw'] : ['Radar'],
            heroImageUrl: array_key_exists('heroImageUrl', $overrides) ? $overrides['heroImageUrl'] : 'https://portal.test/hero.jpg',
            rawPayload: $overrides['rawPayload'] ?? ['title' => $overrides['title'] ?? 'Materia 1'],
        );
    }
}
