<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Requests;

class UpdateUserWhatsAppGroupsPreferencesRequest extends BaseNewsRadarWhatsAppRequest
{
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.whatsapp_group_fk' => ['required', 'string', 'exists:whatsapp_groups,id'],
            'items.*.is_active' => ['sometimes', 'boolean'],
            'items.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'items.*.label_override' => ['nullable', 'string', 'max:255'],
            'items.*.notification_mode' => ['nullable', 'string', 'max:32'],
        ];
    }
}
