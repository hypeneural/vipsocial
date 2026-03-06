<?php

return [
    'provider' => env('SOCIAL_PROVIDER', 'apify'),
    'timezone' => env('SOCIAL_TIMEZONE', env('APP_TIMEZONE', 'America/Sao_Paulo')),
    'sync_hour' => env('SOCIAL_SYNC_HOUR', '06:10'),
    'queue' => env('SOCIAL_QUEUE', 'default'),
    'fail_on_empty_dataset' => filter_var(env('SOCIAL_FAIL_ON_EMPTY_DATASET', true), FILTER_VALIDATE_BOOLEAN),
    'dashboard_default_window' => env('SOCIAL_DASHBOARD_DEFAULT_WINDOW', '30d'),
    'cache' => [
        'dashboard_ttl_sec' => (int) env('SOCIAL_CACHE_TTL_DASHBOARD', 300),
    ],
    'apify' => [
        'base_url' => env('APIFY_BASE_URL', 'https://api.apify.com/v2'),
        'token' => env('APIFY_TOKEN'),
        'timeout' => (int) env('APIFY_HTTP_TIMEOUT', 30),
        'retry_times' => (int) env('APIFY_RETRY_TIMES', 3),
        'retry_sleep_ms' => (int) env('APIFY_RETRY_SLEEP_MS', 1000),
        'wait_for_finish' => (int) env('APIFY_WAIT_FOR_FINISH', 60),
        'run_timeout_secs' => (int) env('APIFY_RUN_TIMEOUT_SECS', 120),
        'memory_mbytes' => (int) env('APIFY_MEMORY_MBYTES', 256),
        'max_total_charge_usd' => (float) env('APIFY_MAX_TOTAL_CHARGE_USD', 1),
    ],
];
