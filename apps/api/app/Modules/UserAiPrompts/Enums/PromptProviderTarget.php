<?php

namespace App\Modules\UserAiPrompts\Enums;

enum PromptProviderTarget: string
{
    case Generic = 'generic';
    case ChatGpt = 'chatgpt';
    case Claude = 'claude';
}
