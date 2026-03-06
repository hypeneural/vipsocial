<?php

return [
    /*
     * Ordered matching rules for acquisition source normalization.
     * First match wins.
     */
    'rules' => [
        [
            'key' => 'whatsapp',
            'label' => 'WhatsApp',
            'group' => 'Messaging',
            'patterns' => [
                '/^tvvip\.social$/i',
                '/(^|\.)roteiro\.tvvip\.social$/i',
                '/^wa\.me$/i',
                '/^api\.whatsapp\.com$/i',
                '/^web\.whatsapp\.com$/i',
                '/^l\.whatsapp\.com$/i',
                '/(^|\.)whatsapp\.com$/i',
                '/^l\.wl\.co$/i',
                '/\bwhatsapp\b/i',
                '/\bwa\.me\b/i',
            ],
        ],
        [
            'key' => 'facebook',
            'label' => 'Facebook',
            'group' => 'Social',
            'patterns' => [
                '/(^|\.)facebook\.com$/i',
                '/^(m|l|lm|mbasic|web)\.facebook\.com$/i',
                '/^fb\.com$/i',
                '/^fb\.me$/i',
                '/^fb$/i',
                '/\bfacebook\b/i',
            ],
        ],
        [
            'key' => 'instagram',
            'label' => 'Instagram',
            'group' => 'Social',
            'patterns' => [
                '/(^|\.)instagram\.com$/i',
                '/^(l|lm|m)\.instagram\.com$/i',
                '/^ig$/i',
                '/\binstagram\b/i',
            ],
        ],
        [
            'key' => 'youtube',
            'label' => 'YouTube',
            'group' => 'Video',
            'patterns' => [
                '/(^|\.)youtube\.com$/i',
                '/^(m|music|gaming)\.youtube\.com$/i',
                '/^youtu\.be$/i',
                '/\byoutube\b/i',
            ],
        ],
        [
            'key' => 'x',
            'label' => 'X/Twitter',
            'group' => 'Social',
            'patterns' => [
                '/^t\.co$/i',
                '/(^|\.)twitter\.com$/i',
                '/(^|\.)x\.com$/i',
                '/\btwitter\b/i',
            ],
        ],
        [
            'key' => 'gemini',
            'label' => 'Gemini',
            'group' => 'AI',
            'patterns' => [
                '/^gemini\.google\.[a-z.]{2,}$/i',
            ],
        ],
        [
            'key' => 'gmail',
            'label' => 'Gmail',
            'group' => 'Email',
            'patterns' => [
                '/^mail\.google\.com$/i',
                '/(^|\.)gmail\.com$/i',
            ],
        ],
        [
            'key' => 'google_news',
            'label' => 'Google News',
            'group' => 'Search',
            'patterns' => [
                '/^news\.google\.[a-z.]{2,}$/i',
            ],
        ],
        [
            'key' => 'google',
            'label' => 'Google',
            'group' => 'Search',
            'patterns' => [
                '/^google$/i',
                '/(^|\.)google\.[a-z.]{2,}$/i',
                '/^trends\.google\.com(\.[a-z.]{2,})?$/i',
                '/^g\.co$/i',
            ],
        ],
        [
            'key' => 'bing',
            'label' => 'Bing',
            'group' => 'Search',
            'patterns' => [
                '/^bing$/i',
                '/(^|\.)bing\.com$/i',
                '/^[a-z0-9-]+\.bing\.com$/i',
            ],
        ],
        [
            'key' => 'msn',
            'label' => 'MSN / Microsoft Start',
            'group' => 'Search',
            'patterns' => [
                '/(^|\.)msn\.com$/i',
                '/^ntp\.msn\.com$/i',
            ],
        ],
        [
            'key' => 'yahoo',
            'label' => 'Yahoo',
            'group' => 'Search',
            'patterns' => [
                '/^yahoo$/i',
                '/(^|\.)yahoo\.com$/i',
                '/(^|\.)search\.yahoo\.com$/i',
                '/^br\.search\.yahoo\.com$/i',
            ],
        ],
        [
            'key' => 'duckduckgo',
            'label' => 'DuckDuckGo',
            'group' => 'Search',
            'patterns' => [
                '/^duckduckgo$/i',
                '/(^|\.)duckduckgo\.com$/i',
            ],
        ],
        [
            'key' => 'ecosia',
            'label' => 'Ecosia',
            'group' => 'Search',
            'patterns' => [
                '/(^|\.)ecosia\.org$/i',
            ],
        ],
        [
            'key' => 'kwai',
            'label' => 'Kwai',
            'group' => 'Social',
            'patterns' => [
                '/(^|\.)kwai\.com$/i',
                '/\bkwai\b/i',
            ],
        ],
        [
            'key' => 'chatgpt',
            'label' => 'ChatGPT',
            'group' => 'AI',
            'patterns' => [
                '/^chatgpt\.com$/i',
            ],
        ],
        [
            'key' => 'other',
            'label' => 'Other',
            'group' => 'Referral',
            'patterns' => [
                '/.*/',
            ],
        ],
    ],
];
