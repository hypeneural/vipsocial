<?php

namespace App\Modules\Analytics\Http\Requests;

class AnalyticsCitiesRequest extends BaseAnalyticsRequest
{
    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $this->merge([
            'limit' => (int) $this->input('limit', 10),
        ]);
    }

    public function rules(): array
    {
        return array_merge($this->baseRules(), [
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
            'host_name' => ['nullable', 'string', 'max:255'],
        ]);
    }
}

