<?php

namespace App\Modules\FestaDivino\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProgramacaoLocalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:255'],
            'endereco' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'descricao' => ['nullable', 'string'],
            'imagem_url' => ['nullable', 'url', 'max:255'],
            'acessibilidade' => ['nullable', 'string'],
        ];
    }

    public function attributes(): array
    {
        return [
            'nome' => 'nome',
            'endereco' => 'endereco',
            'latitude' => 'latitude',
            'longitude' => 'longitude',
            'descricao' => 'descricao',
            'imagem_url' => 'imagem',
            'acessibilidade' => 'acessibilidade',
        ];
    }
}
