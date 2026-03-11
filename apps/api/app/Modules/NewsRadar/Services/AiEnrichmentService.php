<?php

namespace App\Modules\NewsRadar\Services;

use App\Modules\NewsRadar\Models\NewsItem;
use App\Modules\NewsRadar\Models\NewsItemAiMetadata;
use App\Modules\NewsRadar\Models\NewsTheme;
use OpenAI\Laravel\Facades\OpenAI;

class AiEnrichmentService
{
    /**
     * Level 1 - Basic classification: city, theme, urgency, entities, relevance.
     */
    public function classifyBasic(NewsItem $item): AiClassificationResult
    {
        $textInput = $this->buildClassificationInput($item);
        $model = $this->classificationModel();

        $response = OpenAI::chat()->create([
            'model' => $model,
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

        $themeId = null;
        if (! empty($data['theme'])) {
            $theme = NewsTheme::where('slug', $data['theme'])->first();
            $themeId = $theme?->id;
        }

        $metadata = NewsItemAiMetadata::updateOrCreate(
            ['news_item_id' => $item->id],
            [
                'city' => $data['city'] ?? null,
                'state_abbr' => $data['state_abbr'] ?? null,
                'news_theme_id' => $themeId,
                'urgency' => $data['urgency'] ?? null,
                'relevance_score' => $data['relevance_score'] ?? 0,
                'entities' => $data['entities'] ?? [],
                'ai_model_used' => $model,
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
     * Level 2 - Editorial enrichment: 5W1H, suggested titles, summary bullets.
     */
    public function enrichEditorial(NewsItem $item): AiEnrichmentResult
    {
        $textInput = $this->buildEnrichmentInput($item);
        $model = $this->editorialModel();

        $response = OpenAI::chat()->create([
            'model' => $model,
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

        $metadata = NewsItemAiMetadata::where('news_item_id', $item->id)->first();
        if ($metadata) {
            $metadata->update([
                'five_ws' => $data['five_ws'] ?? null,
                'suggested_titles' => $data['suggested_titles'] ?? [],
                'summary_bullets' => $data['summary_bullets'] ?? [],
                'enrichment_level' => 'level_2',
                'ai_model_used' => $model,
                'ai_tokens_used' => ($metadata->ai_tokens_used ?? 0) + $tokensUsed,
            ]);
        }

        return new AiEnrichmentResult(
            success: true,
            metadata: $metadata,
            tokensUsed: $tokensUsed,
        );
    }

    public function classificationModel(): string
    {
        return (string) config('news_radar.ai.classification_model', 'openai/gpt-oss-20b:free');
    }

    public function editorialModel(): string
    {
        return (string) config('news_radar.ai.editorial_model', $this->classificationModel());
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
Analise a noticia e responda estritamente em JSON Schema.

Regras:
- `city`: cidade principal mencionada na noticia. Se nao identificavel, null.
- `state_abbr`: sigla do estado (2 letras). Se nao identificavel, null.
- `theme`: slug do tema editorial (politica, policia, esporte, economia, saude, educacao, cultura, tecnologia, meio_ambiente, transporte, sociedade, internacional, outro).
- `urgency`: "baixa" (informativo), "media" (relevante), "alta" (urgente/breaking news).
- `relevance_score`: 0.0 a 1.0. Considere: impacto na comunidade, atualidade, abrangencia.
- `entities`: lista de entidades mencionadas ({type: "pessoa"|"organizacao"|"local"|"evento", name: string}).
PROMPT;
    }

    private function enrichmentSystemPrompt(): string
    {
        return <<<'PROMPT'
Voce e um assistente editorial para uma redacao jornalistica. Analise a noticia e produza conteudo editorial auxiliar.

Regras:
- `five_ws`: extraia Quem, O que, Onde, Quando, Por que, Como da noticia. Cada campo e uma string curta.
- `suggested_titles`: gere 3 titulos alternativos para a mesma noticia. Variando estilo (informativo, engajante, investigativo).
- `summary_bullets`: gere 3-5 bullet points resumindo os pontos principais da noticia. Cada bullet e uma frase curta.
PROMPT;
    }

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
