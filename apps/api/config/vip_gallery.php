<?php

return [
    'disk' => 'public',

    'base_dir' => trim((string) env('VIP_GALLERY_BASE_DIR', 'vip-gallery'), '/'),

    'webhook' => [
        'secret' => (string) env('VIP_GALLERY_WEBHOOK_SECRET', ''),
        'secret_header' => (string) env('VIP_GALLERY_WEBHOOK_SECRET_HEADER', 'X-VIP-GALLERY-SECRET'),
    ],

    'queues' => [
        'webhook' => (string) env('VIP_GALLERY_QUEUE_WEBHOOK', 'vip-gallery-webhook'),
        'processing' => (string) env('VIP_GALLERY_QUEUE_PROCESSING', 'vip-gallery-processing'),
        'ack' => (string) env('VIP_GALLERY_QUEUE_ACK', 'vip-gallery-ack'),
    ],

    'ack' => [
        'enabled' => (bool) env('VIP_GALLERY_ACK_ENABLED', false),
        'message' => (string) env('VIP_GALLERY_ACK_MESSAGE', 'Publicada!'),
    ],

    'tracking' => [
        'view_dedupe_minutes' => (int) env('VIP_GALLERY_VIEW_DEDUPE_MINUTES', 30),
        'download_dedupe_minutes' => (int) env('VIP_GALLERY_DOWNLOAD_DEDUPE_MINUTES', 30),
    ],

    'images' => [
        'download_timeout' => (int) env('VIP_GALLERY_DOWNLOAD_TIMEOUT', 30),
        'max_bytes' => (int) env('VIP_GALLERY_IMAGE_MAX_BYTES', 15728640),
        'allowed_mimes' => [
            'image/jpeg',
            'image/png',
            'image/webp',
        ],
        'jpeg_quality' => 90,
        'logo_position' => 'bottom_right',
        'logo_margin_right_px' => 24,
        'logo_margin_bottom_px' => 24,
        'logo_size_percent_default' => 15,
        'logo_size_percent_min' => 5,
        'logo_size_percent_max' => 30,
        'logo_format' => 'png',
    ],
];
