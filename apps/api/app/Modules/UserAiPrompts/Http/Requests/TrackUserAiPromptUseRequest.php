<?php

namespace App\Modules\UserAiPrompts\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TrackUserAiPromptUseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('ai_prompts.view') ?? false;
    }

    public function rules(): array
    {
        return [];
    }
}
