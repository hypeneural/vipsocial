<?php

return [
    'ai' => [
        'classification_model' => env('NEWS_RADAR_AI_CLASSIFICATION_MODEL', 'openai/gpt-oss-20b:free'),
        'editorial_model' => env('NEWS_RADAR_AI_EDITORIAL_MODEL')
            ?: env('NEWS_RADAR_AI_CLASSIFICATION_MODEL', 'openai/gpt-oss-20b:free'),
    ],
];
