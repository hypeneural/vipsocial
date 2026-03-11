<?php

use App\Modules\NewsRadar\Enums\ContentSource;
use App\Modules\NewsRadar\Enums\EnrichmentStatus;
use App\Modules\NewsRadar\Enums\ExtractionStatus;
use App\Modules\NewsRadar\Enums\PublishedAtSource;
use App\Modules\NewsRadar\Models\NewsItem;
use App\Modules\NewsRadar\Models\NewsItemAiMetadata;
use App\Modules\NewsRadar\Models\NewsSource;
use App\Modules\NewsRadar\Models\NewsTheme;
use App\Modules\NewsRadar\Services\AiEnrichmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use OpenAI\Laravel\Facades\OpenAI;
use OpenAI\Resources\Chat;
use OpenAI\Responses\Chat\CreateResponse;

uses(Tests\TestCase::class, RefreshDatabase::class);

function makeAiTestSource(): NewsSource
{
    return NewsSource::create([
        'name' => 'Fonte AI',
        'homepage_url' => 'https://fonte-ai.test',
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

function makeAiTestItem(NewsSource $source): NewsItem
{
    $url = 'https://fonte-ai.test/noticia-principal';

    return NewsItem::create([
        'news_source_id' => $source->id,
        'url' => $url,
        'url_hash' => hash('sha256', $url),
        'raw_url' => $url,
        'title' => 'Titulo principal',
        'subtitle' => 'Subtitulo da materia',
        'author_normalized' => 'Redacao',
        'body_html' => '<p>Conteudo completo da materia.</p>',
        'body_text' => str_repeat('Conteudo completo da materia. ', 30),
        'excerpt' => 'Resumo principal',
        'language' => 'pt-BR',
        'published_at_raw' => now()->toIso8601String(),
        'published_at_utc' => now(),
        'published_at_source' => PublishedAtSource::Rss->value,
        'extraction_completeness' => 100,
        'content_source' => ContentSource::FeedPlusHtml->value,
        'extraction_status' => ExtractionStatus::Extracted->value,
        'enrichment_status' => EnrichmentStatus::None->value,
        'is_duplicate_candidate' => false,
    ]);
}

test('classification uses the configured model', function () {
    config()->set('news_radar.ai.classification_model', 'openai/gpt-oss-20b:free');
    config()->set('news_radar.ai.editorial_model', 'openai/gpt-4o-mini');

    NewsTheme::create([
        'slug' => 'esporte',
        'label' => 'Esporte',
        'active' => true,
    ]);

    $fake = OpenAI::fake([
        CreateResponse::fake([
            'model' => 'openai/gpt-oss-20b:free',
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'city' => 'Blumenau',
                            'state_abbr' => 'SC',
                            'theme' => 'esporte',
                            'urgency' => 'media',
                            'relevance_score' => 0.82,
                            'entities' => [
                                ['type' => 'organizacao', 'name' => 'Blumenau EC'],
                            ],
                        ], JSON_THROW_ON_ERROR),
                    ],
                ],
            ],
            'usage' => [
                'prompt_tokens' => 50,
                'completion_tokens' => 25,
                'total_tokens' => 75,
            ],
        ]),
    ]);

    $service = app(AiEnrichmentService::class);
    $item = makeAiTestItem(makeAiTestSource());

    $result = $service->classifyBasic($item);
    $metadata = NewsItemAiMetadata::where('news_item_id', $item->id)->firstOrFail();

    expect($result->relevanceScore)->toBe(0.82);
    expect($metadata->ai_model_used)->toBe('openai/gpt-oss-20b:free');

    $fake->assertSent(Chat::class, fn (string $method, array $parameters): bool => $method === 'create'
        && $parameters['model'] === 'openai/gpt-oss-20b:free');
});

test('editorial enrichment uses its configured model and updates the stored model name', function () {
    config()->set('news_radar.ai.classification_model', 'openai/gpt-oss-20b:free');
    config()->set('news_radar.ai.editorial_model', 'openai/gpt-4o-mini');

    $fake = OpenAI::fake([
        CreateResponse::fake([
            'model' => 'openai/gpt-4o-mini',
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'five_ws' => [
                                'who' => 'Defesa Civil',
                                'what' => 'Emitiu alerta',
                                'where' => 'Blumenau',
                                'when' => 'Hoje',
                                'why' => 'Chuvas fortes',
                                'how' => 'Por comunicado oficial',
                            ],
                            'suggested_titles' => ['Titulo 1', 'Titulo 2', 'Titulo 3'],
                            'summary_bullets' => ['Bullet 1', 'Bullet 2', 'Bullet 3'],
                        ], JSON_THROW_ON_ERROR),
                    ],
                ],
            ],
            'usage' => [
                'prompt_tokens' => 70,
                'completion_tokens' => 30,
                'total_tokens' => 100,
            ],
        ]),
    ]);

    $item = makeAiTestItem(makeAiTestSource());

    NewsItemAiMetadata::create([
        'news_item_id' => $item->id,
        'city' => 'Blumenau',
        'state_abbr' => 'SC',
        'urgency' => 'media',
        'relevance_score' => 0.82,
        'entities' => [],
        'ai_model_used' => 'openai/gpt-oss-20b:free',
        'ai_tokens_used' => 75,
        'enrichment_level' => 'level_1',
    ]);

    $service = app(AiEnrichmentService::class);
    $service->enrichEditorial($item);

    $metadata = NewsItemAiMetadata::where('news_item_id', $item->id)->firstOrFail();

    expect($metadata->ai_model_used)->toBe('openai/gpt-4o-mini');
    expect($metadata->ai_tokens_used)->toBe(175);
    expect($metadata->enrichment_level)->toBe('level_2');

    $fake->assertSent(Chat::class, fn (string $method, array $parameters): bool => $method === 'create'
        && $parameters['model'] === 'openai/gpt-4o-mini');
});
