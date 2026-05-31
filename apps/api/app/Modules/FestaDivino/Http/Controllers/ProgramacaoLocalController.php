<?php

namespace App\Modules\FestaDivino\Http\Controllers;

use App\Modules\FestaDivino\Actions\Shared\FestaDivinoAuditLogger;
use App\Modules\FestaDivino\Actions\Shared\FestaDivinoWriteGuard;
use App\Modules\FestaDivino\Http\Controllers\Concerns\AuthorizesFestaDivino;
use App\Modules\FestaDivino\Http\Requests\ProgramacaoLocalRequest;
use App\Modules\FestaDivino\Http\Resources\LocalFestaResource;
use App\Modules\FestaDivino\Models\LocalFesta;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ProgramacaoLocalController extends BaseController
{
    use AuthorizesFestaDivino;

    public function index(Request $request): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $locais = QueryBuilder::for(LocalFesta::class)
            ->allowedFilters([
                AllowedFilter::partial('search', 'nome_local'),
            ])
            ->allowedSorts(['nome_local', 'id_local'])
            ->withCount('eventos')
            ->defaultSort('nome_local')
            ->paginate($request->integer('per_page', 50));

        return $this->jsonPaginated($locais, LocalFestaResource::class);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $local = LocalFesta::query()
            ->withCount('eventos')
            ->findOrFail($id);

        return $this->jsonSuccess(new LocalFestaResource($local));
    }

    public function store(ProgramacaoLocalRequest $request, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $id = DB::connection($writeConnection)->transaction(
            fn () => DB::connection($writeConnection)->table('Locais_Festa')->insertGetId($payload),
            3
        );

        $auditLogger->log($request, 'create', 'programacao_local', $id, null, $payload);

        return $this->jsonCreated(new LocalFestaResource(LocalFesta::query()->findOrFail($id)));
    }

    public function update(ProgramacaoLocalRequest $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload) {
            $row = DB::connection($writeConnection)->table('Locais_Festa')->where('id_local', $id)->first();
            abort_if($row === null, 404);

            DB::connection($writeConnection)->table('Locais_Festa')->where('id_local', $id)->update($payload);

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'update', 'programacao_local', $id, $oldValues, $payload);

        return $this->jsonSuccess(new LocalFestaResource(LocalFesta::query()->findOrFail($id)));
    }

    public function destroy(Request $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id) {
            $db = DB::connection($writeConnection);
            $row = $db->table('Locais_Festa')->where('id_local', $id)->first();
            abort_if($row === null, 404);

            $eventsCount = $db->table('Programacao_Eventos')->where('id_local', $id)->count();
            if ($eventsCount > 0) {
                abort(response()->json([
                    'success' => false,
                    'message' => 'Local possui eventos vinculados.',
                    'code' => 'FESTA_DIVINO_ENTITY_HAS_DEPENDENCIES',
                    'errors' => ['id' => ['Remova ou mova os eventos antes de excluir.']],
                ], 409));
            }

            $db->table('Locais_Festa')->where('id_local', $id)->delete();

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'delete', 'programacao_local', $id, $oldValues, null);

        return $this->jsonDeleted('Local removido com sucesso.');
    }

    private function authorizeWrite(Request $request): void
    {
        $this->authorizeFestaDivino($request, 'festa-divino.programacao.manage');
        abort_unless($request->user()?->can('festa-divino.write'), 403);
    }

    private function payload(array $data): array
    {
        return [
            'nome_local' => $data['nome'],
            'endereco_local' => $data['endereco'] ?? null,
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'descricao_local' => $data['descricao'] ?? null,
            'imagem_local_url' => $data['imagem_url'] ?? null,
            'acessibilidade_info' => $data['acessibilidade'] ?? null,
        ];
    }
}
