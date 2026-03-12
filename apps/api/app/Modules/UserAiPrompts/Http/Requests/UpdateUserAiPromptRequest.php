<?php

namespace App\Modules\UserAiPrompts\Http\Requests;

use App\Modules\UserAiPrompts\Enums\PromptProviderTarget;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserAiPromptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('ai_prompts.edit') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'content' => ['sometimes', 'string'],
            'provider_target' => ['sometimes', 'string', Rule::enum(PromptProviderTarget::class)],
        ];
    }
}
