<?php

namespace Tests\Unit\NewsRadar;

use App\Modules\NewsRadar\Services\HttpFetchResult;
use App\Modules\NewsRadar\Services\HttpFetchService;
use App\Modules\NewsRadar\Services\SitemapParserService;
use App\Modules\NewsRadar\Services\UrlNormalizerService;
use Mockery;
use Tests\TestCase;

class SitemapParserServiceTest extends TestCase
{
    public function test_parse_xml_extracts_news_sitemap_fields_and_sorts_by_publication_date(): void
    {
        $service = new SitemapParserService(
            Mockery::mock(HttpFetchService::class),
            new UrlNormalizerService(),
        );

        $xml = <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
    <url>
        <loc>https://portal.test/noticias/mais-recente?utm_source=rss</loc>
        <news:news>
            <news:title>Mais recente</news:title>
            <news:publication_date>2026-03-11T11:00:00Z</news:publication_date>
            <news:keywords>Radar, Cidade</news:keywords>
        </news:news>
    </url>
    <url>
        <loc>https://portal.test/noticias/mais-antiga</loc>
        <news:news>
            <news:title>Mais antiga</news:title>
            <news:publication_date>2026-03-10T11:00:00Z</news:publication_date>
        </news:news>
    </url>
</urlset>
XML;

        $items = $service->parseXml($xml, articlePatterns: ['/noticias/']);

        $this->assertCount(2, $items);
        $this->assertSame('Mais recente', $items[0]->title);
        $this->assertSame('2026-03-11T11:00:00Z', $items[0]->publicationDate);
        $this->assertSame('Radar, Cidade', $items[0]->keywords);
        $this->assertSame('https://portal.test/noticias/mais-recente', $items[0]->normalizedUrl);
        $this->assertSame('Mais antiga', $items[1]->title);
    }

    public function test_parse_recurses_sitemap_index_and_applies_ignore_patterns(): void
    {
        $httpFetch = Mockery::mock(HttpFetchService::class);
        $httpFetch->shouldReceive('fetchXml')
            ->once()
            ->with('https://portal.test/sitemap.xml')
            ->andReturn(new HttpFetchResult(
                success: true,
                statusCode: 200,
                body: <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>https://portal.test/sitemap-noticias.xml</loc>
    </sitemap>
</sitemapindex>
XML,
                headers: ['content-type' => ['application/xml']],
                responseTimeMs: 40,
            ));
        $httpFetch->shouldReceive('fetchXml')
            ->once()
            ->with('https://portal.test/sitemap-noticias.xml')
            ->andReturn(new HttpFetchResult(
                success: true,
                statusCode: 200,
                body: <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://portal.test/noticias/valida</loc>
        <lastmod>2026-03-11T10:00:00Z</lastmod>
    </url>
    <url>
        <loc>https://portal.test/tag/politica</loc>
        <lastmod>2026-03-11T12:00:00Z</lastmod>
    </url>
</urlset>
XML,
                headers: ['content-type' => ['application/xml']],
                responseTimeMs: 45,
            ));

        $service = new SitemapParserService($httpFetch, new UrlNormalizerService());

        $items = $service->parse(
            'https://portal.test/sitemap.xml',
            articlePatterns: ['/noticias/'],
            ignorePatterns: ['/tag/']
        );

        $this->assertCount(1, $items);
        $this->assertSame('https://portal.test/noticias/valida', $items[0]->normalizedUrl);
        $this->assertSame('2026-03-11T10:00:00Z', $items[0]->lastmod);
    }
}
