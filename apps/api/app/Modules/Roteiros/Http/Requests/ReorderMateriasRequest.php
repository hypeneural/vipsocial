<?php

namespace App\Modules\Roteiros\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReorderMateriasRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('roteiros.edit');
    }

    public function rules(): array
    {
        return [
            'materias' => ['required', 'array', 'min:1'],
            'materias.*.id' => ['required', 'integer', 'exists:materias,id'],
            'materias.*.ordem' => ['required', 'integer', 'min:0'],
            'materias.*.shortcut' => ['sometimes', 'nullable', 'string', 'max:10'],
        ];
    }
}
