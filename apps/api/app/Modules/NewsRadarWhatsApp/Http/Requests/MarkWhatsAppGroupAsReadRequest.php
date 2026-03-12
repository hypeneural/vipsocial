<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Requests;

class MarkWhatsAppGroupAsReadRequest extends BaseNewsRadarWhatsAppRequest
{
    public function rules(): array
    {
        return [
            'last_seen_event_id' => ['required', 'integer', 'exists:whatsapp_inbound_events,id'],
        ];
    }
}
