<?php

use App\Modules\NewsRadar\Services\FeedParserService;
use App\Modules\NewsRadar\Services\BoilerplateCleanerService;
use App\Modules\NewsRadar\Services\HttpFetchService;
use App\Modules\NewsRadar\Services\UrlNormalizerService;

uses(Tests\TestCase::class);

test('parse from string sanitizes invalid trailing xml content', function () {
    $service = new FeedParserService(
        new UrlNormalizerService(),
        Mockery::mock(HttpFetchService::class),
        new BoilerplateCleanerService(),
    );

    $xml = <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Feed de Teste</title>
    <item>
      <title>Primeira materia</title>
      <link>https://portal.test/materia-1</link>
      <guid>materia-1</guid>
      <pubDate>Wed, 11 Mar 2026 12:00:00 GMT</pubDate>
      <description><![CDATA[<p>Resumo valido</p>]]></description>
    </item>
  </channel>
</rss>
XML;

    $result = $service->parseFromString($xml . "\x00\x1F<!-- trailing garbage -->", 'https://portal.test/feed');

    expect($result->success)->toBeTrue();
    expect($result->count())->toBe(1);
    expect($result->feedTitle)->toBe('Feed de Teste');
    expect($result->items[0]->title)->toBe('Primeira materia');
    expect($result->items[0]->normalizedUrl)->toBe('https://portal.test/materia-1');
});

test('parse from string ignores tracking pixel images and cleans excerpt trailers', function () {
    $service = new FeedParserService(
        new UrlNormalizerService(),
        Mockery::mock(HttpFetchService::class),
        new BoilerplateCleanerService(),
    );

    $xml = <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Feed de Teste</title>
    <item>
      <title>Materia com pixel</title>
      <link>https://portal.test/materia-pixel</link>
      <guid>materia-pixel</guid>
      <pubDate>Wed, 11 Mar 2026 12:00:00 GMT</pubDate>
      <description><![CDATA[<p>Resumo limpo.</p><p>&lt;p&gt;The post <a href="https://portal.test/materia-pixel">Materia com pixel</a> first appeared on <a href="https://portal.test">Portal</a>.&lt;/p&gt;</p>]]></description>
      <content:encoded><![CDATA[<p>Texto principal.</p><p><img src="https://api.dino.com.br/v2/news/tr/123?partnerId=1" width="1" height="1" /></p>]]></content:encoded>
    </item>
  </channel>
</rss>
XML;

    $result = $service->parseFromString($xml, 'https://portal.test/feed');

    expect($result->success)->toBeTrue();
    expect($result->items[0]->heroImageUrl)->toBeNull();
    expect($result->items[0]->excerpt)->toBe('Resumo limpo.');
});
