<?php

namespace App\Modules\WhatsApp\Http\Requests;

class SendLinkRequest extends BaseWhatsAppRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'linkType' => strtoupper((string) $this->input('linkType', 'LARGE')),
            'async' => $this->boolean('async'),
        ]);
    }

    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'max:32'],
            'message' => ['required', 'string', 'max:4096'],
            'image' => ['required', 'string', 'max:5000'],
            'linkUrl' => ['required', 'url', 'max:1000'],
            'title' => ['required', 'string', 'max:255'],
            'linkDescription' => ['required', 'string', 'max:1000'],
            'linkType' => ['nullable', 'string', 'in:LARGE,SMALL'],
            'async' => ['nullable', 'boolean'],
            'queue' => ['nullable', 'string', 'max:100'],
        ];
    }
}
