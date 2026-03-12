<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Requests;

class RemoveWhatsAppNewsBundleItemRequest extends BaseNewsRadarWhatsAppRequest
{
    public function rules(): array
    {
        return [
            'lock_version' => ['required', 'integer', 'min:1'],
        ];
    }
}
