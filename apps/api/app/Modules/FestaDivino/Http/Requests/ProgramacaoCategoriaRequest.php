<?php

namespace App\Modules\FestaDivino\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProgramacaoCategoriaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:100'],
            'descricao' => ['nullable', 'string'],
            'icone' => ['nullable', 'string', 'max:100'],
            'cor' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }

    public function attributes(): array
    {
        return [
            'nome' => 'nome',
            'descricao' => 'descricao',
            'icone' => 'icone',
            'cor' => 'cor',
        ];
    }
}
