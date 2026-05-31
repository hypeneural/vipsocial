<?php

namespace App\Modules\FestaDivino\Http\Controllers;

use App\Modules\FestaDivino\Actions\Shared\FestaDivinoAuditLogger;
use App\Modules\FestaDivino\Actions\Shared\FestaDivinoWriteGuard;
use App\Modules\FestaDivino\Http\Controllers\Concerns\AuthorizesFestaDivino;
use App\Modules\FestaDivino\Http\Requests\DiaFestaEventoRequest;
use App\Modules\FestaDivino\Http\Resources\DiaFestaEventoResource;
use App\Modules\FestaDivino\Models\DiaFestaEvento;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class DiaFestaEventoController extends BaseController
{
    use AuthorizesFestaDivino;

    public function index(Request $request): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $dias = QueryBuilder::for(DiaFestaEvento::class)
            ->allowedFilters([
                AllowedFilter::exact('id_edicao'),
                AllowedFilter::exact('data_evento'),
                AllowedFilter::partial('search', 'nome_principal_evento_dia'),
            ])
            ->allowedIncludes(['edicao'])
            ->allowedSorts(['data_evento', 'nome_principal_evento_dia', 'created_at'])
            ->defaultSort('data_evento')
            ->paginate($request->integer('per_page', 25));

        return $this->jsonPaginated($dias, DiaFestaEventoResource::class);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $dia = QueryBuilder::for(DiaFestaEvento::class)
            ->allowedIncludes(['edicao'])
            ->whereKey($id)
            ->firstOrFail();

        return $this->jsonSuccess(new DiaFestaEventoResource($dia));
    }

    public function store(DiaFestaEventoRequest $request, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $id = DB::connection($writeConnection)->transaction(
            fn () => DB::connection($writeConnection)->table('dias_festa_evento')->insertGetId([
                ...$payload,
                'created_at' => now()->toDateTimeString(),
                'updated_at' => now()->toDateTimeString(),
            ]),
            3
        );

        $auditLogger->log($request, 'create', 'dia_festa', $id, null, $payload);

        return $this->jsonCreated(new DiaFestaEventoResource($this->findDiaForResponse($id)));
    }

    public function update(
        DiaFestaEventoRequest $request,
        int $id,
        FestaDivinoAuditLogger $auditLogger
    ): JsonResponse {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = [
            ...$this->payload($request->validated()),
            'updated_at' => now()->toDateTimeString(),
        ];
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload) {
            $db = DB::connection($writeConnection);
            $row = $db->table('dias_festa_evento')->where('id_dia_festa_evento', $id)->first();
            abort_if($row === null, 404);

            $db->table('dias_festa_evento')->where('id_dia_festa_evento', $id)->update($payload);

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'update', 'dia_festa', $id, $oldValues, $payload);

        return $this->jsonSuccess(new DiaFestaEventoResource($this->findDiaForResponse($id)));
    }

    public function destroy(Request $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id) {
            $db = DB::connection($writeConnection);
            $row = $db->table('dias_festa_evento')->where('id_dia_festa_evento', $id)->first();
            abort_if($row === null, 404);

            $db->table('dias_festa_evento')->where('id_dia_festa_evento', $id)->delete();

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'delete', 'dia_festa', $id, $oldValues, null);

        return $this->jsonDeleted('Dia da festa removido com sucesso.');
    }

    private function authorizeWrite(Request $request): void
    {
        $this->authorizeFestaDivino($request, 'festa-divino.programacao.manage');
        abort_unless($request->user()?->can('festa-divino.write'), 403);
    }

    private function payload(array $data): array
    {
        return [
            'id_edicao' => $data['edicao_id'],
            'data_evento' => $data['data_evento'],
            'nome_principal_evento_dia' => $data['nome'],
            'descricao_dia' => $data['descricao'] ?? null,
        ];
    }

    private function findDiaForResponse(int $id): DiaFestaEvento
    {
        return DiaFestaEvento::query()
            ->with('edicao')
            ->findOrFail($id);
    }
}
