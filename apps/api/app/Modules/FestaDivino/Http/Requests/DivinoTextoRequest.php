<?php

namespace App\Modules\FestaDivino\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DivinoTextoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'texto_curto' => ['required', 'string', 'max:255'],
            'texto_detalhado' => ['required', 'string'],
            'categoria' => ['required', 'string', 'max:100'],
            'icone_categoria' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function attributes(): array
    {
        return [
            'texto_curto' => 'resumo',
            'texto_detalhado' => 'texto detalhado',
            'categoria' => 'categoria',
            'icone_categoria' => 'icone',
        ];
    }
}
