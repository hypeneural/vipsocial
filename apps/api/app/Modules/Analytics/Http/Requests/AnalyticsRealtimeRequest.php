<?php

namespace App\Modules\Analytics\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AnalyticsRealtimeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && ($user->can('analytics.view') || $user->can('dashboard.view'));
    }

    public function rules(): array
    {
        return [];
    }
}

