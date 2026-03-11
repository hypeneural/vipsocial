<?php

use App\Modules\NewsRadar\Enums\ContentSource;
use App\Modules\NewsRadar\Enums\EnrichmentStatus;
use App\Modules\NewsRadar\Enums\ExtractionStatus;
use App\Modules\NewsRadar\Enums\PublishedAtSource;
use App\Modules\NewsRadar\Models\NewsItem;
use App\Modules\NewsRadar\Models\NewsItemAiLog;
use App\Modules\NewsRadar\Models\NewsItemAiMetadata;
use App\Modules\NewsRadar\Models\NewsSource;
use App\Modules\NewsRadar\Models\NewsTheme;
use App\Modules\NewsRadar\Services\AiEnrichmentService;
use GuzzleHttp\Psr7\Response;
use Illuminate\Foundation\Testing\RefreshDatabase;
use OpenAI\Exceptions\ErrorException as OpenAiErrorException;
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

function makeOpenAiErrorException(int $statusCode, string $message, int|string|null $code = null): OpenAiErrorException
{
    return new OpenAiErrorException(
        contents: [
            'message' => $message,
            'code' => $code,
        ],
        response: new Response($statusCode, ['content-type' => 'application/json'], json_encode([
            'error' => [
                'message' => $message,
                'code' => $code,
            ],
        ], JSON_THROW_ON_ERROR)),
    );
}

test('classification retries the same model with prompt json when structured outputs are unsupported', function () {
    config()->set('news_radar.ai.classification_model', 'z-ai/glm-4.5-air:free');
    config()->set('news_radar.ai.classification_fallback_models', ['nvidia/nemotron-3-nano-30b-a3b:free']);
    config()->set('news_radar.ai.disable_reasoning_on_prompt_json_models', ['z-ai/glm-4.5-air:free']);

    NewsTheme::create([
        'slug' => 'meio_ambiente',
        'label' => 'Meio Ambiente',
        'active' => true,
    ]);

    $fake = OpenAI::fake([
        makeOpenAiErrorException(
            404,
            'No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection',
            404,
        ),
        CreateResponse::fake([
            'model' => 'z-ai/glm-4.5-air:free',
            'choices' => [
                [
                    'message' => [
                        'content' => "```json\n".json_encode([
                            'city' => 'Tijucas',
                            'state_abbr' => 'SC',
                            'theme' => 'meio_ambiente',
                            'urgency' => 'media',
                            'relevance_score' => 0.82,
                            'entities' => [
                                ['type' => 'organizacao', 'name' => 'Defesa Civil'],
                            ],
                        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE)."\n```",
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
    expect($metadata->ai_model_used)->toBe('z-ai/glm-4.5-air:free');

    $logs = NewsItemAiLog::where('news_item_id', $item->id)
        ->orderBy('id')
        ->get();

    expect($logs)->toHaveCount(2);
    expect($logs[0]->status)->toBe('failed');
    expect($logs[0]->meta_json['strategy'])->toBe('structured_outputs');
    expect($logs[0]->meta_json['category'])->toBe('unsupported_parameters');
    expect($logs[0]->meta_json['next_action'])->toBe('retry_same_model_prompt_json');
    expect($logs[1]->status)->toBe('success');
    expect($logs[1]->meta_json['strategy'])->toBe('prompt_json');

    $fake->assertSent(Chat::class, 2);
    $fake->assertSent(Chat::class, fn (string $method, array $parameters): bool => $method === 'create'
        && $parameters['model'] === 'z-ai/glm-4.5-air:free'
        && isset($parameters['response_format']));
    $fake->assertSent(Chat::class, fn (string $method, array $parameters): bool => $method === 'create'
        && $parameters['model'] === 'z-ai/glm-4.5-air:free'
        && ! isset($parameters['response_format'])
        && ($parameters['reasoning']['effort'] ?? null) === 'none');
});

test('classification falls back to the next model when the primary model is unavailable', function () {
    config()->set('news_radar.ai.classification_model', 'openai/gpt-oss-20b:free');
    config()->set('news_radar.ai.classification_fallback_models', ['arcee-ai/trinity-large-preview:free']);

    NewsTheme::create([
        'slug' => 'outro',
        'label' => 'Outro',
        'active' => true,
    ]);

    OpenAI::fake([
        makeOpenAiErrorException(
            404,
            'No endpoints available matching your guardrail restrictions and data policy.',
            404,
        ),
        CreateResponse::fake([
            'model' => 'arcee-ai/trinity-large-preview:free',
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'city' => 'Blumenau',
                            'state_abbr' => 'SC',
                            'theme' => 'alerta',
                            'urgency' => 'alta',
                            'relevance_score' => 4,
                            'entities' => [
                                ['type' => 'organizacao', 'name' => 'Defesa Civil'],
                            ],
                        ], JSON_THROW_ON_ERROR),
                    ],
                ],
            ],
            'usage' => [
                'prompt_tokens' => 60,
                'completion_tokens' => 30,
                'total_tokens' => 90,
            ],
        ]),
    ]);

    $service = app(AiEnrichmentService::class);
    $item = makeAiTestItem(makeAiTestSource());

    $service->classifyBasic($item);

    $metadata = NewsItemAiMetadata::where('news_item_id', $item->id)->firstOrFail();

    expect($metadata->ai_model_used)->toBe('arcee-ai/trinity-large-preview:free');
    expect($metadata->relevance_score)->toBe(0.4);
    expect($metadata->news_theme_id)->not->toBeNull();

    $logs = NewsItemAiLog::where('news_item_id', $item->id)
        ->orderBy('id')
        ->get();

    expect($logs)->toHaveCount(2);
    expect($logs[0]->model)->toBe('openai/gpt-oss-20b:free');
    expect($logs[0]->meta_json['category'])->toBe('model_unavailable');
    expect($logs[0]->meta_json['next_action'])->toBe('fallback_next_model');
    expect($logs[1]->model)->toBe('arcee-ai/trinity-large-preview:free');
    expect($logs[1]->status)->toBe('success');
});

test('editorial enrichment uses its configured model and stores the success log', function () {
    config()->set('news_radar.ai.classification_model', 'z-ai/glm-4.5-air:free');
    config()->set('news_radar.ai.editorial_model', 'arcee-ai/trinity-large-preview:free');
    config()->set('news_radar.ai.editorial_fallback_models', ['nvidia/nemotron-3-nano-30b-a3b:free']);

    $fake = OpenAI::fake([
        CreateResponse::fake([
            'model' => 'arcee-ai/trinity-large-preview:free',
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
        'ai_model_used' => 'z-ai/glm-4.5-air:free',
        'ai_tokens_used' => 75,
        'enrichment_level' => 'level_1',
    ]);

    $service = app(AiEnrichmentService::class);
    $service->enrichEditorial($item);

    $metadata = NewsItemAiMetadata::where('news_item_id', $item->id)->firstOrFail();

    expect($metadata->ai_model_used)->toBe('arcee-ai/trinity-large-preview:free');
    expect($metadata->ai_tokens_used)->toBe(175);
    expect($metadata->enrichment_level)->toBe('level_2');
    expect(NewsItemAiLog::where('news_item_id', $item->id)->count())->toBe(1);

    $fake->assertSent(Chat::class, fn (string $method, array $parameters): bool => $method === 'create'
        && $parameters['model'] === 'arcee-ai/trinity-large-preview:free');
});
