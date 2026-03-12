<?php

$csv = static function (?string $value): array {
    if (! is_string($value) || trim($value) === '') {
        return [];
    }

    return array_values(array_unique(array_filter(array_map(
        static fn (string $entry): string => trim($entry),
        explode(',', $value),
    ))));
};

$classificationPrimary = env('NEWS_RADAR_AI_CLASSIFICATION_MODEL', 'arcee-ai/trinity-large-preview:free');
$editorialPrimary = env('NEWS_RADAR_AI_EDITORIAL_MODEL') ?: 'arcee-ai/trinity-large-preview:free';

return [
    'timezone' => env('NEWS_RADAR_TIMEZONE', 'America/Sao_Paulo'),
    'week_starts_at' => env('NEWS_RADAR_WEEK_STARTS_AT', 'sunday'),
    'ai' => [
        'classification_model' => $classificationPrimary,
        'editorial_model' => $editorialPrimary,
        'classification_fallback_models' => $csv(
            env('NEWS_RADAR_AI_CLASSIFICATION_FALLBACK_MODELS', 'openai/gpt-5-nano,openai/gpt-5-mini')
        ),
        'editorial_fallback_models' => $csv(
            env('NEWS_RADAR_AI_EDITORIAL_FALLBACK_MODELS', 'openai/gpt-5-mini,openai/gpt-5-nano')
        ),
        'disable_reasoning_on_prompt_json_models' => $csv(
            env('NEWS_RADAR_AI_DISABLE_REASONING_ON_PROMPT_JSON_MODELS', '')
        ),
    ],
];
