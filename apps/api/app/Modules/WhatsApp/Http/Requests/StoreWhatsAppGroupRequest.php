<?php

namespace App\Modules\WhatsApp\Http\Requests;

use Illuminate\Validation\Rule;

class StoreWhatsAppGroupRequest extends BaseWhatsAppRequest
{
    public function rules(): array
    {
        return [
            'group_id' => [
                'required',
                'string',
                'max:191',
                'regex:/^(?:\d+-group|\d+-\d+)$/',
                Rule::unique('whatsapp_groups', 'group_id'),
            ],
            'is_active' => ['sometimes', 'boolean'],
            'name' => ['nullable', 'string', 'max:191'],
            'subject' => ['nullable', 'string', 'max:191'],
            'description' => ['nullable', 'string'],
            'sync_now' => ['sometimes', 'boolean'],
            'force' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('group_id')) {
            $this->merge([
                'group_id' => strtolower(trim((string) $this->input('group_id'))),
            ]);
        }
    }

    public function messages(): array
    {
        return [
            'group_id.regex' => 'O group_id deve estar no formato antigo (551199999999-1234567890) ou novo (120363019502650977-group).',
        ];
    }
}
