<?php

namespace App\Modules\Analytics\Http\Requests;

class AnalyticsOverviewRequest extends BaseAnalyticsRequest
{
    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $this->merge([
            'include' => $this->input('include', 'kpis,top_pages,realtime'),
            'limit' => (int) $this->input('limit', 10),
        ]);
    }

    public function rules(): array
    {
        return array_merge($this->baseRules(), [
            'include' => ['nullable', 'string', 'max:100'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
            'path_prefix' => ['nullable', 'string', 'max:255'],
            'exclude_prefix' => ['nullable', 'string', 'max:255'],
        ]);
    }

    public function includes(): array
    {
        return collect(explode(',', (string) $this->input('include', 'kpis,top_pages,realtime')))
            ->map(fn(string $value) => trim($value))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}

