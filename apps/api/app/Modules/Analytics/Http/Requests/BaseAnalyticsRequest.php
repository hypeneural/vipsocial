<?php

namespace App\Modules\Analytics\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

abstract class BaseAnalyticsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && ($user->can('analytics.view') || $user->can('dashboard.view'));
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'date_preset' => $this->input('date_preset', 'last_7_days'),
            'compare' => $this->input('compare', 'none'),
            'debug_quota' => $this->boolean('debug_quota'),
        ]);
    }

    protected function baseRules(): array
    {
        return [
            'date_preset' => ['required', 'string', Rule::in([
                'today',
                'yesterday',
                'last_7_days',
                'last_30_days',
                'month_to_date',
                'custom',
            ])],
            'start_date' => ['required_if:date_preset,custom', 'date_format:Y-m-d'],
            'end_date' => ['required_if:date_preset,custom', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'compare' => ['required', 'string', Rule::in(['none', 'previous_period', 'previous_year'])],
            'debug_quota' => ['nullable', 'boolean'],
        ];
    }
}
