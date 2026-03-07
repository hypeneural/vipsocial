<?php

namespace App\Modules\Alertas\Http\Requests;

class NextFiringsRequest extends BaseAlertasRequest
{
    public function rules(): array
    {
        return [
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }
}
