<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Requests;

use App\Modules\NewsRadarWhatsApp\Models\WhatsAppNewsBundle;
use Illuminate\Validation\Rule;

class StoreWhatsAppNewsBundleRequest extends BaseNewsRadarWhatsAppRequest
{
    public function rules(): array
    {
        return [
            'group_fk' => ['required', 'string', 'exists:whatsapp_groups,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'creation_mode' => ['nullable', Rule::in([
                WhatsAppNewsBundle::CREATION_MODE_MANUAL,
                WhatsAppNewsBundle::CREATION_MODE_SUGGESTED,
            ])],
            'event_ids' => ['required', 'array', 'min:1'],
            'event_ids.*' => ['integer', 'exists:whatsapp_inbound_events,id'],
        ];
    }
}
