<?php

return [
    'timezone' => env('EXTERNAS_TIMEZONE', 'America/Sao_Paulo'),
    'whatsapp_queue' => env('EXTERNAS_WHATSAPP_QUEUE', 'default'),
    'whatsapp_due_batch_limit' => (int) env('EXTERNAS_WHATSAPP_DUE_BATCH_LIMIT', 200),
    'whatsapp_default_targets' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('EXTERNAS_WHATSAPP_DEFAULT_TARGETS', '554896318744-1499088823'))
    ))),
];
