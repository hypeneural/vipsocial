<?php

namespace App\Modules\NewsRadar\Services;

use App\Modules\NewsRadar\Exceptions\AiRequestException;
use App\Modules\NewsRadar\Models\NewsItem;
use App\Modules\NewsRadar\Models\NewsItemAiLog;
use App\Modules\NewsRadar\Models\NewsItemAiMetadata;
use App\Modules\NewsRadar\Models\NewsTheme;
use OpenAI\Laravel\Facades\OpenAI;
use OpenAI\Responses\Chat\CreateResponse;

class AiEnrichmentService
{
    private const STRATEGY_STRUCTURED_OUTPUTS = 'structured_outputs';
    private const STRATEGY_PROMPT_JSON = 'prompt_json';
    private const CLASSIFICATION_THEME_SLUGS = [
        'politica',
        'policia',
        'esporte',
        'economia',
        'saude',
        'educacao',
        'cultura',
        'tecnologia',
        'meio_ambiente',
        'transporte',
        'sociedade',
        'internacional',
        'outro',
    ];
    private const EDITORIAL_FIVE_W_KEYS = ['who', 'what', 'where', 'when', 'why', 'how'];

    public function classifyBasic(NewsItem $item): AiClassificationResult
    {
        $execution = $this->executeStage(
            item: $item,
            stage: 'classification',
            userInput: $this->buildClassificationInput($item),
            systemPrompt: $this->classificationSystemPrompt(),
            schemaName: 'news_classification',
            schema: $this->classificationJsonSchema(),
            modelSequence: $this->classificationModelSequence(),
            temperature: 0.1,
            maxTokens: 1000,
            normalizer: fn (array $data, string $model, string $strategy): array => $this->normalizeClassificationData(
                $data,
                stage: 'classification',
                model: $model,
                strategy: $strategy,
            ),
        );

        $data = $execution->data;

        $themeId = null;
        if (! empty($data['theme'])) {
            $theme = NewsTheme::where('slug', $data['theme'])->first();
            $themeId = $theme?->id;
        }

        $metadata = NewsItemAiMetadata::updateOrCreate(
            ['news_item_id' => $item->id],
            [
                'city' => $data['city'],
                'state_abbr' => $data['state_abbr'],
                'news_theme_id' => $themeId,
                'urgency' => $data['urgency'],
                'relevance_score' => $data['relevance_score'],
                'entities' => $data['entities'],
                'ai_model_used' => $execution->model,
                'ai_tokens_used' => $execution->tokensUsed,
                'enrichment_level' => 'level_1',
            ]
        );

        return new AiClassificationResult(
            success: true,
            metadata: $metadata,
            relevanceScore: $data['relevance_score'],
            tokensUsed: $execution->tokensUsed,
            model: $execution->model,
        );
    }

    public function enrichEditorial(NewsItem $item): AiEnrichmentResult
    {
        $execution = $this->executeStage(
            item: $item,
            stage: 'editorial',
            userInput: $this->buildEnrichmentInput($item),
            systemPrompt: $this->enrichmentSystemPrompt(),
            schemaName: 'news_enrichment',
            schema: $this->enrichmentJsonSchema(),
            modelSequence: $this->editorialModelSequence(),
            temperature: 0.3,
            maxTokens: 2000,
            normalizer: fn (array $data, string $model, string $strategy): array => $this->normalizeEditorialData(
                $data,
                stage: 'editorial',
                model: $model,
                strategy: $strategy,
            ),
        );

        $data = $execution->data;

        $metadata = NewsItemAiMetadata::where('news_item_id', $item->id)->first();
        if ($metadata) {
            $metadata->update([
                'five_ws' => $data['five_ws'],
                'suggested_titles' => $data['suggested_titles'],
                'summary_bullets' => $data['summary_bullets'],
                'enrichment_level' => 'level_2',
                'ai_model_used' => $execution->model,
                'ai_tokens_used' => ($metadata->ai_tokens_used ?? 0) + $execution->tokensUsed,
            ]);
        }

        return new AiEnrichmentResult(
            success: true,
            metadata: $metadata,
            tokensUsed: $execution->tokensUsed,
            model: $execution->model,
        );
    }

    public function classificationModel(): string
    {
        return $this->classificationModelSequence()[0];
    }

    public function editorialModel(): string
    {
        return $this->editorialModelSequence()[0];
    }

    public function classificationModelSequence(): array
    {
        return $this->buildModelSequence(
            primary: (string) config('news_radar.ai.classification_model', 'z-ai/glm-4.5-air:free'),
            fallbacks: (array) config('news_radar.ai.classification_fallback_models', []),
        );
    }

    public function editorialModelSequence(): array
    {
        return $this->buildModelSequence(
            primary: (string) config('news_radar.ai.editorial_model', 'arcee-ai/trinity-large-preview:free'),
            fallbacks: (array) config('news_radar.ai.editorial_fallback_models', []),
        );
    }

    /**
     * @param  callable(array, string, string): array  $normalizer
     */
    private function executeStage(
        NewsItem $item,
        string $stage,
        string $userInput,
        string $systemPrompt,
        string $schemaName,
        array $schema,
        array $modelSequence,
        float $temperature,
        int $maxTokens,
        callable $normalizer,
    ): AiStageExecutionResult {
        $attempt = 0;
        $finalException = null;
        $modelsCount = count($modelSequence);

        foreach ($modelSequence as $model) {
            $attempt++;

            try {
                return $this->performAttempt(
                    item: $item,
                    stage: $stage,
                    model: $model,
                    attempt: $attempt,
                    strategy: self::STRATEGY_STRUCTURED_OUTPUTS,
                    systemPrompt: $systemPrompt,
                    userInput: $userInput,
                    schemaName: $schemaName,
                    schema: $schema,
                    temperature: $temperature,
                    maxTokens: $maxTokens,
                    normalizer: $normalizer,
                    modelsCount: $modelsCount,
                );
            } catch (AiRequestException $exception) {
                $finalException = $exception;

                if ($this->shouldRetrySameModelWithPromptJson($exception)) {
                    try {
                        return $this->performAttempt(
                            item: $item,
                            stage: $stage,
                            model: $model,
                            attempt: $attempt,
                            strategy: self::STRATEGY_PROMPT_JSON,
                            systemPrompt: $this->buildPromptJsonSystemPrompt($systemPrompt, $schema),
                            userInput: $userInput,
                            schemaName: $schemaName,
                            schema: $schema,
                            temperature: $temperature,
                            maxTokens: $maxTokens,
                            normalizer: $normalizer,
                            modelsCount: $modelsCount,
                        );
                    } catch (AiRequestException $promptJsonException) {
                        $finalException = $promptJsonException;

                        if ($promptJsonException->fallbackable) {
                            continue;
                        }

                        throw $promptJsonException;
                    }
                }

                if ($exception->fallbackable) {
                    continue;
                }

                throw $exception;
            }
        }

        if ($finalException instanceof AiRequestException) {
            throw $finalException;
        }

        throw new AiRequestException(
            stage: $stage,
            model: $modelSequence[0] ?? 'modelo_nao_configurado',
            message: 'Todos os modelos configurados falharam antes de retornar uma resposta valida.',
            category: 'all_models_failed',
            fallbackable: false,
            queueRetryable: false,
        );
    }

    /**
     * @param  callable(array, string, string): array  $normalizer
     */
    private function performAttempt(
        NewsItem $item,
        string $stage,
        string $model,
        int $attempt,
        string $strategy,
        string $systemPrompt,
        string $userInput,
        string $schemaName,
        array $schema,
        float $temperature,
        int $maxTokens,
        callable $normalizer,
        int $modelsCount,
    ): AiStageExecutionResult {
        try {
            $response = $this->createChatCompletion(
                stage: $stage,
                model: $model,
                strategy: $strategy,
                messages: [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userInput],
                ],
                schemaName: $schemaName,
                schema: $schema,
                temperature: $temperature,
                maxTokens: $maxTokens,
            );

            $content = $this->extractResponseContent($response, $stage, $model, $strategy);
            $decoded = $this->decodeJsonContent($content, $stage, $model, $strategy);
            $data = $normalizer($decoded, $model, $strategy);
            $tokensUsed = (int) ($response->usage?->totalTokens ?? 0);

            NewsItemAiLog::recordSuccess(
                item: $item,
                stage: $stage,
                model: $model,
                tokensUsed: $tokensUsed,
                meta: array_filter([
                    'attempt' => $attempt,
                    'strategy' => $strategy,
                    'models_considered' => $modelsCount,
                    'provider_request_id' => $response->meta()->requestId,
                    'provider_processing_ms' => $response->meta()->openai->processingMs,
                ], static fn (mixed $value): bool => $value !== null),
            );

            return new AiStageExecutionResult(
                success: true,
                model: $model,
                strategy: $strategy,
                tokensUsed: $tokensUsed,
                data: $data,
            );
        } catch (\Throwable $throwable) {
            $exception = $throwable instanceof AiRequestException
                ? $throwable
                : AiRequestException::fromThrowable(
                    stage: $stage,
                    model: $model,
                    throwable: $throwable,
                    context: ['strategy' => $strategy],
                );

            $hasMoreModels = $attempt < $modelsCount;
            $nextAction = $this->resolveNextAction($exception, $strategy, $hasMoreModels);

            NewsItemAiLog::recordFailure(
                item: $item,
                stage: $stage,
                model: $model,
                throwable: $exception,
                meta: array_filter([
                    'attempt' => $attempt,
                    'strategy' => $strategy,
                    'models_considered' => $modelsCount,
                    'category' => $exception->category,
                    'fallbackable' => $exception->fallbackable,
                    'queue_retryable' => $exception->queueRetryable,
                    'next_action' => $nextAction,
                ], static fn (mixed $value): bool => $value !== null),
            );

            throw $exception;
        }
    }

    private function createChatCompletion(
        string $stage,
        string $model,
        string $strategy,
        array $messages,
        string $schemaName,
        array $schema,
        float $temperature,
        int $maxTokens,
    ): CreateResponse {
        $payload = [
            'model' => $model,
            'messages' => $messages,
            'temperature' => $temperature,
            'max_tokens' => $maxTokens,
        ];

        if ($strategy === self::STRATEGY_STRUCTURED_OUTPUTS) {
            $payload['response_format'] = [
                'type' => 'json_schema',
                'json_schema' => [
                    'name' => $schemaName,
                    'strict' => true,
                    'schema' => $schema,
                ],
            ];
        }

        if ($strategy === self::STRATEGY_PROMPT_JSON && $this->shouldDisableReasoningOnPromptJson($model)) {
            $payload['reasoning'] = [
                'effort' => 'none',
                'exclude' => true,
            ];
        }

        try {
            return OpenAI::chat()->create($payload);
        } catch (\Throwable $throwable) {
            throw AiRequestException::fromThrowable(
                stage: $stage,
                model: $model,
                throwable: $throwable,
                context: [
                    'strategy' => $strategy,
                    'reasoning_override' => $strategy === self::STRATEGY_PROMPT_JSON && $this->shouldDisableReasoningOnPromptJson($model)
                        ? 'disabled'
                        : 'default',
                ],
            );
        }
    }

    private function extractResponseContent(
        CreateResponse $response,
        string $stage,
        string $model,
        string $strategy,
    ): string {
        $message = $response->choices[0]->message ?? null;
        $content = $message?->content ?? null;

        if (is_string($content) && trim($content) !== '') {
            return $content;
        }

        throw new AiRequestException(
            stage: $stage,
            model: $model,
            message: 'Resposta vazia da IA.',
            context: array_filter([
                'strategy' => $strategy,
                'reasoning_excerpt' => $message?->reasoningContent
                    ? mb_substr($message->reasoningContent, 0, 1000)
                    : null,
            ], static fn (mixed $value): bool => $value !== null && $value !== ''),
            category: 'empty_response',
            fallbackable: true,
            queueRetryable: false,
            strategy: $strategy,
        );
    }

    private function decodeJsonContent(
        string $content,
        string $stage,
        string $model,
        string $strategy,
    ): array {
        $candidate = $this->extractJsonCandidate($content);

        try {
            $decoded = json_decode($candidate, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $exception) {
            throw new AiRequestException(
                stage: $stage,
                model: $model,
                message: 'Resposta JSON invalida da IA.',
                context: [
                    'strategy' => $strategy,
                    'raw_content_body' => $content,
                    'raw_content_excerpt' => mb_substr($content, 0, 1200),
                ],
                category: 'invalid_json',
                fallbackable: true,
                queueRetryable: false,
                strategy: $strategy,
                previous: $exception,
            );
        }

        if (! is_array($decoded)) {
            throw new AiRequestException(
                stage: $stage,
                model: $model,
                message: 'Resposta da IA nao retornou um objeto JSON valido.',
                context: [
                    'strategy' => $strategy,
                    'raw_content_body' => $content,
                    'raw_content_excerpt' => mb_substr($content, 0, 1200),
                ],
                category: 'invalid_json',
                fallbackable: true,
                queueRetryable: false,
                strategy: $strategy,
            );
        }

        return $decoded;
    }

    private function buildClassificationInput(NewsItem $item): string
    {
        $parts = [];
        $parts[] = "TITULO: {$item->title}";

        if ($item->excerpt) {
            $parts[] = "RESUMO: {$item->excerpt}";
        }

        if ($item->body_text) {
            $parts[] = 'CORPO (primeiros 2000 chars): '.mb_substr($item->body_text, 0, 2000);
        }

        if ($item->source) {
            $parts[] = "FONTE: {$item->source->name}";
        }

        return implode("\n\n", $parts);
    }

    private function buildEnrichmentInput(NewsItem $item): string
    {
        $parts = [];
        $parts[] = "TITULO: {$item->title}";

        if ($item->subtitle) {
            $parts[] = "SUBTITULO: {$item->subtitle}";
        }

        if ($item->body_text) {
            $parts[] = "CORPO COMPLETO:\n".mb_substr($item->body_text, 0, 5000);
        }

        if ($item->author_normalized) {
            $parts[] = "AUTOR: {$item->author_normalized}";
        }

        return implode("\n\n", $parts);
    }

    private function classificationSystemPrompt(): string
    {
        return <<<'PROMPT'
Voce e um classificador de noticias para uma redacao jornalistica em Santa Catarina, Brasil.
Analise a noticia e responda somente com um objeto JSON compativel com o schema solicitado.

Regras:
- `city`: cidade principal mencionada na noticia. Se nao identificavel, null.
- `state_abbr`: sigla do estado (2 letras). Se nao identificavel, null.
- `theme`: escolha obrigatoriamente uma destas opcoes: politica, policia, esporte, economia, saude, educacao, cultura, tecnologia, meio_ambiente, transporte, sociedade, internacional, outro.
- `urgency`: "baixa" (informativo), "media" (relevante), "alta" (urgente/breaking news).
- `relevance_score`: numero decimal entre 0.0 e 1.0.
- `entities`: lista de entidades mencionadas ({type: "pessoa"|"organizacao"|"local"|"evento", name: string}).
- Nunca responda em markdown.
PROMPT;
    }

    private function enrichmentSystemPrompt(): string
    {
        return <<<'PROMPT'
Voce e um assistente editorial para uma redacao jornalistica. Analise a noticia e produza conteudo editorial auxiliar.
Responda somente com um objeto JSON compativel com o schema solicitado, sem markdown.

Regras:
- `five_ws`: extraia Quem, O que, Onde, Quando, Por que, Como da noticia. Cada campo e uma string curta ou null.
- `suggested_titles`: gere exatamente 3 titulos alternativos para a mesma noticia.
- `summary_bullets`: gere de 3 a 5 bullets resumindo os pontos principais da noticia. Cada bullet e uma frase curta.
PROMPT;
    }

    private function classificationJsonSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'city' => ['type' => ['string', 'null']],
                'state_abbr' => ['type' => ['string', 'null']],
                'theme' => ['type' => 'string', 'enum' => self::CLASSIFICATION_THEME_SLUGS],
                'urgency' => ['type' => 'string', 'enum' => ['baixa', 'media', 'alta']],
                'relevance_score' => ['type' => 'number', 'minimum' => 0, 'maximum' => 1],
                'entities' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'type' => ['type' => 'string', 'enum' => ['pessoa', 'organizacao', 'local', 'evento']],
                            'name' => ['type' => 'string'],
                        ],
                        'required' => ['type', 'name'],
                        'additionalProperties' => false,
                    ],
                ],
            ],
            'required' => ['city', 'state_abbr', 'theme', 'urgency', 'relevance_score', 'entities'],
            'additionalProperties' => false,
        ];
    }

    private function enrichmentJsonSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'five_ws' => [
                    'type' => 'object',
                    'properties' => [
                        'who' => ['type' => ['string', 'null']],
                        'what' => ['type' => ['string', 'null']],
                        'where' => ['type' => ['string', 'null']],
                        'when' => ['type' => ['string', 'null']],
                        'why' => ['type' => ['string', 'null']],
                        'how' => ['type' => ['string', 'null']],
                    ],
                    'required' => self::EDITORIAL_FIVE_W_KEYS,
                    'additionalProperties' => false,
                ],
                'suggested_titles' => [
                    'type' => 'array',
                    'minItems' => 3,
                    'maxItems' => 3,
                    'items' => ['type' => 'string'],
                ],
                'summary_bullets' => [
                    'type' => 'array',
                    'minItems' => 3,
                    'maxItems' => 5,
                    'items' => ['type' => 'string'],
                ],
            ],
            'required' => ['five_ws', 'suggested_titles', 'summary_bullets'],
            'additionalProperties' => false,
        ];
    }

    private function buildModelSequence(string $primary, array $fallbacks): array
    {
        $models = array_filter([
            trim($primary),
            ...array_map(static fn (mixed $model): string => trim((string) $model), $fallbacks),
        ], static fn (string $model): bool => $model !== '');

        return array_values(array_unique($models));
    }

    private function buildPromptJsonSystemPrompt(string $basePrompt, array $schema): string
    {
        return $basePrompt."\n\n"
            .'Saida obrigatoria:'."\n"
            .'- responda SOMENTE com JSON valido, sem explicacoes, sem markdown e sem blocos ```.'."\n"
            .'- respeite exatamente os nomes das chaves do schema abaixo.'."\n"
            .'- se algum valor nao estiver disponivel, use null quando permitido.'."\n\n"
            .'Schema de referencia:'."\n"
            .json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    }

    private function shouldRetrySameModelWithPromptJson(AiRequestException $exception): bool
    {
        return $exception->category === 'unsupported_parameters'
            && $exception->strategy === self::STRATEGY_STRUCTURED_OUTPUTS;
    }

    private function shouldDisableReasoningOnPromptJson(string $model): bool
    {
        $configured = array_map(
            static fn (mixed $entry): string => trim((string) $entry),
            (array) config('news_radar.ai.disable_reasoning_on_prompt_json_models', []),
        );

        return in_array($model, $configured, true);
    }

    private function resolveNextAction(
        AiRequestException $exception,
        string $strategy,
        bool $hasMoreModels,
    ): string {
        if ($this->shouldRetrySameModelWithPromptJson($exception)) {
            return 'retry_same_model_prompt_json';
        }

        if ($exception->fallbackable && $hasMoreModels) {
            return 'fallback_next_model';
        }

        if ($exception->queueRetryable) {
            return 'queue_retry';
        }

        return $strategy === self::STRATEGY_PROMPT_JSON ? 'abort_after_prompt_json' : 'abort';
    }

    private function extractJsonCandidate(string $content): string
    {
        $trimmed = trim($content);

        if (preg_match('/^```(?:json)?\s*(.+?)\s*```$/is', $trimmed, $matches) === 1) {
            return trim($matches[1]);
        }

        $firstBrace = strpos($trimmed, '{');
        $lastBrace = strrpos($trimmed, '}');

        if ($firstBrace !== false && $lastBrace !== false && $lastBrace > $firstBrace) {
            return trim(substr($trimmed, $firstBrace, $lastBrace - $firstBrace + 1));
        }

        return $trimmed;
    }

    private function normalizeClassificationData(
        array $data,
        string $stage,
        string $model,
        string $strategy,
    ): array {
        foreach (['city', 'state_abbr', 'theme', 'urgency', 'relevance_score', 'entities'] as $requiredField) {
            if (! array_key_exists($requiredField, $data)) {
                throw $this->invalidShapeException(
                    stage: $stage,
                    model: $model,
                    strategy: $strategy,
                    message: "Resposta da IA nao trouxe o campo obrigatorio `{$requiredField}`.",
                    rawData: $data,
                );
            }
        }

        $theme = $this->normalizeThemeSlug($data['theme'] ?? null);
        $urgency = $this->normalizeUrgency($data['urgency'] ?? null);
        $relevanceScore = $this->normalizeRelevanceScore($data['relevance_score'] ?? null);

        if ($urgency === null || $relevanceScore === null) {
            throw $this->invalidShapeException(
                stage: $stage,
                model: $model,
                strategy: $strategy,
                message: 'Resposta da IA retornou classificacao fora do formato esperado.',
                rawData: $data,
            );
        }

        return [
            'city' => $this->normalizeNullableString($data['city'] ?? null),
            'state_abbr' => $this->normalizeStateAbbr($data['state_abbr'] ?? null),
            'theme' => $theme,
            'urgency' => $urgency,
            'relevance_score' => $relevanceScore,
            'entities' => $this->normalizeEntities($data['entities'] ?? []),
        ];
    }

    private function normalizeEditorialData(
        array $data,
        string $stage,
        string $model,
        string $strategy,
    ): array {
        foreach (['five_ws', 'suggested_titles', 'summary_bullets'] as $requiredField) {
            if (! array_key_exists($requiredField, $data)) {
                throw $this->invalidShapeException(
                    stage: $stage,
                    model: $model,
                    strategy: $strategy,
                    message: "Resposta da IA nao trouxe o campo obrigatorio `{$requiredField}`.",
                    rawData: $data,
                );
            }
        }

        if (! is_array($data['five_ws'])) {
            throw $this->invalidShapeException(
                stage: $stage,
                model: $model,
                strategy: $strategy,
                message: 'Resposta da IA retornou `five_ws` em formato invalido.',
                rawData: $data,
            );
        }

        $fiveWs = [];
        foreach (self::EDITORIAL_FIVE_W_KEYS as $key) {
            if (! array_key_exists($key, $data['five_ws'])) {
                throw $this->invalidShapeException(
                    stage: $stage,
                    model: $model,
                    strategy: $strategy,
                    message: "Resposta da IA nao trouxe `five_ws.{$key}`.",
                    rawData: $data,
                );
            }

            $fiveWs[$key] = $this->normalizeNullableString($data['five_ws'][$key]);
        }

        $suggestedTitles = $this->normalizeStringList($data['suggested_titles'] ?? []);
        $summaryBullets = $this->normalizeStringList($data['summary_bullets'] ?? []);

        if (count($suggestedTitles) < 3 || count($summaryBullets) < 3) {
            throw $this->invalidShapeException(
                stage: $stage,
                model: $model,
                strategy: $strategy,
                message: 'Resposta da IA retornou listas editoriais incompletas.',
                rawData: $data,
            );
        }

        return [
            'five_ws' => $fiveWs,
            'suggested_titles' => array_slice($suggestedTitles, 0, 3),
            'summary_bullets' => array_slice($summaryBullets, 0, 5),
        ];
    }

    private function invalidShapeException(
        string $stage,
        string $model,
        string $strategy,
        string $message,
        array $rawData,
    ): AiRequestException {
        return new AiRequestException(
            stage: $stage,
            model: $model,
            message: $message,
            context: [
                'strategy' => $strategy,
                'raw_data' => $rawData,
                'raw_data_excerpt' => mb_substr(
                    json_encode($rawData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '',
                    0,
                    1200
                ),
            ],
            category: 'invalid_response_shape',
            fallbackable: true,
            queueRetryable: false,
            strategy: $strategy,
        );
    }

    private function normalizeThemeSlug(mixed $value): string
    {
        $theme = $this->normalizeNullableString($value);
        if ($theme === null) {
            return 'outro';
        }

        $normalized = str_replace([' ', '-'], '_', mb_strtolower($theme));

        return in_array($normalized, self::CLASSIFICATION_THEME_SLUGS, true)
            ? $normalized
            : 'outro';
    }

    private function normalizeUrgency(mixed $value): ?string
    {
        $urgency = $this->normalizeNullableString($value);
        if ($urgency === null) {
            return null;
        }

        $normalized = str_replace(
            ['média', 'médio', 'medio'],
            ['media', 'media', 'media'],
            mb_strtolower($urgency),
        );

        return in_array($normalized, ['baixa', 'media', 'alta'], true)
            ? $normalized
            : null;
    }

    private function normalizeRelevanceScore(mixed $value): ?float
    {
        if (! is_numeric($value)) {
            return null;
        }

        $score = (float) $value;

        if ($score < 0) {
            return null;
        }

        if ($score <= 1) {
            return round($score, 4);
        }

        if ($score <= 10) {
            return round($score / 10, 4);
        }

        if ($score <= 100) {
            return round($score / 100, 4);
        }

        return null;
    }

    private function normalizeEntities(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $entities = [];
        foreach ($value as $entity) {
            if (! is_array($entity)) {
                continue;
            }

            $type = $this->normalizeNullableString($entity['type'] ?? null);
            $name = $this->normalizeNullableString($entity['name'] ?? null);

            if (! $type || ! $name) {
                continue;
            }

            if (! in_array($type, ['pessoa', 'organizacao', 'local', 'evento'], true)) {
                continue;
            }

            $entities[] = [
                'type' => $type,
                'name' => $name,
            ];
        }

        return array_values(array_unique($entities, SORT_REGULAR));
    }

    private function normalizeStringList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $items = array_map(
            fn (mixed $entry): ?string => $this->normalizeNullableString($entry),
            $value,
        );

        return array_values(array_unique(array_filter($items)));
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        if (! is_scalar($value)) {
            return null;
        }

        $normalized = trim((string) $value);

        return $normalized !== '' ? $normalized : null;
    }

    private function normalizeStateAbbr(mixed $value): ?string
    {
        $normalized = $this->normalizeNullableString($value);
        if ($normalized === null) {
            return null;
        }

        $abbr = mb_strtoupper($normalized);

        return preg_match('/^[A-Z]{2}$/', $abbr) === 1 ? $abbr : null;
    }
}

class AiStageExecutionResult
{
    public function __construct(
        public readonly bool $success,
        public readonly string $model,
        public readonly string $strategy,
        public readonly int $tokensUsed,
        public readonly array $data,
    ) {}
}

class AiClassificationResult
{
    public function __construct(
        public readonly bool $success,
        public readonly ?NewsItemAiMetadata $metadata,
        public readonly float $relevanceScore,
        public readonly int $tokensUsed,
        public readonly string $model,
    ) {}
}

class AiEnrichmentResult
{
    public function __construct(
        public readonly bool $success,
        public readonly ?NewsItemAiMetadata $metadata,
        public readonly int $tokensUsed,
        public readonly string $model,
    ) {}
}
