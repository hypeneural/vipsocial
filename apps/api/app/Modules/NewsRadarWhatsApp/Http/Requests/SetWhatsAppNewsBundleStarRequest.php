<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Requests;

class SetWhatsAppNewsBundleStarRequest extends BaseNewsRadarWhatsAppRequest
{
    public function rules(): array
    {
        return [
            'is_starred' => ['required', 'boolean'],
        ];
    }
}
