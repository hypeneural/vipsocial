<?php

namespace App\Modules\WhatsApp\Http\Requests;

class SyncWhatsAppGroupRequest extends BaseWhatsAppRequest
{
    public function rules(): array
    {
        return [
            'force' => ['sometimes', 'boolean'],
        ];
    }
}
