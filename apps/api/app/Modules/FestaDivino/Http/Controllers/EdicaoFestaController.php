<?php

namespace App\Modules\FestaDivino\Http\Controllers;

use App\Modules\FestaDivino\Actions\Shared\FestaDivinoAuditLogger;
use App\Modules\FestaDivino\Actions\Shared\FestaDivinoWriteGuard;
use App\Modules\FestaDivino\Http\Controllers\Concerns\AuthorizesFestaDivino;
use App\Modules\FestaDivino\Http\Requests\EdicaoFestaRequest;
use App\Modules\FestaDivino\Http\Resources\EdicaoFestaResource;
use App\Modules\FestaDivino\Models\EdicaoFesta;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class EdicaoFestaController extends BaseController
{
    use AuthorizesFestaDivino;

    public function index(Request $request): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $edicoes = QueryBuilder::for(EdicaoFesta::class)
            ->allowedFilters([
                AllowedFilter::exact('ano_festa'),
                AllowedFilter::partial('search', 'titulo_festa'),
            ])
            ->allowedSorts([
                'ano_festa',
                'titulo_festa',
                'data_inicio_programacao',
                'data_inicio_festejos',
            ])
            ->withCount(['eventos', 'dias'])
            ->defaultSort('-ano_festa')
            ->paginate($request->integer('per_page', 25));

        return $this->jsonPaginated($edicoes, EdicaoFestaResource::class);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $edicao = EdicaoFesta::query()
            ->withCount(['eventos', 'dias'])
            ->findOrFail($id);

        return $this->jsonSuccess(new EdicaoFestaResource($edicao));
    }

    public function store(EdicaoFestaRequest $request, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $id = DB::connection($writeConnection)->transaction(
            fn () => DB::connection($writeConnection)->table('Edicao_Festa')->insertGetId($payload),
            3
        );

        $auditLogger->log($request, 'create', 'edicao_festa', $id, null, $payload);

        return $this->jsonCreated(new EdicaoFestaResource(EdicaoFesta::query()->findOrFail($id)));
    }

    public function update(
        EdicaoFestaRequest $request,
        int $id,
        FestaDivinoAuditLogger $auditLogger
    ): JsonResponse {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload) {
            $db = DB::connection($writeConnection);
            $row = $db->table('Edicao_Festa')->where('id_edicao', $id)->first();
            abort_if($row === null, 404);

            $db->table('Edicao_Festa')->where('id_edicao', $id)->update($payload);

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'update', 'edicao_festa', $id, $oldValues, $payload);

        return $this->jsonSuccess(new EdicaoFestaResource(EdicaoFesta::query()->findOrFail($id)));
    }

    public function destroy(Request $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id) {
            $db = DB::connection($writeConnection);
            $row = $db->table('Edicao_Festa')->where('id_edicao', $id)->first();
            abort_if($row === null, 404);

            $eventosCount = $db->table('Programacao_Eventos')->where('id_edicao_festa', $id)->count();
            $diasCount = $db->table('dias_festa_evento')->where('id_edicao', $id)->count();

            if ($eventosCount > 0 || $diasCount > 0) {
                abort(response()->json([
                    'success' => false,
                    'message' => 'Edicao possui programacao vinculada.',
                    'code' => 'FESTA_DIVINO_ENTITY_HAS_DEPENDENCIES',
                    'errors' => ['id' => ['Remova eventos e dias antes de excluir.']],
                ], 409));
            }

            $db->table('Edicao_Festa')->where('id_edicao', $id)->delete();

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'delete', 'edicao_festa', $id, $oldValues, null);

        return $this->jsonDeleted('Edicao removida com sucesso.');
    }

    private function authorizeWrite(Request $request): void
    {
        $this->authorizeFestaDivino($request, 'festa-divino.programacao.manage');
        abort_unless($request->user()?->can('festa-divino.write'), 403);
    }

    private function payload(array $data): array
    {
        return [
            'ano_festa' => $data['ano'],
            'titulo_festa' => $data['titulo'],
            'data_inicio_programacao' => $data['data_inicio_programacao'],
            'data_fim_programacao' => $data['data_fim_programacao'],
            'data_inicio_festejos' => $data['data_inicio_festejos'],
            'data_fim_festejos' => $data['data_fim_festejos'],
            'bandeireira_imperial' => $data['bandeireira_imperial'] ?? null,
            'comissao_organizadora' => $data['comissao_organizadora'] ?? null,
            'texto_convite_principal' => $data['texto_convite_principal'] ?? null,
            'imagem_cartaz_url' => $data['imagem_cartaz_url'] ?? null,
            'tema_geral_festa' => $data['tema_geral'] ?? null,
        ];
    }
}
