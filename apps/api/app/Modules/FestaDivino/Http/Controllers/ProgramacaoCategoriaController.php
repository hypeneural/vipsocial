<?php

namespace App\Modules\FestaDivino\Http\Controllers;

use App\Modules\FestaDivino\Actions\Shared\FestaDivinoAuditLogger;
use App\Modules\FestaDivino\Actions\Shared\FestaDivinoWriteGuard;
use App\Modules\FestaDivino\Http\Controllers\Concerns\AuthorizesFestaDivino;
use App\Modules\FestaDivino\Http\Requests\ProgramacaoCategoriaRequest;
use App\Modules\FestaDivino\Http\Resources\CategoriaEventoResource;
use App\Modules\FestaDivino\Models\CategoriaEvento;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ProgramacaoCategoriaController extends BaseController
{
    use AuthorizesFestaDivino;

    public function index(Request $request): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $categorias = QueryBuilder::for(CategoriaEvento::class)
            ->allowedFilters([
                AllowedFilter::partial('search', 'nome_categoria'),
            ])
            ->allowedSorts(['nome_categoria', 'id_categoria'])
            ->withCount('eventos')
            ->defaultSort('nome_categoria')
            ->paginate($request->integer('per_page', 50));

        return $this->jsonPaginated($categorias, CategoriaEventoResource::class);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $categoria = CategoriaEvento::query()
            ->withCount('eventos')
            ->findOrFail($id);

        return $this->jsonSuccess(new CategoriaEventoResource($categoria));
    }

    public function store(ProgramacaoCategoriaRequest $request, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $id = DB::connection($writeConnection)->transaction(
            fn () => DB::connection($writeConnection)->table('Categorias_Evento')->insertGetId($payload),
            3
        );

        $auditLogger->log($request, 'create', 'programacao_categoria', $id, null, $payload);

        return $this->jsonCreated(new CategoriaEventoResource(CategoriaEvento::query()->findOrFail($id)));
    }

    public function update(
        ProgramacaoCategoriaRequest $request,
        int $id,
        FestaDivinoAuditLogger $auditLogger
    ): JsonResponse {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload) {
            $row = DB::connection($writeConnection)->table('Categorias_Evento')->where('id_categoria', $id)->first();
            abort_if($row === null, 404);

            DB::connection($writeConnection)->table('Categorias_Evento')->where('id_categoria', $id)->update($payload);

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'update', 'programacao_categoria', $id, $oldValues, $payload);

        return $this->jsonSuccess(new CategoriaEventoResource(CategoriaEvento::query()->findOrFail($id)));
    }

    public function destroy(Request $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id) {
            $db = DB::connection($writeConnection);
            $row = $db->table('Categorias_Evento')->where('id_categoria', $id)->first();
            abort_if($row === null, 404);

            $eventsCount = $db->table('Programacao_Eventos')->where('id_categoria', $id)->count();
            if ($eventsCount > 0) {
                abort(response()->json([
                    'success' => false,
                    'message' => 'Categoria possui eventos vinculados.',
                    'code' => 'FESTA_DIVINO_ENTITY_HAS_DEPENDENCIES',
                    'errors' => ['id' => ['Remova ou mova os eventos antes de excluir.']],
                ], 409));
            }

            $db->table('Categorias_Evento')->where('id_categoria', $id)->delete();

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'delete', 'programacao_categoria', $id, $oldValues, null);

        return $this->jsonDeleted('Categoria removida com sucesso.');
    }

    private function authorizeWrite(Request $request): void
    {
        $this->authorizeFestaDivino($request, 'festa-divino.programacao.manage');
        abort_unless($request->user()?->can('festa-divino.write'), 403);
    }

    private function payload(array $data): array
    {
        return [
            'nome_categoria' => $data['nome'],
            'descricao_categoria' => $data['descricao'] ?? null,
            'icone_categoria' => $data['icone'] ?? null,
            'cor_categoria' => $data['cor'] ?? null,
        ];
    }
}
