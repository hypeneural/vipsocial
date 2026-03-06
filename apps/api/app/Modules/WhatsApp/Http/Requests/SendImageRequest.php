<?php

namespace App\Modules\WhatsApp\Http\Requests;

class SendImageRequest extends BaseWhatsAppRequest
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
            'image' => ['required', 'string', 'max:5000'],
            'caption' => ['nullable', 'string', 'max:4096'],
            'options' => ['nullable', 'array'],
            'options.messageId' => ['nullable', 'string', 'max:190'],
            'options.delayMessage' => ['nullable', 'integer', 'min:1', 'max:15'],
            'options.viewOnce' => ['nullable', 'boolean'],
            'async' => ['nullable', 'boolean'],
            'queue' => ['nullable', 'string', 'max:100'],
        ];
    }
}
