<?php

namespace App\Modules\Social\Http\Requests;

class UpdateSocialProfileRequest extends BaseSocialRequest
{
    public function rules(): array
    {
        return [
            'task_input_override' => ['nullable', 'array'],
            'display_name' => ['nullable', 'string', 'max:191'],
            'external_profile_id' => ['nullable', 'string', 'max:191'],
            'url' => ['nullable', 'string', 'max:500'],
            'avatar_url' => ['nullable', 'string', 'max:1000'],
            'primary_metric_code' => ['sometimes', 'string', 'max:100'],
            'normalizer_type' => ['sometimes', 'string', 'max:100'],
            'normalizer_config' => ['sometimes', 'array'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('normalizer_type')) {
            $this->merge([
                'normalizer_type' => strtolower(trim((string) $this->input('normalizer_type'))),
            ]);
        }
    }
}
