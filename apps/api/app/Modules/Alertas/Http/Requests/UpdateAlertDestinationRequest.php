<?php

namespace App\Modules\Alertas\Http\Requests;

class UpdateAlertDestinationRequest extends BaseAlertasRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->has('active')) {
            $this->merge([
                'active' => $this->boolean('active'),
            ]);
        }

        if ($this->has('tags')) {
            $this->merge([
                'tags' => $this->input('tags', []),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:191'],
            'phone_number' => ['sometimes', 'required', 'string', 'max:64'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'active' => ['nullable', 'boolean'],
        ];
    }
}
