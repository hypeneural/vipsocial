<?php

namespace App\Modules\FestaDivino\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NoticiaFestaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:255'],
            'linha_apoio' => ['nullable', 'string'],
            'url' => ['required', 'url:http,https', 'max:512'],
            'data_hora_publicacao' => ['required', 'date_format:Y-m-d H:i'],
            'thumb_url' => ['nullable', 'url:http,https', 'max:512'],
        ];
    }

    public function attributes(): array
    {
        return [
            'titulo' => 'titulo',
            'linha_apoio' => 'linha de apoio',
            'url' => 'link da noticia',
            'data_hora_publicacao' => 'data de publicacao',
            'thumb_url' => 'imagem',
        ];
    }
}
