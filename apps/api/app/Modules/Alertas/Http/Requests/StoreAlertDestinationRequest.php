<?php

namespace App\Modules\Alertas\Http\Requests;

class StoreAlertDestinationRequest extends BaseAlertasRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'active' => $this->has('active') ? $this->boolean('active') : true,
            'tags' => $this->input('tags', []),
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:191'],
            'phone_number' => ['required', 'string', 'max:64'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'active' => ['nullable', 'boolean'],
        ];
    }
}
