<?php

namespace App\Modules\NewsRadar\Services;

use App\Modules\NewsRadar\Models\NewsItem;
use App\Modules\NewsRadar\Models\NewsItemAiMetadata;
use App\Modules\NewsRadar\Models\NewsTheme;
use OpenAI\Laravel\Facades\OpenAI;

class AiEnrichmentService
{
    private string $defaultModel = 'gpt-4o-mini';

    /**
     * Level 1 — Basic classification: city, theme, urgency, entities, relevance.
     */
    public function classifyBasic(NewsItem $item): AiClassificationResult
    {
        $textInput = $this->buildClassificationInput($item);

        $response = OpenAI::chat()->create([
            'model' => $this->defaultModel,
            'messages' => [
                ['role' => 'system', 'content' => $this->classificationSystemPrompt()],
                ['role' => 'user', 'content' => $textInput],
            ],
            'response_format' => [
                'type' => 'json_schema',
                'json_schema' => [
                    'name' => 'news_classification',
                    'strict' => true,
                    'schema' => $this->classificationJsonSchema(),
                ],
            ],
            'temperature' => 0.1,
            'max_tokens' => 1000,
        ]);

        $content = $response->choices[0]->message->content;
        $data = json_decode($content, true);
        $tokensUsed = $response->usage->totalTokens;

        // Resolve theme FK
        $themeId = null;
        if (!empty($data['theme'])) {
            $theme = NewsTheme::where('slug', $data['theme'])->first();
            $themeId = $theme?->id;
        }

        // Save to news_item_ai_metadata
        $metadata = NewsItemAiMetadata::updateOrCreate(
            ['news_item_id' => $item->id],
            [
                'city' => $data['city'] ?? null,
                'state_abbr' => $data['state_abbr'] ?? null,
                'news_theme_id' => $themeId,
                'urgency' => $data['urgency'] ?? null,
                'relevance_score' => $data['relevance_score'] ?? 0,
                'entities' => $data['entities'] ?? [],
                'ai_model_used' => $this->defaultModel,
                'ai_tokens_used' => $tokensUsed,
                'enrichment_level' => 'level_1',
            ]
        );

        return new AiClassificationResult(
            success: true,
            metadata: $metadata,
            relevanceScore: $data['relevance_score'] ?? 0,
            tokensUsed: $tokensUsed,
        );
    }

    /**
     * Level 2 — Editorial enrichment: 5W1H, suggested titles, summary bullets.
     */
    public function enrichEditorial(NewsItem $item): AiEnrichmentResult
    {
        $textInput = $this->buildEnrichmentInput($item);

        $response = OpenAI::chat()->create([
            'model' => $this->defaultModel,
            'messages' => [
                ['role' => 'system', 'content' => $this->enrichmentSystemPrompt()],
                ['role' => 'user', 'content' => $textInput],
            ],
            'response_format' => [
                'type' => 'json_schema',
                'json_schema' => [
                    'name' => 'news_enrichment',
                    'strict' => true,
                    'schema' => $this->enrichmentJsonSchema(),
                ],
            ],
            'temperature' => 0.3,
            'max_tokens' => 2000,
        ]);

        $content = $response->choices[0]->message->content;
        $data = json_decode($content, true);
        $tokensUsed = $response->usage->totalTokens;

        // Update existing metadata
        $metadata = NewsItemAiMetadata::where('news_item_id', $item->id)->first();
        if ($metadata) {
            $metadata->update([
                'five_ws' => $data['five_ws'] ?? null,
                'suggested_titles' => $data['suggested_titles'] ?? [],
                'summary_bullets' => $data['summary_bullets'] ?? [],
                'enrichment_level' => 'level_2',
                'ai_tokens_used' => ($metadata->ai_tokens_used ?? 0) + $tokensUsed,
            ]);
        }

        return new AiEnrichmentResult(
            success: true,
            metadata: $metadata,
            tokensUsed: $tokensUsed,
        );
    }

    // ── Input builders ─────────────────────────────

    private function buildClassificationInput(NewsItem $item): string
    {
        $parts = [];
        $parts[] = "TÍTULO: {$item->title}";
        if ($item->excerpt) {
            $parts[] = "RESUMO: {$item->excerpt}";
        }
        if ($item->body_text) {
            $parts[] = "CORPO (primeiros 2000 chars): " . mb_substr($item->body_text, 0, 2000);
        }
        if ($item->source) {
            $parts[] = "FONTE: {$item->source->name}";
        }
        return implode("\n\n", $parts);
    }

    private function buildEnrichmentInput(NewsItem $item): string
    {
        $parts = [];
        $parts[] = "TÍTULO: {$item->title}";
        if ($item->subtitle) {
            $parts[] = "SUBTÍTULO: {$item->subtitle}";
        }
        if ($item->body_text) {
            $parts[] = "CORPO COMPLETO:\n" . mb_substr($item->body_text, 0, 5000);
        }
        if ($item->author_normalized) {
            $parts[] = "AUTOR: {$item->author_normalized}";
        }
        return implode("\n\n", $parts);
    }

    // ── System prompts ─────────────────────────────

    private function classificationSystemPrompt(): string
    {
        return <<<'PROMPT'
Você é um classificador de notícias para uma redação jornalística em Santa Catarina, Brasil.
Analise a notícia e responda estritamente em JSON Schema.

Regras:
- `city`: cidade principal mencionada na notícia. Se não identificável, null.
- `state_abbr`: sigla do estado (2 letras). Se não identificável, null.
- `theme`: slug do tema editorial (politica, policia, esporte, economia, saude, educacao, cultura, tecnologia, meio_ambiente, transporte, sociedade, internacional, outro).
- `urgency`: "baixa" (informativo), "media" (relevante), "alta" (urgente/breaking news).
- `relevance_score`: 0.0 a 1.0. Considere: impacto na comunidade, atualidade, abrangência.
- `entities`: lista de entidades mencionadas ({type: "pessoa"|"organizacao"|"local"|"evento", name: string}).
PROMPT;
    }

    private function enrichmentSystemPrompt(): string
    {
        return <<<'PROMPT'
Você é um assistente editorial para uma redação jornalística. Analise a notícia e produza conteúdo editorial auxiliar.

Regras:
- `five_ws`: extraia Quem, O quê, Onde, Quando, Por quê, Como da notícia. Cada campo é uma string curta.
- `suggested_titles`: gere 3 títulos alternativos para a mesma notícia. Variando estilo (informativo, engajante, investigativo).
- `summary_bullets`: gere 3-5 bullet points resumindo os pontos principais da notícia. Cada bullet é uma frase curta.
PROMPT;
    }

    // ── JSON Schemas ───────────────────────────────

    private function classificationJsonSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'city' => ['type' => ['string', 'null']],
                'state_abbr' => ['type' => ['string', 'null']],
                'theme' => ['type' => 'string'],
                'urgency' => ['type' => 'string', 'enum' => ['baixa', 'media', 'alta']],
                'relevance_score' => ['type' => 'number'],
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
                    'required' => ['who', 'what', 'where', 'when', 'why', 'how'],
                    'additionalProperties' => false,
                ],
                'suggested_titles' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                ],
                'summary_bullets' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                ],
            ],
            'required' => ['five_ws', 'suggested_titles', 'summary_bullets'],
            'additionalProperties' => false,
        ];
    }
}

class AiClassificationResult
{
    public function __construct(
        public readonly bool $success,
        public readonly ?NewsItemAiMetadata $metadata,
        public readonly float $relevanceScore,
        public readonly int $tokensUsed,
    ) {}
}

class AiEnrichmentResult
{
    public function __construct(
        public readonly bool $success,
        public readonly ?NewsItemAiMetadata $metadata,
        public readonly int $tokensUsed,
    ) {}
}
