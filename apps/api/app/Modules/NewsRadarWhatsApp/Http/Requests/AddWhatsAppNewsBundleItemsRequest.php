<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Requests;

class AddWhatsAppNewsBundleItemsRequest extends BaseNewsRadarWhatsAppRequest
{
    public function rules(): array
    {
        return [
            'lock_version' => ['required', 'integer', 'min:1'],
            'event_ids' => ['required', 'array', 'min:1'],
            'event_ids.*' => ['integer', 'exists:whatsapp_inbound_events,id'],
        ];
    }
}
