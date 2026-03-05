<?php

namespace App\Modules\Analytics\Http\Requests;

use App\Modules\Analytics\Support\AnalyticsMetricsMap;
use Illuminate\Validation\Rule;

class AnalyticsTimeseriesRequest extends BaseAnalyticsRequest
{
    public function rules(): array
    {
        return array_merge($this->baseRules(), [
            'metric' => ['required', 'string', Rule::in(AnalyticsMetricsMap::allowedInternalMetrics())],
            'granularity' => ['required', 'string', Rule::in(['day', 'week', 'month'])],
        ]);
    }
}

