<?php

namespace App\Modules\Roteiros\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoteiroRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('roteiros.edit');
    }

    public function rules(): array
    {
        return [
            'titulo' => ['sometimes', 'string', 'max:255'],
            'data' => ['sometimes', 'date_format:Y-m-d'],
            'programa' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'in:rascunho,em_producao,revisao,aprovado,publicado,arquivado'],
            'observacoes' => ['nullable', 'string'],
        ];
    }
}
