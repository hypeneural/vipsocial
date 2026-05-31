<?php

namespace App\Modules\FestaDivino\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Validator;

class ProdutoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:100'],
            'preco' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'foto' => ['nullable', 'string', 'max:255'],
            'categoria_id' => ['required', 'integer', 'min:1'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $categoriaId = $this->input('categoria_id');
            if ($categoriaId === null || $categoriaId === '') {
                return;
            }

            $exists = DB::connection(config('festa-divino.read_connection', 'festa_divino_read'))
                ->table('categoria')
                ->where('id_categoria', $categoriaId)
                ->exists();

            if (! $exists) {
                $validator->errors()->add('categoria_id', 'Categoria nao encontrada.');
            }
        });
    }

    public function attributes(): array
    {
        return [
            'nome' => 'nome',
            'preco' => 'preco',
            'foto' => 'foto',
            'categoria_id' => 'categoria',
        ];
    }
}
