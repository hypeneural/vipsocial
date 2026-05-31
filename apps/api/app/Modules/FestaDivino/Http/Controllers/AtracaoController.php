<?php

namespace App\Modules\FestaDivino\Http\Controllers;

use App\Modules\FestaDivino\Actions\Shared\FestaDivinoAuditLogger;
use App\Modules\FestaDivino\Actions\Shared\FestaDivinoWriteGuard;
use App\Modules\FestaDivino\Http\Controllers\Concerns\AuthorizesFestaDivino;
use App\Modules\FestaDivino\Http\Requests\ProgramacaoAtracaoRequest;
use App\Modules\FestaDivino\Http\Resources\AtracaoResource;
use App\Modules\FestaDivino\Models\Atracao;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AtracaoController extends BaseController
{
    use AuthorizesFestaDivino;

    public function index(Request $request): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $atracoes = QueryBuilder::for(Atracao::class)
            ->allowedFilters([
                AllowedFilter::partial('search', 'nome_atracao'),
                AllowedFilter::exact('tipo_atracao'),
            ])
            ->allowedSorts(['nome_atracao', 'tipo_atracao', 'id_atracao'])
            ->withCount('eventos')
            ->defaultSort('nome_atracao')
            ->paginate($request->integer('per_page', 50));

        return $this->jsonPaginated($atracoes, AtracaoResource::class);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $atracao = Atracao::query()
            ->withCount('eventos')
            ->findOrFail($id);

        return $this->jsonSuccess(new AtracaoResource($atracao));
    }

    public function store(ProgramacaoAtracaoRequest $request, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $id = DB::connection($writeConnection)->transaction(
            fn () => DB::connection($writeConnection)->table('Atracoes')->insertGetId($payload),
            3
        );

        $auditLogger->log($request, 'create', 'programacao_atracao', $id, null, $payload);

        return $this->jsonCreated(new AtracaoResource(Atracao::query()->findOrFail($id)));
    }

    public function update(ProgramacaoAtracaoRequest $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload) {
            $row = DB::connection($writeConnection)->table('Atracoes')->where('id_atracao', $id)->first();
            abort_if($row === null, 404);

            DB::connection($writeConnection)->table('Atracoes')->where('id_atracao', $id)->update($payload);

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'update', 'programacao_atracao', $id, $oldValues, $payload);

        return $this->jsonSuccess(new AtracaoResource(Atracao::query()->findOrFail($id)));
    }

    public function destroy(Request $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id) {
            $db = DB::connection($writeConnection);
            $row = $db->table('Atracoes')->where('id_atracao', $id)->first();
            abort_if($row === null, 404);

            $eventsCount = $db->table('Evento_Atracao')->where('id_atracao', $id)->count();
            if ($eventsCount > 0) {
                abort(response()->json([
                    'success' => false,
                    'message' => 'Atracao possui eventos vinculados.',
                    'code' => 'FESTA_DIVINO_ENTITY_HAS_DEPENDENCIES',
                    'errors' => ['id' => ['Remova o vinculo com eventos antes de excluir.']],
                ], 409));
            }

            $db->table('Atracoes')->where('id_atracao', $id)->delete();

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'delete', 'programacao_atracao', $id, $oldValues, null);

        return $this->jsonDeleted('Atracao removida com sucesso.');
    }

    private function authorizeWrite(Request $request): void
    {
        $this->authorizeFestaDivino($request, 'festa-divino.programacao.manage');
        abort_unless($request->user()?->can('festa-divino.write'), 403);
    }

    private function payload(array $data): array
    {
        return [
            'nome_atracao' => $data['nome'],
            'tipo_atracao' => $data['tipo'] ?? null,
            'descricao_atracao' => $data['descricao'] ?? null,
            'imagem_atracao_url' => $data['imagem_url'] ?? null,
        ];
    }
}
