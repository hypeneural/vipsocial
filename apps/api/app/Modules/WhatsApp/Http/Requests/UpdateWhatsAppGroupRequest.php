<?php

namespace App\Modules\WhatsApp\Http\Requests;

class UpdateWhatsAppGroupRequest extends BaseWhatsAppRequest
{
    public function rules(): array
    {
        return [
            'is_active' => ['sometimes', 'boolean'],
            'name' => ['nullable', 'string', 'max:191'],
            'subject' => ['nullable', 'string', 'max:191'],
            'description' => ['nullable', 'string'],
        ];
    }
}
