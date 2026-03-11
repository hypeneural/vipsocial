<?php

use App\Models\User;
use App\Modules\NewsRadar\Enums\ContentSource;
use App\Modules\NewsRadar\Enums\EnrichmentStatus;
use App\Modules\NewsRadar\Enums\ExtractionStatus;
use App\Modules\NewsRadar\Enums\PublishedAtSource;
use App\Modules\NewsRadar\Exceptions\AiRequestException;
use App\Modules\NewsRadar\Jobs\FetchNewsSourceJob;
use App\Modules\NewsRadar\Jobs\ClassifyNewsItemJob;
use App\Modules\NewsRadar\Jobs\ProcessNewsItemJob;
use App\Modules\NewsRadar\Models\NewsItem;
use App\Modules\NewsRadar\Models\NewsItemAiMetadata;
use App\Modules\NewsRadar\Models\NewsItemMedia;
use App\Modules\NewsRadar\Models\NewsRawItem;
use App\Modules\NewsRadar\Models\NewsSource;
use App\Modules\NewsRadar\Models\NewsSourceRun;
use App\Modules\NewsRadar\Models\NewsTheme;
use App\Modules\NewsRadar\Models\SourceDiscoveryRun;
use App\Modules\NewsRadar\Services\ArticleExtractedData;
use App\Modules\NewsRadar\Services\ArticleExtractorService;
use App\Modules\NewsRadar\Services\AiEnrichmentService;
use App\Modules\NewsRadar\Services\BoilerplateCleanerService;
use App\Modules\NewsRadar\Services\FeedItemDto;
use App\Modules\NewsRadar\Services\FeedParseResult;
use App\Modules\NewsRadar\Services\FeedParserService;
use App\Modules\NewsRadar\Services\FieldResolverService;
use App\Modules\NewsRadar\Services\HttpFetchResult;
use App\Modules\NewsRadar\Services\HttpFetchService;
use App\Modules\NewsRadar\Services\ListingDiscoveryService;
use App\Modules\NewsRadar\Services\ListingItem;
use App\Modules\NewsRadar\Services\SitemapParserService;
use App\Modules\NewsRadar\Services\UrlNormalizerService;
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

test('classification failures are logged and exposed on item detail', function () {
    $source = makeNewsRadarSource(['name' => 'Fonte com IA']);
    $item = makeNewsRadarItem($source, [
        'title' => 'Item com falha de IA',
        'url' => 'https://fonte-ia.test/falha',
        'extraction_status' => ExtractionStatus::Extracted->value,
        'enrichment_status' => EnrichmentStatus::None->value,
    ]);

    $aiService = Mockery::mock(AiEnrichmentService::class);
    $aiService->shouldReceive('classifyBasic')
        ->once()
        ->andThrow(new AiRequestException(
            stage: 'classification',
            model: 'openai/gpt-oss-20b:free',
            message: 'No endpoints available matching your guardrail restrictions and data policy.',
            context: [
                'provider_status' => 404,
            ],
        ));
    $aiService->shouldReceive('classificationModel')
        ->once()
        ->andReturn('openai/gpt-oss-20b:free');

    $job = new ClassifyNewsItemJob($item->id);

    try {
        $job->handle($aiService);
        $this->fail('Era esperado que a classificacao lancasse excecao.');
    } catch (AiRequestException) {
        // expected
    }

    $item->refresh();

    expect($item->enrichment_status)->toBe(EnrichmentStatus::EnrichmentFailed);

    $this->assertDatabaseHas('news_item_ai_logs', [
        'news_item_id' => $item->id,
        'stage' => 'classification',
        'status' => 'failed',
        'model' => 'openai/gpt-oss-20b:free',
    ]);

    $this->actingAs($this->user, 'sanctum')
        ->getJson("/api/v1/news-radar/items/{$item->id}")
        ->assertOk()
        ->assertJsonPath('ai_logs.0.stage', 'classification')
        ->assertJsonPath('ai_logs.0.status', 'failed')
        ->assertJsonPath('ai_logs.0.model', 'openai/gpt-oss-20b:free')
        ->assertJsonPath(
            'ai_logs.0.error_message',
            'No endpoints available matching your guardrail restrictions and data policy.'
        )
        ->assertJsonPath('ai_logs.0.meta_json.provider_status', 404);
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

test('process job keeps feed hero image and cleans noisy feed bodies when detail fetch is skipped', function () {
    Bus::fake();

    $source = makeNewsRadarSource([
        'name' => 'Feed Limpo',
        'fetch_detail_mode' => 'never',
        'crawling_config' => [
            'boilerplate_rules' => [],
            'body_stop_text_patterns' => [],
        ],
    ]);

    $rawItem = NewsRawItem::create([
        'news_source_id' => $source->id,
        'raw_url' => 'https://feed-limpo.test/noticia',
        'normalized_url' => 'https://feed-limpo.test/noticia',
        'url_hash' => hash('sha256', 'https://feed-limpo.test/noticia'),
        'guid' => 'feed-limpo-1',
        'title_raw' => 'Titulo vindo do feed',
        'raw_payload' => [
            'title' => 'Titulo vindo do feed',
            'author' => 'Redação Portal',
            'pubDate' => '2026-03-11T12:00:00Z',
            'content' => '<p>Primeiro paragrafo.</p><p><img src="https://s.w.org/images/core/emoji/16.0.1/72x72/1f4f2.png" alt="📲"></p><p>Clique aqui e faça parte do nosso grupo no WhatsApp</p><p>Segundo paragrafo útil.</p><p>O post Titulo vindo do feed apareceu primeiro em Portal.</p>',
            'description' => 'Resumo curto',
            'categories' => ['Radar', 'Cidade'],
            'hero_image_url' => 'https://feed-limpo.test/hero.jpg',
        ],
        'first_seen_at' => now(),
        'last_seen_at' => now(),
    ]);

    $job = new ProcessNewsItemJob($rawItem->id);
    $job->handle(
        Mockery::mock(ArticleExtractorService::class),
        app(FieldResolverService::class),
        Mockery::mock(HttpFetchService::class),
        app(BoilerplateCleanerService::class),
    );

    $newsItem = NewsItem::where('news_raw_item_id', $rawItem->id)->firstOrFail();

    expect($newsItem->hero_image_url)->toBe('https://feed-limpo.test/hero.jpg');
    expect($newsItem->body_text)->toContain('Primeiro paragrafo.');
    expect($newsItem->body_text)->toContain('Segundo paragrafo útil.');
    expect($newsItem->body_text)->not->toContain('WhatsApp');
    expect($newsItem->body_text)->not->toContain('apareceu primeiro em');
});

test('when incomplete mode fetches article html when the feed body is only a short summary', function () {
    Bus::fake();

    $source = makeNewsRadarSource([
        'name' => 'Feed Resumido',
        'fetch_detail_mode' => 'when_incomplete',
    ]);

    $rawItem = NewsRawItem::create([
        'news_source_id' => $source->id,
        'raw_url' => 'https://feed-resumido.test/noticia',
        'normalized_url' => 'https://feed-resumido.test/noticia',
        'url_hash' => hash('sha256', 'https://feed-resumido.test/noticia'),
        'guid' => 'feed-resumido-1',
        'title_raw' => 'Titulo resumido',
        'raw_payload' => [
            'title' => 'Titulo resumido',
            'author' => 'Equipe Feed',
            'pubDate' => '2026-03-11T14:00:00Z',
            'content' => '<p><strong>Resumo</strong> ' . str_repeat('curto ', 20) . '</p>',
            'description' => 'Resumo curto',
            'categories' => ['Radar'],
            'hero_image_url' => 'https://feed-resumido.test/hero.jpg',
        ],
        'first_seen_at' => now(),
        'last_seen_at' => now(),
    ]);

    $articleExtractor = Mockery::mock(ArticleExtractorService::class);
    $articleExtractor->shouldReceive('extract')
        ->once()
        ->andReturn(new ArticleExtractedData(
            title: 'Titulo enriquecido',
            subtitle: 'Subtitulo enriquecido',
            author: 'Equipe Feed',
            publishedAt: '2026-03-11T14:00:00Z',
            modifiedAt: null,
            heroImage: 'https://feed-resumido.test/hero.jpg',
            bodyHtml: '<p>' . str_repeat('conteudo completo ', 60) . '</p>',
            bodyText: trim(str_repeat('conteudo completo ', 60)),
            categories: ['Radar'],
            jsonLdRaw: [],
            ogRaw: [],
        ));

    $httpFetch = Mockery::mock(HttpFetchService::class);
    $httpFetch->shouldReceive('fetch')
        ->once()
        ->with('https://feed-resumido.test/noticia')
        ->andReturn(new HttpFetchResult(
            success: true,
            statusCode: 200,
            body: '<article><p>' . str_repeat('conteudo completo ', 60) . '</p></article>',
            headers: [],
            responseTimeMs: 120,
        ));

    $job = new ProcessNewsItemJob($rawItem->id);
    $job->handle(
        $articleExtractor,
        app(FieldResolverService::class),
        $httpFetch,
        app(BoilerplateCleanerService::class),
    );

    $newsItem = NewsItem::where('news_raw_item_id', $rawItem->id)->firstOrFail();

    expect($newsItem->content_source->value)->toBe(ContentSource::FeedPlusHtml->value);
    expect($newsItem->body_text)->toContain('conteudo completo');
    expect($newsItem->extraction_completeness)->toBe(100);
});

test('feed ingestion persists long tracked urls and long subtitles without truncation errors', function () {
    Bus::fake();

    $source = makeNewsRadarSource([
        'name' => 'Fonte Longa',
        'discovery_mode' => 'feed',
        'fetch_detail_mode' => 'never',
        'crawling_config' => [
            'feed_url' => 'https://fonte-longa.test/feed',
        ],
    ]);

    $longUrl = 'https://fonte-longa.test/noticia?utm_source=rss&utm_medium=feed&utm_campaign='
        . str_repeat('campanha-muito-longa-', 10)
        . '&utm_content=' . str_repeat('bloco-', 18);
    $normalizedUrl = 'https://fonte-longa.test/noticia';
    $longExcerpt = trim(str_repeat('Resumo muito longo para validar a coluna subtitle no pipeline do news radar. ', 6));

    expect(mb_strlen($longUrl))->toBeGreaterThan(255);
    expect(mb_strlen($longExcerpt))->toBeGreaterThan(255);

    $feedParser = Mockery::mock(FeedParserService::class);
    $feedParser->shouldReceive('parseFromUrl')
        ->once()
        ->with('https://fonte-longa.test/feed')
        ->andReturn(new FeedParseResult(
            success: true,
            items: [
                makeFeedItemDto([
                    'title' => 'Noticia com tracking longo',
                    'rawUrl' => $longUrl,
                    'normalizedUrl' => $normalizedUrl,
                    'excerpt' => $longExcerpt,
                    'bodyHtml' => '<p>' . str_repeat('conteudo validado ', 40) . '</p>',
                    'heroImageUrl' => 'https://fonte-longa.test/imagens/capa-principal.jpg',
                    'rawPayload' => [
                        'title' => 'Noticia com tracking longo',
                        'author' => 'Equipe Fonte Longa',
                        'pubDate' => '2026-03-11T15:00:00Z',
                        'content' => '<p>' . str_repeat('conteudo validado ', 40) . '</p>',
                        'description' => $longExcerpt,
                        'categories' => ['Radar', 'Teste'],
                        'hero_image_url' => 'https://fonte-longa.test/imagens/capa-principal.jpg',
                    ],
                ]),
            ],
            feedTitle: 'Feed Longo',
            feedUrl: 'https://fonte-longa.test/feed',
            error: null,
        ));

    $fetchJob = new FetchNewsSourceJob($source->id);
    $fetchJob->handle(
        $feedParser,
        Mockery::mock(SitemapParserService::class),
        Mockery::mock(ListingDiscoveryService::class),
        app(UrlNormalizerService::class),
    );

    $rawItem = NewsRawItem::where('news_source_id', $source->id)->firstOrFail();

    expect($rawItem->raw_url)->toBe($longUrl);
    expect($rawItem->normalized_url)->toBe($normalizedUrl);

    $processJob = new ProcessNewsItemJob($rawItem->id);
    $processJob->handle(
        Mockery::mock(ArticleExtractorService::class),
        app(FieldResolverService::class),
        Mockery::mock(HttpFetchService::class),
        app(BoilerplateCleanerService::class),
    );

    $newsItem = NewsItem::where('news_raw_item_id', $rawItem->id)->firstOrFail();

    expect($newsItem->raw_url)->toBe($longUrl);
    expect($newsItem->subtitle)->toBe($longExcerpt);
    expect($newsItem->body_text)->toContain('conteudo validado');
});
