<?php

namespace App\Modules\FestaDivino\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProgramacaoAtracaoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:255'],
            'tipo' => ['nullable', 'string', 'max:100'],
            'descricao' => ['nullable', 'string'],
            'imagem_url' => ['nullable', 'url', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'nome' => 'nome',
            'tipo' => 'tipo',
            'descricao' => 'descricao',
            'imagem_url' => 'imagem',
        ];
    }
}
