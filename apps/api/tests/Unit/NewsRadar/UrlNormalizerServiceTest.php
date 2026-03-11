<?php

namespace Tests\Unit\NewsRadar;

use App\Modules\NewsRadar\Services\UrlNormalizerService;
use Tests\TestCase;

class UrlNormalizerServiceTest extends TestCase
{
    public function test_normalize_removes_tracking_params_forces_https_and_strips_fragment(): void
    {
        $service = new UrlNormalizerService();

        $normalized = $service->normalize(
            'http://example.com/noticia/?utm_source=google&foo=1&ref=facebook#top'
        );

        $this->assertSame('https://example.com/noticia?foo=1', $normalized);
    }

    public function test_normalize_resolves_relative_urls_against_relative_base(): void
    {
        $service = new UrlNormalizerService();

        $normalized = $service->normalize('radar/cidade/', 'http://portal.test');

        $this->assertSame('https://portal.test/radar/cidade', $normalized);
    }

    public function test_normalize_decodes_html_entities_before_cleaning_query_params(): void
    {
        $service = new UrlNormalizerService();

        $normalized = $service->normalize(
            'https://portal.test/materia/?utm_source=rss&amp;utm_medium=rss&amp;foo=1'
        );

        $this->assertSame('https://portal.test/materia?foo=1', $normalized);
    }

    public function test_filter_urls_applies_article_and_ignore_patterns(): void
    {
        $service = new UrlNormalizerService();

        $urls = [
            'https://portal.test/noticias/materia-1',
            'https://portal.test/tag/politica',
            'https://portal.test/noticias/materia-2?utm_source=x',
        ];

        $filtered = $service->filterUrls(
            $urls,
            articlePatterns: ['/noticias/'],
            ignorePatterns: ['/tag/']
        );

        $this->assertCount(2, $filtered);
        $this->assertContains('https://portal.test/noticias/materia-1', $filtered);
        $this->assertContains('https://portal.test/noticias/materia-2?utm_source=x', $filtered);
    }
}
