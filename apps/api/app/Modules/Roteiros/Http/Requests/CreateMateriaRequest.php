<?php

namespace App\Modules\Roteiros\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateMateriaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('roteiros.edit');
    }

    public function rules(): array
    {
        return [
            'shortcut' => ['nullable', 'string', 'max:10'],
            'titulo' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
            'duracao' => ['nullable', 'string', 'max:10'],
            'status' => ['sometimes', 'in:pendente,em_producao,pronto,aprovado,no_ar'],
            'categoria_id' => ['nullable', 'integer', 'exists:categorias,id'],
            'creditos_gc' => ['nullable', 'string', 'max:255'],
        ];
    }
}
