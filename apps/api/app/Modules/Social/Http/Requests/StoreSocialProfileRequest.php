<?php

namespace App\Modules\Social\Http\Requests;

use Illuminate\Validation\Rule;

class StoreSocialProfileRequest extends BaseSocialRequest
{
    public function rules(): array
    {
        return [
            'provider' => ['sometimes', 'string', 'in:apify'],
            'provider_resource_type' => ['sometimes', 'string', 'in:task'],
            'provider_resource_id' => ['required', 'string', 'max:191'],
            'task_input_override' => ['nullable', 'array'],
            'network' => ['required', 'string', 'max:50'],
            'handle' => [
                'required',
                'string',
                'max:191',
                Rule::unique('social_profiles', 'handle')->where(function ($query) {
                    return $query->where('network', strtolower(trim((string) $this->input('network'))));
                }),
            ],
            'display_name' => ['nullable', 'string', 'max:191'],
            'external_profile_id' => ['nullable', 'string', 'max:191'],
            'url' => ['nullable', 'string', 'max:500'],
            'avatar_url' => ['nullable', 'string', 'max:1000'],
            'primary_metric_code' => ['required', 'string', 'max:100'],
            'normalizer_type' => ['sometimes', 'string', 'max:100'],
            'normalizer_config' => ['required', 'array'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'sync_now' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'provider' => strtolower(trim((string) $this->input('provider', 'apify'))),
            'provider_resource_type' => strtolower(trim((string) $this->input('provider_resource_type', 'task'))),
            'network' => strtolower(trim((string) $this->input('network'))),
            'handle' => strtolower(trim((string) $this->input('handle'))),
            'normalizer_type' => strtolower(trim((string) $this->input('normalizer_type', 'path_map'))),
        ]);
    }
}
