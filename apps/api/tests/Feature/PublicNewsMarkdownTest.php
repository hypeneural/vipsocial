<?php

use App\Modules\NewsRadar\Enums\ContentSource;
use App\Modules\NewsRadar\Enums\EnrichmentStatus;
use App\Modules\NewsRadar\Enums\ExtractionStatus;
use App\Modules\NewsRadar\Enums\PublishedAtSource;
use App\Modules\NewsRadar\Models\NewsItem;
use App\Modules\NewsRadar\Models\NewsSource;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

function makePublicMarkdownSource(): NewsSource
{
    $suffix = Str::lower(Str::random(8));

    return NewsSource::create([
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
    ]);
}

function makePublicMarkdownItem(NewsSource $source, array $overrides = []): NewsItem
{
    $slug = Str::lower(Str::random(10));
    $url = $overrides['url'] ?? "https://{$source->id}.test/noticia-{$slug}";

    $attributes = array_merge([
        'news_source_id' => $source->id,
        'public_token' => (string) Str::uuid(),
        'url' => $url,
        'raw_url' => $url,
        'title' => "Noticia {$slug}",
        'subtitle' => "Subtitulo {$slug}",
        'excerpt' => "Resumo {$slug}",
        'body_html' => '<p>Conteudo publico</p>',
        'body_text' => 'Conteudo publico',
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

    return NewsItem::create($attributes);
}

test('public news markdown returns markdown with wildcard cors for arbitrary origins', function () {
    $source = makePublicMarkdownSource();
    $item = makePublicMarkdownItem($source);

    $response = $this->withHeaders([
        'Origin' => 'https://chat.openai.com',
    ])->get("/api/v1/public/news/{$item->public_token}/markdown");

    $response->assertOk()
        ->assertHeader('Content-Type', 'text/markdown; charset=UTF-8')
        ->assertHeader('Access-Control-Allow-Origin', '*');

    expect($response->headers->get('Access-Control-Expose-Headers'))
        ->toBe('Content-Type, Cache-Control, ETag, Last-Modified, X-Request-Id, X-Trace-Id');

    expect($response->getContent())->toContain('# ')
        ->toContain('Conteudo publico');
});

test('public news markdown answers cors preflight for arbitrary origins', function () {
    $source = makePublicMarkdownSource();
    $item = makePublicMarkdownItem($source);

    $response = $this->call('OPTIONS', "/api/v1/public/news/{$item->public_token}/markdown", [], [], [], [
        'HTTP_ORIGIN' => 'https://claude.ai',
        'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
    ]);

    $response->assertNoContent()
        ->assertHeader('Access-Control-Allow-Origin', '*');

    expect($response->headers->get('Access-Control-Allow-Methods'))->toContain('GET');
});

test('public news markdown keeps wildcard cors on not found responses', function () {
    $response = $this->withHeaders([
        'Origin' => 'https://claude.ai',
    ])->get('/api/v1/public/news/' . Str::uuid()->toString() . '/markdown');

    $response->assertNotFound()
        ->assertHeader('Access-Control-Allow-Origin', '*');
});
