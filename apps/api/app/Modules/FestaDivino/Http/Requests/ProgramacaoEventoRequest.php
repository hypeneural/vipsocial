<?php

namespace App\Modules\FestaDivino\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Validator;

class ProgramacaoEventoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'edicao_id' => ['required', 'integer', 'min:1'],
            'titulo' => ['required', 'string', 'max:255'],
            'subtitulo' => ['nullable', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
            'data_evento' => ['required', 'date_format:Y-m-d'],
            'hora_inicio' => ['required', 'date_format:H:i'],
            'hora_fim' => ['nullable', 'date_format:H:i', 'after:hora_inicio'],
            'duracao_estimada_minutos' => ['nullable', 'integer', 'min:1', 'max:1440'],
            'local_id' => ['required', 'integer', 'min:1'],
            'categoria_id' => ['required', 'integer', 'min:1'],
            'tema' => ['nullable', 'string', 'max:255'],
            'publico_alvo' => ['nullable', 'string', 'max:255'],
            'evento_pago' => ['sometimes', 'boolean'],
            'valor_ingresso' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'link_ingresso' => ['nullable', 'url', 'max:255'],
            'observacao_ingresso' => ['nullable', 'string'],
            'destaque' => ['sometimes', 'boolean'],
            'imagem_destaque_url' => ['nullable', 'url', 'max:255'],
            'organizador_responsavel' => ['nullable', 'string'],
            'tags' => ['nullable', 'array', 'max:20'],
            'tags.*' => ['required', 'string', 'max:50'],
            'ativo' => ['sometimes', 'boolean'],
            'atracoes' => ['nullable', 'array', 'max:50'],
            'atracoes.*.id' => ['required', 'integer', 'min:1'],
            'atracoes.*.papel_no_evento' => ['nullable', 'string', 'max:100'],
            'atracoes.*.ordem_apresentacao' => ['nullable', 'integer', 'min:0', 'max:999'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $connection = config('festa-divino.read_connection', 'festa_divino_read');
            $db = DB::connection($connection);

            $this->validateExists($validator, $db, 'edicao_id', 'Edicao_Festa', 'id_edicao');
            $this->validateExists($validator, $db, 'local_id', 'Locais_Festa', 'id_local');
            $this->validateExists($validator, $db, 'categoria_id', 'Categorias_Evento', 'id_categoria');

            $atracoes = $this->input('atracoes', []);
            if (! is_array($atracoes) || $atracoes === []) {
                return;
            }

            $ids = array_values(array_filter(array_map(
                fn ($atracao) => is_array($atracao) ? ($atracao['id'] ?? null) : null,
                $atracoes
            )));

            if (count($ids) !== count(array_unique($ids))) {
                $validator->errors()->add('atracoes', 'Nao repita a mesma atracao no evento.');
            }

            if ($ids === []) {
                return;
            }

            $existingIds = $db->table('Atracoes')
                ->whereIn('id_atracao', array_unique($ids))
                ->pluck('id_atracao')
                ->map(fn ($id) => (int) $id)
                ->all();

            foreach ($ids as $index => $id) {
                if (! in_array((int) $id, $existingIds, true)) {
                    $validator->errors()->add("atracoes.$index.id", 'Atracao nao encontrada.');
                }
            }
        });
    }

    public function attributes(): array
    {
        return [
            'edicao_id' => 'edicao',
            'titulo' => 'titulo',
            'subtitulo' => 'subtitulo',
            'descricao' => 'descricao',
            'data_evento' => 'data',
            'hora_inicio' => 'hora de inicio',
            'hora_fim' => 'hora de fim',
            'duracao_estimada_minutos' => 'duracao estimada',
            'local_id' => 'local',
            'categoria_id' => 'categoria',
            'evento_pago' => 'evento pago',
            'valor_ingresso' => 'valor do ingresso',
            'link_ingresso' => 'link do ingresso',
            'observacao_ingresso' => 'observacao do ingresso',
            'destaque' => 'destaque',
            'imagem_destaque_url' => 'imagem de destaque',
            'organizador_responsavel' => 'organizador responsavel',
            'tags' => 'tags',
            'ativo' => 'ativo',
            'atracoes' => 'atracoes',
        ];
    }

    private function validateExists(Validator $validator, mixed $db, string $field, string $table, string $column): void
    {
        $value = $this->input($field);
        if ($value === null || $value === '') {
            return;
        }

        if (! $db->table($table)->where($column, $value)->exists()) {
            $validator->errors()->add($field, 'Registro vinculado nao encontrado.');
        }
    }
}
