<?php

namespace App\Modules\FestaDivino\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProgramacaoEventoStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ativo' => ['sometimes', 'boolean'],
            'destaque' => ['sometimes', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'ativo' => 'ativo',
            'destaque' => 'destaque',
        ];
    }
}
