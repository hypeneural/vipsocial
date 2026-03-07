<?php

namespace App\Modules\Enquetes\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class StorePollPlacementRequest extends BaseEnquetesRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_active' => $this->has('is_active') ? $this->boolean('is_active') : true,
        ]);
    }

    public function rules(): array
    {
        return [
            'poll_site_id' => ['nullable', 'integer', Rule::exists('poll_sites', 'id')],
            'placement_name' => ['required', 'string', 'max:191'],
            'article_external_id' => ['nullable', 'string', 'max:191'],
            'article_title' => ['nullable', 'string', 'max:191'],
            'canonical_url' => ['nullable', 'url', 'max:2000'],
            'page_path' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
