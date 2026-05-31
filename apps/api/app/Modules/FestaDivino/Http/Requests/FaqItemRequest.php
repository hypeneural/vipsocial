<?php

namespace App\Modules\FestaDivino\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Validator;

class FaqItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'min:1'],
            'pergunta' => ['required', 'string', 'max:5000'],
            'resposta' => ['required', 'string', 'max:20000'],
            'ordem' => ['required', 'integer', 'min:1', 'max:65535'],
            'ativo' => ['required', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $categoryId = $this->input('category_id');
            if ($categoryId === null || $categoryId === '') {
                return;
            }

            $exists = DB::connection(config('festa-divino.read_connection', 'festa_divino_read'))
                ->table('faq_category')
                ->where('id', $categoryId)
                ->exists();

            if (! $exists) {
                $validator->errors()->add('category_id', 'Categoria nao encontrada.');
            }
        });
    }

    public function attributes(): array
    {
        return [
            'category_id' => 'categoria',
            'pergunta' => 'pergunta',
            'resposta' => 'resposta',
            'ordem' => 'ordem',
            'ativo' => 'ativo',
        ];
    }
}
