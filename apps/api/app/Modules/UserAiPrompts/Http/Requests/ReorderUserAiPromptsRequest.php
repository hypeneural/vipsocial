<?php

namespace App\Modules\UserAiPrompts\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReorderUserAiPromptsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('ai_prompts.edit') ?? false;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*' => ['required', 'integer', 'distinct'],
        ];
    }
}
