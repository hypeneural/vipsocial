<?php

namespace App\Modules\FestaDivino\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FaqReorderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'integer', 'min:1', 'distinct'],
            'items.*.ordem' => ['required', 'integer', 'min:1', 'max:65535'],
        ];
    }

    public function attributes(): array
    {
        return [
            'items' => 'itens',
            'items.*.id' => 'item',
            'items.*.ordem' => 'ordem',
        ];
    }
}
