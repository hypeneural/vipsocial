<?php

namespace App\Modules\Enquetes\Http\Requests\Admin;

class StorePollSiteRequest extends BaseEnquetesRequest
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
            'name' => ['required', 'string', 'max:191'],
            'public_key' => ['nullable', 'string', 'max:191'],
            'secret_key' => ['nullable', 'string', 'max:191'],
            'is_active' => ['nullable', 'boolean'],
            'settings' => ['nullable', 'array'],
        ];
    }
}
