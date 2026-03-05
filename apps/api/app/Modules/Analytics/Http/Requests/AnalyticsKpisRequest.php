<?php

namespace App\Modules\Analytics\Http\Requests;

class AnalyticsKpisRequest extends BaseAnalyticsRequest
{
    public function rules(): array
    {
        return $this->baseRules();
    }
}

