<?php

return [
    'timezone' => env('ENQUETES_TIMEZONE', 'America/Sao_Paulo'),
    'queue' => env('ENQUETES_QUEUE', 'default'),
    'media' => [
        'disk' => env('ENQUETES_IMAGE_DISK', env('FILESYSTEM_DISK', 'public')),
        'max_file_size_kb' => (int) env('ENQUETES_IMAGE_MAX_FILE_SIZE_KB', 2048),
        'allowed_mime_types' => [
            'image/jpeg',
            'image/png',
            'image/webp',
        ],
    ],
    'rate_limits' => [
        'boot' => (int) env('ENQUETES_RATE_LIMIT_BOOT', 60),
        'sessions' => (int) env('ENQUETES_RATE_LIMIT_SESSIONS', 120),
        'vote' => (int) env('ENQUETES_RATE_LIMIT_VOTE', 20),
        'events' => (int) env('ENQUETES_RATE_LIMIT_EVENTS', 120),
    ],
    'embed' => [
        'frame_ancestors' => env(
            'ENQUETES_EMBED_FRAME_ANCESTORS',
            'https://vipsocial.com.br https://*.vipsocial.com.br https://tvvip.social https://*.tvvip.social'
        ),
    ],
];
