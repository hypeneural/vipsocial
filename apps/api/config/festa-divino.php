<?php

return [
    'read_connection' => env('FESTA_DIVINO_READ_DB_CONNECTION_NAME', 'festa_divino_read'),
    'write_connection' => env('FESTA_DIVINO_WRITE_DB_CONNECTION_NAME', 'festa_divino_write'),
    'write_enabled' => env('FESTA_DIVINO_WRITE_ENABLED', false),

    'expected_tables' => [
        'Edicao_Festa',
        'Programacao_Eventos',
        'Categorias_Evento',
        'Locais_Festa',
        'Atracoes',
        'Evento_Atracao',
        'dias_festa_evento',
        'categoria',
        'produto',
        'noticias_festa',
        'youtube_videos',
        'shorts_videos',
        'divino_textos',
        'faq_category',
        'faq_item',
        'brinquedos',
        'fotos',
    ],
];
