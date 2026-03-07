<?php

namespace App\Modules\Alertas\Http\Requests;

class AlertListRequest extends BaseAlertasRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'include_inactive' => $this->boolean('include_inactive'),
            'include_archived' => $this->boolean('include_archived'),
        ]);
    }

    public function rules(): array
    {
        return [
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'search' => ['nullable', 'string', 'max:100'],
            'include_inactive' => ['nullable', 'boolean'],
            'include_archived' => ['nullable', 'boolean'],
            'destination_id' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
