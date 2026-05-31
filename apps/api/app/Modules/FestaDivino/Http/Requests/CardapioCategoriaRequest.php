<?php

namespace App\Modules\FestaDivino\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CardapioCategoriaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:100'],
            'icone' => ['required', 'string', 'max:100'],
        ];
    }

    public function attributes(): array
    {
        return [
            'nome' => 'nome',
            'icone' => 'icone',
        ];
    }
}
