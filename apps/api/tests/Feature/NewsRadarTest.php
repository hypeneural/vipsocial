<?php

use App\Models\User;
use App\Modules\NewsRadar\Enums\ContentSource;
use App\Modules\NewsRadar\Enums\EnrichmentStatus;
use App\Modules\NewsRadar\Enums\ExtractionStatus;
use App\Modules\NewsRadar\Enums\PublishedAtSource;
use App\Modules\NewsRadar\Jobs\FetchNewsSourceJob;
use App\Modules\NewsRadar\Models\NewsItem;
use App\Modules\NewsRadar\Models\NewsItemAiMetadata;
use App\Modules\NewsRadar\Models\NewsItemMedia;
use App\Modules\NewsRadar\Models\NewsRawItem;
use App\Modules\NewsRadar\Models\NewsSource;
use App\Modules\NewsRadar\Models\NewsSourceRun;
use App\Modules\NewsRadar\Models\NewsTheme;
use App\Modules\NewsRadar\Models\SourceDiscoveryRun;
use App\Modules\NewsRadar\Services\FeedItemDto;
use App\Modules\NewsRadar\Services\FeedParseResult;
use App\Modules\NewsRadar\Services\FeedParserService;
use App\Modules\NewsRadar\Services\HttpFetchResult;
use App\Modules\NewsRadar\Services\HttpFetchService;
use App\Modules\NewsRadar\Services\ListingDiscoveryService;
use App\Modules\NewsRadar\Services\ListingItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create([
        'role' => 'admin',
        'active' => true,
    ]);
});

function makeNewsRadarSource(array $overrides = []): NewsSource
{
    $suffix = Str::lower(Str::random(8));

    return NewsSource::create(array_merge([
        'name' => "Fonte {$suffix}",
        'homepage_url' => "https://{$suffix}.test",
        'active' => true,
        'source_type' => 'portal',
        'discovery_mode' => 'feed',
        'fetch_detail_mode' => 'when_incomplete',
        'success_rate' => 100,
        'last_items_found' => 0,
        'timezone_default' => 'America/Sao_Paulo',
        'render_js_required' => false,
    ], $overrides));
}

function makeNewsRadarItem(NewsSource $source, array $overrides = []): NewsItem
{
    $slug = Str::lower(Str::random(10));
    $url = $overrides['url'] ?? "https://{$source->id}.test/noticia-{$slug}";

    $attributes = array_merge([
        'news_source_id' => $source->id,
        'url' => $url,
        'raw_url' => $url,
        'title' => "Noticia {$slug}",
        'excerpt' => "Resumo {$slug}",
        'body_html' => '<p>Conteudo</p>',
        'body_text' => 'Conteudo',
        'language' => 'pt-BR',
        'published_at_raw' => now()->toIso8601String(),
        'published_at_utc' => now(),
        'published_at_source' => PublishedAtSource::Rss->value,
        'extraction_completeness' => 90,
        'content_source' => ContentSource::FeedOnly->value,
        'extraction_status' => ExtractionStatus::Extracted->value,
        'enrichment_status' => EnrichmentStatus::None->value,
        'is_duplicate_candidate' => false,
    ], $overrides);

    $attributes['url_hash'] = hash('sha256', $attributes['url']);
    $attributes['raw_url'] = $attributes['raw_url'] ?? $attributes['url'];

    return NewsItem::create($attributes);
}

function makeFeedItemDto(array $overrides = []): FeedItemDto
{
    $url = $overrides['rawUrl'] ?? $overrides['normalizedUrl'] ?? 'https://portal.test/noticia';

    return new FeedItemDto(
        title: $overrides['title'] ?? 'Titulo da noticia',
        rawUrl: $url,
        normalizedUrl: $overrides['normalizedUrl'] ?? $url,
        urlHash: $overrides['urlHash'] ?? hash('sha256', $url),
        guid: $overrides['guid'] ?? Str::uuid()->toString(),
        authorRaw: $overrides['authorRaw'] ?? 'Equipe VIP',
        publishedAtRaw: $overrides['publishedAtRaw'] ?? now()->toIso8601String(),
        bodyHtml: $overrides['bodyHtml'] ?? ('<p>' . str_repeat('conteudo rico ', 80) . '</p>'),
        excerpt: $overrides['excerpt'] ?? 'Resumo suficientemente grande para score parcial ou full.',
        categoriesRaw: $overrides['categoriesRaw'] ?? ['Radar'],
        heroImageUrl: $overrides['heroImageUrl'] ?? 'https://portal.test/image.jpg',
        rawPayload: $overrides['rawPayload'] ?? ['title' => $overrides['title'] ?? 'Titulo da noticia'],
    );
}

test('news source crud and sync flow work through the api', function () {
    Bus::fake();

    $payload = [
        'name' => 'Portal VIP',
        'homepage_url' => 'https://portal-vip.test',
        'source_type' => 'portal',
        'discovery_mode' => 'feed',
        'fetch_detail_mode' => 'when_incomplete',
        'notes' => 'Fonte inicial',
    ];

    $createResponse = $this->actingAs($this->user, 'sanctum')
        ->postJson('/api/v1/news-radar/sources', $payload)
        ->assertCreated()
        ->assertJsonPath('name', 'Portal VIP');

    $sourceId = $createResponse->json('id');

    $this->assertDatabaseHas('news_sources', [
        'id' => $sourceId,
        'homepage_url' => 'https://portal-vip.test',
    ]);

    $this->actingAs($this->user, 'sanctum')
        ->getJson('/api/v1/news-radar/sources?search=Portal%20VIP')
        ->assertOk()
        ->assertJsonPath('total', 1)
        ->assertJsonPath('data.0.id', $sourceId);

    $this->actingAs($this->user, 'sanctum')
        ->putJson("/api/v1/news-radar/sources/{$sourceId}", [
            'notes' => 'Fonte atualizada',
            'fetch_detail_mode' => 'always',
        ])
        ->assertOk()
        ->assertJsonPath('notes', 'Fonte atualizada')
        ->assertJsonPath('fetch_detail_mode', 'always');

    $this->actingAs($this->user, 'sanctum')
        ->postJson("/api/v1/news-radar/sources/{$sourceId}/sync")
        ->assertOk()
        ->assertJsonPath('source_id', $sourceId);

    Bus::assertDispatched(FetchNewsSourceJob::class, fn (FetchNewsSourceJob $job) => $job->newsSourceId === $sourceId);

    $this->actingAs($this->user, 'sanctum')
        ->deleteJson("/api/v1/news-radar/sources/{$sourceId}")
        ->assertOk()
        ->assertJsonPath('message', 'Source deactivated.');

    $this->assertSoftDeleted('news_sources', ['id' => $sourceId]);
});

test('source detail and runs endpoint expose counters and recent history', function () {
    $source = makeNewsRadarSource(['name' => 'Fonte Historico']);

    for ($index = 0; $index < 12; $index++) {
        NewsSourceRun::create([
            'news_source_id' => $source->id,
            'started_at' => now()->subMinutes($index + 1),
            'finished_at' => now()->subMinutes($index),
            'status' => $index === 0 ? 'failed' : 'success',
            'items_found' => 10 - min($index, 9),
            'items_new' => max(1, 5 - min($index, 4)),
            'items_failed' => $index === 0 ? 2 : 0,
            'response_time_avg_ms' => 500 + $index,
        ]);
    }

    for ($index = 0; $index < 3; $index++) {
        NewsRawItem::create([
            'news_source_id' => $source->id,
            'raw_url' => "https://fonte-historico.test/raw-{$index}",
            'normalized_url' => "https://fonte-historico.test/raw-{$index}",
            'url_hash' => hash('sha256', "https://fonte-historico.test/raw-{$index}"),
            'title_raw' => "Raw {$index}",
            'first_seen_at' => now()->subDay(),
            'last_seen_at' => now(),
        ]);
    }

    for ($index = 0; $index < 2; $index++) {
        makeNewsRadarItem($source, [
            'title' => "Item {$index}",
            'url' => "https://fonte-historico.test/item-{$index}",
        ]);
    }

    $this->actingAs($this->user, 'sanctum')
        ->getJson("/api/v1/news-radar/sources/{$source->id}")
        ->assertOk()
        ->assertJsonPath('items_count', 2)
        ->assertJsonPath('raw_items_count', 3)
        ->assertJsonCount(10, 'runs');

    $runsResponse = $this->actingAs($this->user, 'sanctum')
        ->getJson("/api/v1/news-radar/sources/{$source->id}/runs")
        ->assertOk()
        ->assertJsonPath('total', 12);

    expect($runsResponse->json('data.0.status'))->toBe('failed');
    expect($runsResponse->json('data.11.status'))->toBe('success');
});

test('items listing, detail and related endpoints support filters and payload expansion', function () {
    Carbon::setTestNow(Carbon::parse('2026-03-11 12:00:00'));

    $source = makeNewsRadarSource(['name' => 'Fonte Principal']);
    $otherSource = makeNewsRadarSource(['name' => 'Fonte Secundaria']);
    $theme = NewsTheme::create([
        'slug' => 'seguranca',
        'label' => 'Seguranca',
        'active' => true,
    ]);

    $rawItem = NewsRawItem::create([
        'news_source_id' => $source->id,
        'raw_url' => 'https://fonte-principal.test/radar-principal',
        'normalized_url' => 'https://fonte-principal.test/radar-principal',
        'url_hash' => hash('sha256', 'https://fonte-principal.test/radar-principal'),
        'title_raw' => 'Radar Principal',
        'raw_payload' => ['source' => 'feed'],
        'first_seen_at' => now()->subHour(),
        'last_seen_at' => now(),
        'seen_count' => 2,
    ]);

    $mainItem = makeNewsRadarItem($source, [
        'news_raw_item_id' => $rawItem->id,
        'url' => 'https://fonte-principal.test/radar-principal',
        'title' => 'Radar Principal',
        'excerpt' => 'Resumo do radar principal',
        'body_text' => 'Texto detalhado da noticia principal',
        'body_html' => '<p>Texto detalhado da noticia principal</p>',
        'extraction_status' => ExtractionStatus::Extracted->value,
        'enrichment_status' => EnrichmentStatus::EnrichedL2->value,
        'published_at_utc' => now(),
    ]);

    NewsItemAiMetadata::create([
        'news_item_id' => $mainItem->id,
        'city' => 'Tijucas',
        'state_abbr' => 'SC',
        'news_theme_id' => $theme->id,
        'urgency' => 'alta',
        'relevance_score' => 0.93,
        'five_ws' => ['who' => 'Defesa Civil'],
        'summary_bullets' => ['Bullet 1'],
        'enrichment_level' => 'level_2',
    ]);

    NewsItemMedia::create([
        'news_item_id' => $mainItem->id,
        'type' => 'hero',
        'url' => 'https://fonte-principal.test/hero.jpg',
        'position' => 0,
    ]);

    $relatedItem = makeNewsRadarItem($source, [
        'url' => 'https://fonte-principal.test/relacionada',
        'title' => 'Radar Relacionado',
        'published_at_utc' => now()->subDay(),
    ]);

    makeNewsRadarItem($source, [
        'url' => 'https://fonte-principal.test/antiga',
        'title' => 'Radar Antigo',
        'published_at_utc' => now()->subDays(10),
    ]);

    makeNewsRadarItem($otherSource, [
        'url' => 'https://fonte-secundaria.test/outra',
        'title' => 'Outra noticia',
        'published_at_utc' => now(),
    ]);

    $listResponse = $this->actingAs($this->user, 'sanctum')
        ->getJson('/api/v1/news-radar/items?source_id=' . $source->id
            . '&search=Radar%20Principal'
            . '&extraction_status=extracted'
            . '&enrichment_status=enriched_l2'
            . '&city=Tijucas'
            . '&theme_id=' . $theme->id
            . '&urgency=alta')
        ->assertOk()
        ->assertJsonPath('total', 1)
        ->assertJsonPath('data.0.id', $mainItem->id)
        ->assertJsonPath('data.0.source.name', 'Fonte Principal');

    $this->actingAs($this->user, 'sanctum')
        ->getJson("/api/v1/news-radar/items/{$mainItem->id}")
        ->assertOk()
        ->assertJsonPath('ai_metadata.city', 'Tijucas')
        ->assertJsonPath('raw_item.seen_count', 2)
        ->assertJsonCount(1, 'media');

    $this->actingAs($this->user, 'sanctum')
        ->getJson("/api/v1/news-radar/items/{$mainItem->id}/related")
        ->assertOk()
        ->assertJsonPath('data.0.id', $relatedItem->id)
        ->assertJsonCount(1, 'data');

    Carbon::setTestNow();
});

test('dashboard endpoint aggregates source and item metrics', function () {
    Carbon::setTestNow(Carbon::parse('2026-03-11 10:00:00'));

    $activeSource = makeNewsRadarSource(['name' => 'Ativa']);
    $failingSource = makeNewsRadarSource([
        'name' => 'Falhando',
        'consecutive_failures' => 3,
    ]);
    $lockedSource = makeNewsRadarSource([
        'name' => 'Travada',
        'sync_locked_until' => now()->addMinutes(15),
    ]);
    makeNewsRadarSource([
        'name' => 'Inativa',
        'active' => false,
        'consecutive_failures' => 8,
    ]);

    $todayItem = makeNewsRadarItem($activeSource, [
        'title' => 'Item Hoje',
        'url' => 'https://ativa.test/hoje',
        'extraction_status' => ExtractionStatus::Extracted->value,
        'enrichment_status' => EnrichmentStatus::EnrichedL1->value,
    ]);
    $todayItem->forceFill(['created_at' => now(), 'updated_at' => now()])->save();

    $weekItem = makeNewsRadarItem($activeSource, [
        'title' => 'Item Semana',
        'url' => 'https://ativa.test/semana',
        'extraction_status' => ExtractionStatus::Extracted->value,
        'enrichment_status' => EnrichmentStatus::None->value,
    ]);
    $weekItem->forceFill([
        'created_at' => now()->subDays(2),
        'updated_at' => now()->subDays(2),
        'published_at_utc' => now()->subDays(2),
    ])->save();

    $failedItem = makeNewsRadarItem($failingSource, [
        'title' => 'Item Falho',
        'url' => 'https://falhando.test/falho',
        'extraction_status' => ExtractionStatus::ExtractionFailed->value,
        'enrichment_status' => EnrichmentStatus::EnrichmentFailed->value,
    ]);
    $failedItem->forceFill([
        'created_at' => now()->subDays(10),
        'updated_at' => now()->subDays(10),
        'published_at_utc' => now()->subDays(10),
    ])->save();

    $this->actingAs($this->user, 'sanctum')
        ->getJson('/api/v1/news-radar/dashboard')
        ->assertOk()
        ->assertJsonPath('total_sources', 3)
        ->assertJsonPath('total_items', 3)
        ->assertJsonPath('items_today', 1)
        ->assertJsonPath('items_this_week', 2)
        ->assertJsonPath('sources_with_failures', 1)
        ->assertJsonPath('sources_locked', 1)
        ->assertJsonPath('by_extraction_status.extracted', 2)
        ->assertJsonPath('by_extraction_status.extraction_failed', 1)
        ->assertJsonPath('by_enrichment_status.enriched_l1', 1)
        ->assertJsonPath('by_enrichment_status.none', 1)
        ->assertJsonPath('by_enrichment_status.enrichment_failed', 1)
        ->assertJsonPath('by_source.0.news_source_id', $activeSource->id)
        ->assertJsonPath('by_source.0.count', 2)
        ->assertJsonPath('failing_sources.0.id', $failingSource->id);

    Carbon::setTestNow();
});

test('discovery endpoints create and expose source discovery runs', function () {
    $html = <<<'HTML'
<html>
    <head>
        <title>Portal Teste</title>
        <meta name="generator" content="WordPress 6.8" />
        <link rel="alternate" type="application/rss+xml" href="/feed/" />
    </head>
    <body>wp-content</body>
</html>
HTML;

    $httpFetch = Mockery::mock(HttpFetchService::class);
    $httpFetch->shouldReceive('fetch')
        ->once()
        ->with('https://portal-teste.test')
        ->andReturn(new HttpFetchResult(true, 200, $html, ['content-type' => ['text/html']], 120));
    $httpFetch->shouldReceive('fetchXml')
        ->once()
        ->with('https://portal-teste.test/sitemap.xml')
        ->andReturn(new HttpFetchResult(true, 200, '<xml />', ['content-type' => ['application/xml']], 80));

    $feedParser = Mockery::mock(FeedParserService::class);
    $feedParser->shouldReceive('parseFromUrl')
        ->once()
        ->with('https://portal-teste.test/feed/')
        ->andReturn(new FeedParseResult(
            success: true,
            items: [
                makeFeedItemDto(['title' => 'Materia 1']),
                makeFeedItemDto(['title' => 'Materia 2', 'rawUrl' => 'https://portal-teste.test/materia-2']),
                makeFeedItemDto(['title' => 'Materia 3', 'rawUrl' => 'https://portal-teste.test/materia-3']),
            ],
            feedTitle: 'Feed Portal Teste',
            feedUrl: 'https://portal-teste.test/feed/',
            error: null,
        ));

    app()->instance(HttpFetchService::class, $httpFetch);
    app()->instance(FeedParserService::class, $feedParser);

    $discoverResponse = $this->actingAs($this->user, 'sanctum')
        ->postJson('/api/v1/news-radar/sources/discover', [
            'url' => 'https://portal-teste.test',
        ])
        ->assertOk()
        ->assertJsonPath('status', 'completed')
        ->assertJsonPath('result.feed.url', 'https://portal-teste.test/feed/')
        ->assertJsonPath('result.sitemap.detected', true);

    $runId = $discoverResponse->json('run_id');

    $this->assertDatabaseHas('source_discovery_runs', [
        'id' => $runId,
        'requested_url' => 'https://portal-teste.test',
    ]);

    $this->actingAs($this->user, 'sanctum')
        ->getJson("/api/v1/news-radar/sources/discover/{$runId}/status")
        ->assertOk()
        ->assertJsonPath('run_id', $runId)
        ->assertJsonPath('status', 'completed')
        ->assertJsonPath('result.page.detected_cms', 'wordpress');
});

test('preview endpoint supports feed and html listing modes', function () {
    $feedParser = Mockery::mock(FeedParserService::class);
    $feedParser->shouldReceive('parseFromUrl')
        ->once()
        ->with('https://preview.test/feed')
        ->andReturn(new FeedParseResult(
            success: true,
            items: [
                makeFeedItemDto([
                    'title' => 'Feed Preview',
                    'rawUrl' => 'https://preview.test/feed-preview',
                    'normalizedUrl' => 'https://preview.test/feed-preview',
                    'excerpt' => 'Resumo feed preview',
                ]),
            ],
            feedTitle: 'Preview Feed',
            feedUrl: 'https://preview.test/feed',
            error: null,
        ));

    $listingDiscovery = Mockery::mock(ListingDiscoveryService::class);
    $listingDiscovery->shouldReceive('discover')
        ->once()
        ->with(Mockery::on(function (array $config) {
            return $config['listing_urls'] === ['https://preview.test/lista'];
        }), 0)
        ->andReturn([
            new ListingItem(
                rawUrl: 'https://preview.test/lista/item',
                normalizedUrl: 'https://preview.test/lista/item',
                urlHash: hash('sha256', 'https://preview.test/lista/item'),
                title: 'HTML Preview',
                imageUrl: 'https://preview.test/image.jpg',
                excerpt: 'Resumo html preview',
            ),
        ]);

    app()->instance(FeedParserService::class, $feedParser);
    app()->instance(ListingDiscoveryService::class, $listingDiscovery);

    $this->actingAs($this->user, 'sanctum')
        ->postJson('/api/v1/news-radar/sources/preview', [
            'mode' => 'feed',
            'url' => 'https://preview.test/feed',
        ])
        ->assertOk()
        ->assertJsonPath('preview.0.title', 'Feed Preview')
        ->assertJsonPath('preview.0.excerpt', 'Resumo feed preview');

    $this->actingAs($this->user, 'sanctum')
        ->postJson('/api/v1/news-radar/sources/preview', [
            'mode' => 'html_listing',
            'url' => 'https://preview.test/lista',
            'config' => [
                'listing_item_selectors' => ['article'],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('preview.0.title', 'HTML Preview')
        ->assertJsonPath('preview.0.image', 'https://preview.test/image.jpg');
});

test('test selector endpoint returns matches and stores snapshots on the discovery run', function () {
    $run = SourceDiscoveryRun::create([
        'requested_url' => 'https://portal-teste.test',
        'status' => 'completed',
        'started_at' => now()->subMinute(),
        'finished_at' => now(),
        'result_json' => ['page' => ['title' => 'Portal']],
    ]);

    $html = <<<'HTML'
<html>
    <body>
        <article>
            <h2>Primeira noticia</h2>
        </article>
        <article>
            <h2>Segunda noticia</h2>
        </article>
    </body>
</html>
HTML;

    $httpFetch = Mockery::mock(HttpFetchService::class);
    $httpFetch->shouldReceive('fetch')
        ->once()
        ->with('https://portal-teste.test/lista')
        ->andReturn(new HttpFetchResult(true, 200, $html, ['content-type' => ['text/html']], 50));

    app()->instance(HttpFetchService::class, $httpFetch);

    $this->actingAs($this->user, 'sanctum')
        ->postJson('/api/v1/news-radar/sources/test-selector', [
            'url' => 'https://portal-teste.test/lista',
            'selector' => 'article',
            'run_id' => $run->id,
        ])
        ->assertOk()
        ->assertJsonPath('matches', 2)
        ->assertJsonPath('results.0.tag', 'article');

    $run->refresh();

    expect($run->selector_test_snapshots)->toHaveCount(1);
    expect($run->selector_test_snapshots[0]['selector'])->toBe('article');
});
