<?php

namespace App\Modules\WhatsApp\Http\Requests;

class SendTextRequest extends BaseWhatsAppRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'options' => $this->input('options', []),
            'async' => $this->boolean('async'),
        ]);
    }

    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'max:32'],
            'message' => ['required', 'string', 'max:4096'],
            'options' => ['nullable', 'array'],
            'options.delayMessage' => ['nullable', 'integer', 'min:1', 'max:15'],
            'options.delayTyping' => ['nullable', 'integer', 'min:1', 'max:15'],
            'options.editMessageId' => ['nullable', 'string', 'max:190'],
            'async' => ['nullable', 'boolean'],
            'queue' => ['nullable', 'string', 'max:100'],
        ];
    }
}
