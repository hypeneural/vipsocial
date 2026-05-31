<?php

namespace App\Modules\FestaDivino\Http\Controllers;

use App\Modules\FestaDivino\Actions\Shared\FestaDivinoAuditLogger;
use App\Modules\FestaDivino\Actions\Shared\FestaDivinoWriteGuard;
use App\Modules\FestaDivino\Http\Controllers\Concerns\AuthorizesFestaDivino;
use App\Modules\FestaDivino\Http\Requests\ProgramacaoEventoRequest;
use App\Modules\FestaDivino\Http\Requests\ProgramacaoEventoStatusRequest;
use App\Modules\FestaDivino\Http\Resources\ProgramacaoEventoResource;
use App\Modules\FestaDivino\Models\ProgramacaoEvento;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ProgramacaoEventoController extends BaseController
{
    use AuthorizesFestaDivino;

    public function index(Request $request): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $eventos = QueryBuilder::for(ProgramacaoEvento::class)
            ->allowedFilters([
                AllowedFilter::exact('id_edicao_festa'),
                AllowedFilter::exact('id_categoria'),
                AllowedFilter::exact('id_local'),
                AllowedFilter::exact('data_evento'),
                AllowedFilter::exact('ativo'),
                AllowedFilter::exact('evento_destaque'),
                AllowedFilter::partial('search', 'titulo_evento'),
            ])
            ->allowedIncludes(['edicao', 'local', 'categoria', 'atracoes'])
            ->allowedSorts(['data_evento', 'hora_inicio', 'titulo_evento', 'data_atualizacao'])
            ->defaultSort('data_evento', 'hora_inicio')
            ->paginate($request->integer('per_page', 25));

        return $this->jsonPaginated($eventos, ProgramacaoEventoResource::class);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $evento = QueryBuilder::for(ProgramacaoEvento::class)
            ->allowedIncludes(['edicao', 'local', 'categoria', 'atracoes'])
            ->whereKey($id)
            ->firstOrFail();

        return $this->jsonSuccess(new ProgramacaoEventoResource($evento));
    }

    public function store(ProgramacaoEventoRequest $request, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $atracoes = $this->atracoesPayload($request->validated('atracoes', []));
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $id = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $payload, $atracoes) {
            $db = DB::connection($writeConnection);
            $id = $db->table('Programacao_Eventos')->insertGetId($payload);
            $this->syncAtracoes($db, $id, $atracoes);

            return $id;
        }, 3);

        $auditLogger->log($request, 'create', 'programacao_evento', $id, null, [
            ...$payload,
            'atracoes' => $atracoes,
        ]);

        return $this->jsonCreated(new ProgramacaoEventoResource($this->findEventoForResponse($id)));
    }

    public function update(
        ProgramacaoEventoRequest $request,
        int $id,
        FestaDivinoAuditLogger $auditLogger
    ): JsonResponse {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated(), true);
        $atracoes = $this->atracoesPayload($request->validated('atracoes', []));
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload, $atracoes) {
            $db = DB::connection($writeConnection);
            $oldValues = $this->eventSnapshot($db, $id);
            abort_if($oldValues === null, 404);

            $db->table('Programacao_Eventos')->where('id_evento', $id)->update($payload);
            $this->syncAtracoes($db, $id, $atracoes);

            return $oldValues;
        }, 3);

        $auditLogger->log($request, 'update', 'programacao_evento', $id, $oldValues, [
            ...$payload,
            'atracoes' => $atracoes,
        ]);

        return $this->jsonSuccess(new ProgramacaoEventoResource($this->findEventoForResponse($id)));
    }

    public function updateStatus(
        ProgramacaoEventoStatusRequest $request,
        int $id,
        FestaDivinoAuditLogger $auditLogger
    ): JsonResponse {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = [];
        if ($request->has('ativo')) {
            $payload['ativo'] = $request->boolean('ativo');
        }

        if ($request->has('destaque')) {
            $payload['evento_destaque'] = $request->boolean('destaque');
        }

        abort_if($payload === [], 422, 'Informe ativo ou destaque.');

        $payload['data_atualizacao'] = now()->toDateTimeString();
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload) {
            $db = DB::connection($writeConnection);
            $oldValues = $this->eventSnapshot($db, $id);
            abort_if($oldValues === null, 404);

            $db->table('Programacao_Eventos')->where('id_evento', $id)->update($payload);

            return $oldValues;
        }, 3);

        $auditLogger->log($request, 'status', 'programacao_evento', $id, $oldValues, $payload);

        return $this->jsonSuccess(new ProgramacaoEventoResource($this->findEventoForResponse($id)));
    }

    public function destroy(Request $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id) {
            $db = DB::connection($writeConnection);
            $oldValues = $this->eventSnapshot($db, $id);
            abort_if($oldValues === null, 404);

            $db->table('Evento_Atracao')->where('id_evento', $id)->delete();
            $db->table('Programacao_Eventos')->where('id_evento', $id)->delete();

            return $oldValues;
        }, 3);

        $auditLogger->log($request, 'delete', 'programacao_evento', $id, $oldValues, null);

        return $this->jsonDeleted('Evento removido com sucesso.');
    }

    private function authorizeWrite(Request $request): void
    {
        $this->authorizeFestaDivino($request, 'festa-divino.programacao.manage');
        abort_unless($request->user()?->can('festa-divino.write'), 403);
    }

    private function payload(array $data, bool $touch = false): array
    {
        $now = now()->toDateTimeString();
        $payload = [
            'id_edicao_festa' => $data['edicao_id'],
            'titulo_evento' => $data['titulo'],
            'subtitulo_evento' => $data['subtitulo'] ?? null,
            'descricao_geral_evento' => $data['descricao'] ?? null,
            'data_evento' => $data['data_evento'],
            'hora_inicio' => $this->normalizeTime($data['hora_inicio']),
            'hora_fim' => isset($data['hora_fim']) ? $this->normalizeTime($data['hora_fim']) : null,
            'duracao_estimada_minutos' => $data['duracao_estimada_minutos'] ?? null,
            'id_local' => $data['local_id'],
            'id_categoria' => $data['categoria_id'],
            'tema_evento' => $data['tema'] ?? null,
            'publico_alvo' => $data['publico_alvo'] ?? null,
            'evento_pago' => $data['evento_pago'] ?? false,
            'valor_ingresso' => $data['valor_ingresso'] ?? null,
            'link_ingresso' => $data['link_ingresso'] ?? null,
            'observacao_ingresso' => $data['observacao_ingresso'] ?? null,
            'evento_destaque' => $data['destaque'] ?? false,
            'imagem_destaque_url' => $data['imagem_destaque_url'] ?? null,
            'organizador_responsavel' => $data['organizador_responsavel'] ?? null,
            'tags' => array_key_exists('tags', $data) ? json_encode(array_values($data['tags'] ?? [])) : null,
            'ativo' => $data['ativo'] ?? true,
            'data_atualizacao' => $now,
        ];

        if (! $touch) {
            $payload['data_criacao'] = $now;
        }

        return $payload;
    }

    private function atracoesPayload(array $atracoes): array
    {
        return array_map(
            fn (array $atracao, int $index) => [
                'id_atracao' => (int) $atracao['id'],
                'papel_no_evento' => $atracao['papel_no_evento'] ?? null,
                'ordem_apresentacao' => $atracao['ordem_apresentacao'] ?? ($index + 1),
            ],
            $atracoes,
            array_keys($atracoes)
        );
    }

    private function syncAtracoes(mixed $db, int $eventoId, array $atracoes): void
    {
        $db->table('Evento_Atracao')->where('id_evento', $eventoId)->delete();

        if ($atracoes === []) {
            return;
        }

        $db->table('Evento_Atracao')->insert(array_map(
            fn (array $atracao) => [
                'id_evento' => $eventoId,
                'id_atracao' => $atracao['id_atracao'],
                'papel_no_evento' => $atracao['papel_no_evento'],
                'ordem_apresentacao' => $atracao['ordem_apresentacao'],
            ],
            $atracoes
        ));
    }

    private function eventSnapshot(mixed $db, int $id): ?array
    {
        $row = $db->table('Programacao_Eventos')->where('id_evento', $id)->first();
        if ($row === null) {
            return null;
        }

        return [
            'evento' => (array) $row,
            'atracoes' => $db->table('Evento_Atracao')
                ->where('id_evento', $id)
                ->orderBy('ordem_apresentacao')
                ->get()
                ->map(fn ($item) => (array) $item)
                ->all(),
        ];
    }

    private function findEventoForResponse(int $id): ProgramacaoEvento
    {
        return ProgramacaoEvento::query()
            ->with(['local', 'categoria', 'atracoes'])
            ->findOrFail($id);
    }

    private function normalizeTime(string $time): string
    {
        return strlen($time) === 5 ? "{$time}:00" : $time;
    }
}
