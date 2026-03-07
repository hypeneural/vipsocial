<?php

return [
    'timezone' => env('ALERTAS_TIMEZONE', 'America/Sao_Paulo'),
    'queue' => env('ALERTAS_QUEUE', 'default'),
    'monitoring' => [
        'overdue_grace_minutes' => (int) env('ALERTAS_OVERDUE_GRACE_MINUTES', 2),
    ],
    'dashboard' => [
        'next_firings_limit' => (int) env('ALERTAS_DASHBOARD_NEXT_FIRINGS_LIMIT', 5),
    ],
];
