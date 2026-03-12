<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Requests;

class ExportWhatsAppBundleMarkdownRequest extends BaseNewsRadarWhatsAppRequest
{
    public function rules(): array
    {
        return [
            'lock_version' => ['required', 'integer', 'min:1'],
            'expires_in_minutes' => ['nullable', 'integer', 'min:1', 'max:1440'],
        ];
    }
}
