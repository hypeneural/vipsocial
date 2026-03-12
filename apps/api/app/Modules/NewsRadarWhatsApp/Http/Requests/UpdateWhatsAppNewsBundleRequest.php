<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Requests;

class UpdateWhatsAppNewsBundleRequest extends BaseNewsRadarWhatsAppRequest
{
    public function rules(): array
    {
        return [
            'lock_version' => ['required', 'integer', 'min:1'],
            'title' => ['nullable', 'string', 'max:255'],
            'headline_draft' => ['nullable', 'string', 'max:255'],
            'subheadline_draft' => ['nullable', 'string', 'max:255'],
            'lead_draft' => ['nullable', 'string'],
            'summary' => ['nullable', 'string'],
            'origin_summary' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'editorial_notes' => ['nullable', 'string'],
            'promotion_notes' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:120'],
            'urgency' => ['nullable', 'string', 'max:32'],
            'category' => ['nullable', 'string', 'max:120'],
            'categories_json' => ['nullable', 'array'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
