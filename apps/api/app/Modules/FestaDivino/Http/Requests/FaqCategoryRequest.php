<?php

namespace App\Modules\FestaDivino\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FaqCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:100'],
            'icone' => ['required', 'string', 'max:50'],
            'ordem' => ['required', 'integer', 'min:1', 'max:65535'],
            'ativo' => ['required', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'nome' => 'nome',
            'icone' => 'icone',
            'ordem' => 'ordem',
            'ativo' => 'ativo',
        ];
    }
}
