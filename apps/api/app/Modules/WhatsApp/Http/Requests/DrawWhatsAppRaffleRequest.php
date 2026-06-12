<?php

namespace App\Modules\WhatsApp\Http\Requests;

class DrawWhatsAppRaffleRequest extends BaseWhatsAppRequest
{
    public function rules(): array
    {
        return [
            'group_id' => ['sometimes', 'string', 'max:80', 'regex:/^\d+-group$/'],
            'campaign_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'campaign_key' => ['sometimes', 'nullable', 'string', 'max:120'],
        ];
    }
}
