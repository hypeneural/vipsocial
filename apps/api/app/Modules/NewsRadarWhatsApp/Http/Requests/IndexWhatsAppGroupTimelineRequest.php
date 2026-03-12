<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Requests;

class IndexWhatsAppGroupTimelineRequest extends BaseNewsRadarWhatsAppRequest
{
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
