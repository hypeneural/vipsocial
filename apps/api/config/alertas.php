<?php

return [
    'timezone' => env('ALERTAS_TIMEZONE', 'America/Sao_Paulo'),
    'queue' => env('ALERTAS_QUEUE', 'default'),
    'dashboard' => [
        'next_firings_limit' => (int) env('ALERTAS_DASHBOARD_NEXT_FIRINGS_LIMIT', 5),
    ],
];
