<?php

use App\Models\User;
use App\Modules\NewsRadar\Enums\ContentSource;
use App\Modules\NewsRadar\Enums\EnrichmentStatus;
use App\Modules\NewsRadar\Enums\ExtractionStatus;
use App\Modules\NewsRadar\Enums\PublishedAtSource;
use App\Modules\NewsRadar\Models\NewsItem;
use App\Modules\NewsRadar\Models\NewsSource;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleAndPermissionSeeder::class);

    $this->user = User::factory()->create([
        'role' => 'admin',
        'active' => true,
    ]);
    $this->user->assignRole('admin');
});

test('news radar items endpoint always includes public_token in feed payload', function () {
    $source = NewsSource::create([
        'name' => 'Fonte Public Token',
        'homepage_url' => 'https://fonte-public-token.test',
        'active' => true,
        'source_type' => 'portal',
        'discovery_mode' => 'feed',
        'fetch_detail_mode' => 'when_incomplete',
        'success_rate' => 100,
        'last_items_found' => 0,
        'timezone_default' => 'America/Sao_Paulo',
        'render_js_required' => false,
    ]);

    $item = NewsItem::create([
        'news_source_id' => $source->id,
        'public_token' => (string) Str::uuid(),
        'url' => 'https://fonte-public-token.test/noticia',
        'raw_url' => 'https://fonte-public-token.test/noticia?utm_source=rss',
        'url_hash' => hash('sha256', 'https://fonte-public-token.test/noticia'),
        'title' => 'Noticia com public token',
        'excerpt' => 'Resumo da noticia',
        'body_html' => '<p>Conteudo</p>',
        'body_text' => 'Conteudo',
        'language' => 'pt-BR',
        'published_at_raw' => now()->toIso8601String(),
        'published_at_utc' => now(),
        'published_at_source' => PublishedAtSource::Rss->value,
        'extraction_completeness' => 100,
        'content_source' => ContentSource::FeedOnly->value,
        'extraction_status' => ExtractionStatus::Extracted->value,
        'enrichment_status' => EnrichmentStatus::None->value,
        'is_duplicate_candidate' => false,
    ]);

    $this->actingAs($this->user, 'sanctum')
        ->getJson('/api/v1/news-radar/items')
        ->assertOk()
        ->assertJsonPath('data.0.id', $item->id)
        ->assertJsonPath('data.0.public_token', $item->public_token);
});
