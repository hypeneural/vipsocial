<?php

namespace App\Modules\WhatsApp\Http\Requests;

class PaginatedListRequest extends BaseWhatsAppRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'page' => (int) $this->input('page', 1),
            'pageSize' => (int) $this->input('pageSize', 1000),
        ]);
    }

    public function rules(): array
    {
        return [
            'page' => ['nullable', 'integer', 'min:1'],
            'pageSize' => ['nullable', 'integer', 'min:1', 'max:1000'],
        ];
    }
}
