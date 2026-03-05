<?php

namespace App\Modules\Analytics\Http\Requests;

use App\Modules\Analytics\Support\AnalyticsMetricsMap;
use Illuminate\Validation\Rule;

class AnalyticsTimeseriesRequest extends BaseAnalyticsRequest
{
    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $metrics = $this->input('metrics', []);
        if (!is_array($metrics)) {
            $metrics = [$metrics];
        }

        if (empty($metrics) && $this->filled('metric')) {
            $metrics = [$this->input('metric')];
        }

        $metrics = collect($metrics)
            ->filter(fn($value) => is_string($value) && trim($value) !== '')
            ->map(fn($value) => trim((string) $value))
            ->unique()
            ->values()
            ->all();

        $this->merge([
            'metrics' => $metrics,
        ]);
    }

    public function rules(): array
    {
        return array_merge($this->baseRules(), [
            'metric' => ['nullable', 'string', Rule::in(AnalyticsMetricsMap::allowedInternalMetrics())],
            'metrics' => ['required_without:metric', 'array', 'min:1', 'max:10'],
            'metrics.*' => ['required', 'string', Rule::in(AnalyticsMetricsMap::allowedInternalMetrics())],
            'granularity' => ['required', 'string', Rule::in(['day', 'week', 'month'])],
            'keep_empty_rows' => ['nullable', 'boolean'],
        ]);
    }

    public function metrics(): array
    {
        $metrics = $this->input('metrics', []);
        if (is_array($metrics) && !empty($metrics)) {
            return $metrics;
        }

        return $this->filled('metric') ? [(string) $this->input('metric')] : [];
    }
}
