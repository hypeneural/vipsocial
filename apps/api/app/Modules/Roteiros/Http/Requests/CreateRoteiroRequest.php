<?php

namespace App\Modules\Roteiros\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateRoteiroRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('roteiros.create');
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:255'],
            'data' => ['required', 'date_format:Y-m-d'],
            'programa' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'in:rascunho,em_producao,revisao,aprovado,publicado,arquivado'],
            'observacoes' => ['nullable', 'string'],
            'materias' => ['sometimes', 'array'],
            'materias.*.shortcut' => ['nullable', 'string', 'max:10'],
            'materias.*.titulo' => ['required', 'string', 'max:255'],
            'materias.*.descricao' => ['nullable', 'string'],
            'materias.*.duracao' => ['nullable', 'string', 'max:10'],
            'materias.*.categoria_id' => ['nullable', 'integer', 'exists:categorias,id'],
            'materias.*.creditos_gc' => ['nullable', 'string', 'max:255'],
        ];
    }
}
