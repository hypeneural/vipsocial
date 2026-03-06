<?php

namespace App\Modules\WhatsApp\Http\Requests;

use Illuminate\Validation\Rule;

class WindowRequest extends BaseWhatsAppRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'window' => strtolower((string) $this->input('window', '7d')),
        ]);
    }

    public function rules(): array
    {
        return [
            'window' => ['nullable', 'string', Rule::in(['7d', '15d', '30d'])],
        ];
    }
}
