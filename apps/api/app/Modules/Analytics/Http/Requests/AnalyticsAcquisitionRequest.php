<?php

namespace App\Modules\Analytics\Http\Requests;

class AnalyticsAcquisitionRequest extends BaseAnalyticsRequest
{
    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $this->merge([
            'mode' => $this->input('mode', 'session'),
            'limit' => (int) $this->input('limit', 10),
        ]);
    }

    public function rules(): array
    {
        return array_merge($this->baseRules(), [
            'mode' => ['required', 'string', 'in:session,first_user'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
    }
}

