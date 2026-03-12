<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Requests;

class IndexWhatsAppGroupTimelineRequest extends BaseNewsRadarWhatsAppRequest
{
    protected function prepareForValidation(): void
    {
        if (! $this->exists('include_ignored')) {
            return;
        }

        $normalized = filter_var(
            $this->input('include_ignored'),
            FILTER_VALIDATE_BOOLEAN,
            FILTER_NULL_ON_FAILURE
        );

        if ($normalized !== null) {
            $this->merge([
                'include_ignored' => $normalized,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'cursor' => ['nullable', 'string'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'window' => ['nullable', 'string', 'max:32'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'message_kind' => ['nullable', 'string', 'max:32'],
            'search' => ['nullable', 'string', 'max:255'],
            'include_ignored' => ['nullable', 'boolean'],
        ];
    }
}
