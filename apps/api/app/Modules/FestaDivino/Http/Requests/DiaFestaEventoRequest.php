<?php

namespace App\Modules\FestaDivino\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Validator;

class DiaFestaEventoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'edicao_id' => ['required', 'integer', 'min:1'],
            'data_evento' => ['required', 'date_format:Y-m-d'],
            'nome' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->has('edicao_id')) {
                return;
            }

            $db = DB::connection(config('festa-divino.read_connection', 'festa_divino_read'));
            $edicao = $db->table('Edicao_Festa')->where('id_edicao', $this->input('edicao_id'))->first();

            if ($edicao === null) {
                $validator->errors()->add('edicao_id', 'Edicao nao encontrada.');

                return;
            }

            if ($validator->errors()->has('data_evento')) {
                return;
            }

            $dataEvento = $this->input('data_evento');
            if ($dataEvento < $edicao->data_inicio_programacao || $dataEvento > $edicao->data_fim_programacao) {
                $validator->errors()->add('data_evento', 'A data deve estar dentro do periodo da programacao da edicao.');
            }
        });
    }

    public function attributes(): array
    {
        return [
            'edicao_id' => 'edicao',
            'data_evento' => 'data',
            'nome' => 'nome do dia',
            'descricao' => 'descricao',
        ];
    }
}
