<?php

namespace App\Modules\FestaDivino\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FaqStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ativo' => ['required', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'ativo' => 'ativo',
        ];
    }
}
