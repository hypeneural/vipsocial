<?php

namespace App\Modules\Enquetes\Http\Requests\Admin;

class PollListRequest extends BaseEnquetesRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'per_page' => (int) ($this->input('per_page', 15)),
            'include_archived' => $this->boolean('include_archived'),
        ]);
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:191'],
            'status' => ['nullable', 'string', 'max:50'],
            'selection_type' => ['nullable', 'string', 'in:single,multiple'],
            'include_archived' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
