<?php

namespace App\Modules\Analytics\Http\Requests;

class AnalyticsTopPagesRequest extends BaseAnalyticsRequest
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
            'path_prefix' => ['nullable', 'string', 'max:255'],
            'exclude_prefix' => ['nullable', 'string', 'max:255'],
        ]);
    }
}

