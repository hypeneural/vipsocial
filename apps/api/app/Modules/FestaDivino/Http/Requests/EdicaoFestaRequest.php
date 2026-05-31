<?php

namespace App\Modules\FestaDivino\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EdicaoFestaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ano' => ['required', 'integer', 'between:2000,2100'],
            'titulo' => ['required', 'string', 'max:255'],
            'data_inicio_programacao' => ['required', 'date_format:Y-m-d'],
            'data_fim_programacao' => ['required', 'date_format:Y-m-d', 'after_or_equal:data_inicio_programacao'],
            'data_inicio_festejos' => ['required', 'date_format:Y-m-d'],
            'data_fim_festejos' => ['required', 'date_format:Y-m-d', 'after_or_equal:data_inicio_festejos'],
            'bandeireira_imperial' => ['nullable', 'string', 'max:255'],
            'comissao_organizadora' => ['nullable', 'string'],
            'texto_convite_principal' => ['nullable', 'string'],
            'imagem_cartaz_url' => ['nullable', 'url:http,https', 'max:255'],
            'tema_geral' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'ano' => 'ano',
            'titulo' => 'titulo',
            'data_inicio_programacao' => 'inicio da programacao',
            'data_fim_programacao' => 'fim da programacao',
            'data_inicio_festejos' => 'inicio dos festejos',
            'data_fim_festejos' => 'fim dos festejos',
            'bandeireira_imperial' => 'bandeireira imperial',
            'comissao_organizadora' => 'comissao organizadora',
            'texto_convite_principal' => 'texto de convite',
            'imagem_cartaz_url' => 'imagem do cartaz',
            'tema_geral' => 'tema geral',
        ];
    }
}
