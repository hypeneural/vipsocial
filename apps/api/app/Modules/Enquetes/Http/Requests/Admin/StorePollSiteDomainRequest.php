<?php

namespace App\Modules\Enquetes\Http\Requests\Admin;

class StorePollSiteDomainRequest extends BaseEnquetesRequest
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
            'domain_pattern' => ['required', 'string', 'max:191'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
