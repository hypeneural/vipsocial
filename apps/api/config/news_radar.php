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

$classificationPrimary = env('NEWS_RADAR_AI_CLASSIFICATION_MODEL', 'z-ai/glm-4.5-air:free');
$editorialPrimary = env('NEWS_RADAR_AI_EDITORIAL_MODEL') ?: 'arcee-ai/trinity-large-preview:free';

return [
    'ai' => [
        'classification_model' => $classificationPrimary,
        'editorial_model' => $editorialPrimary,
        'classification_fallback_models' => $csv(
            env('NEWS_RADAR_AI_CLASSIFICATION_FALLBACK_MODELS', 'nvidia/nemotron-3-nano-30b-a3b:free,arcee-ai/trinity-large-preview:free,stepfun/step-3.5-flash:free')
        ),
        'editorial_fallback_models' => $csv(
            env('NEWS_RADAR_AI_EDITORIAL_FALLBACK_MODELS', 'z-ai/glm-4.5-air:free,nvidia/nemotron-3-nano-30b-a3b:free,stepfun/step-3.5-flash:free')
        ),
        'disable_reasoning_on_prompt_json_models' => $csv(
            env('NEWS_RADAR_AI_DISABLE_REASONING_ON_PROMPT_JSON_MODELS', 'z-ai/glm-4.5-air:free,nvidia/nemotron-3-nano-30b-a3b:free,openai/gpt-oss-20b:free')
        ),
    ],
];
