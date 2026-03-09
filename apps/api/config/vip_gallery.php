<?php

return [
    'disk' => 'public',

    'base_dir' => trim((string) env('VIP_GALLERY_BASE_DIR', 'vip-gallery'), '/'),

    'groups' => [
        [
            'id' => '120363423950458112-group',
            'label' => 'Galeria 1',
        ],
        [
            'id' => '120363425148164142-group',
            'label' => 'Galeria 2',
        ],
        [
            'id' => '120363408092361361-group',
            'label' => 'Galeria 3',
        ],
    ],

    'webhook' => [
        'secret' => (string) env('VIP_GALLERY_WEBHOOK_SECRET', ''),
        'secret_header' => (string) env('VIP_GALLERY_WEBHOOK_SECRET_HEADER', 'X-VIP-GALLERY-SECRET'),
    ],

    'public' => [
        'frontend_base_url' => rtrim((string) env('VIP_GALLERY_FRONTEND_URL', 'https://www.coberturavip.com.br'), '/'),
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

    'delete' => [
        'default_keywords' => 'Deletar,Apagar,Excluir',
    ],

    'pause' => [
        'default_keywords' => 'Parar,Pausar',
    ],

    'tracking' => [
        'view_dedupe_minutes' => (int) env('VIP_GALLERY_VIEW_DEDUPE_MINUTES', 30),
        'download_dedupe_minutes' => (int) env('VIP_GALLERY_DOWNLOAD_DEDUPE_MINUTES', 30),
    ],

    'images' => [
        'download_timeout' => (int) env('VIP_GALLERY_DOWNLOAD_TIMEOUT', 30),
        'max_bytes' => (int) env('VIP_GALLERY_IMAGE_MAX_BYTES', 15728640),
        'logo_max_bytes' => 2097152,
        'banner_max_bytes' => (int) env('VIP_GALLERY_BANNER_MAX_BYTES', 5242880),
        'allowed_mimes' => [
            'image/jpeg',
            'image/png',
            'image/webp',
        ],
        'jpeg_quality' => 90,
        'default_logo_path' => 'vip-gallery/defaults/logo_vip.png',
        'no_logo_sentinel' => '__none__',
        'logo_position' => 'bottom_center',
        'logo_anchors' => [
            'top_left',
            'top_center',
            'top_right',
            'center_left',
            'center',
            'center_right',
            'bottom_left',
            'bottom_center',
            'bottom_right',
        ],
        'logo_size_percent_default' => 12,
        'logo_size_percent_min' => 5,
        'logo_size_percent_max' => 25,
        'logo_safe_area_percent' => 2,
        'logo_offset_percent_default' => 3,
        'logo_format' => 'png',
        'banner_rendered_width' => 744,
        'banner_rendered_height' => 144,
        'banner_ratio_label' => '31:6',
    ],
];
