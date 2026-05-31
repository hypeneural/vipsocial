<?php

namespace App\Modules\FestaDivino\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BrinquedoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:100'],
            'descricao' => ['required', 'string', 'max:255'],
            'video' => ['required', 'string', 'max:255', 'regex:/\A(?:https?:\/\/|\/)\S+\z/'],
            'thumb_url' => ['required', 'string', 'max:255', 'regex:/\A(?:https?:\/\/|\/)\S+\z/'],
            'ativo' => ['required', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'nome' => 'nome',
            'descricao' => 'descricao',
            'video' => 'video',
            'thumb_url' => 'miniatura',
            'ativo' => 'ativo',
        ];
    }

    public function messages(): array
    {
        return [
            'video.regex' => 'Informe uma URL http(s) ou um caminho iniciado por /.',
            'thumb_url.regex' => 'Informe uma URL http(s) ou um caminho iniciado por /.',
        ];
    }
}
