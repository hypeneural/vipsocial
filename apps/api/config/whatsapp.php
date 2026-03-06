<?php

return [
    'provider' => env('WHATSAPP_PROVIDER', 'zapi'),

    'zapi' => [
        'base_url' => env('ZAPI_BASE_URL', 'https://api.z-api.io'),
        'instance' => env('ZAPI_INSTANCE', ''),
        'token' => env('ZAPI_TOKEN', ''),
        'client_token' => env('ZAPI_CLIENT_TOKEN', ''),
        'timeout' => (int) env('ZAPI_TIMEOUT', 30),
        'retry_times' => (int) env('ZAPI_RETRY_TIMES', 3),
        'retry_sleep_ms' => (int) env('ZAPI_RETRY_SLEEP_MS', 300),
    ],

    'cache' => [
        'status_ttl_sec' => (int) env('WHATSAPP_CACHE_TTL_STATUS', 15),
        'qrcode_ttl_sec' => (int) env('WHATSAPP_CACHE_TTL_QRCODE', 10),
        'device_ttl_sec' => (int) env('WHATSAPP_CACHE_TTL_DEVICE', 30),
        'group_metrics_ttl_sec' => (int) env('WHATSAPP_CACHE_TTL_GROUP_METRICS', 120),
    ],

    'sync' => [
        'groups' => array_values(array_filter(array_map(
            static fn(string $group): string => trim($group),
            explode(',', (string) env('WHATSAPP_GROUP_IDS', ''))
        ))),
    ],

    'default_country_code' => env('WHATSAPP_DEFAULT_COUNTRY_CODE', '55'),
];
