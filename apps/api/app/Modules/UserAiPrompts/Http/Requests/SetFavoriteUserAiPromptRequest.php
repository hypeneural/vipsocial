<?php

namespace App\Modules\UserAiPrompts\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SetFavoriteUserAiPromptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('ai_prompts.edit') ?? false;
    }

    public function rules(): array
    {
        return [];
    }
}
