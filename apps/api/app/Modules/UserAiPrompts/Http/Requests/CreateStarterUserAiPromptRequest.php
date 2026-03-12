<?php

namespace App\Modules\UserAiPrompts\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateStarterUserAiPromptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('ai_prompts.create') ?? false;
    }

    public function rules(): array
    {
        return [];
    }
}
