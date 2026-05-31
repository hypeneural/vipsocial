<?php

namespace App\Modules\FestaDivino\Http\Controllers;

use App\Modules\FestaDivino\Actions\Shared\FestaDivinoAuditLogger;
use App\Modules\FestaDivino\Actions\Shared\FestaDivinoWriteGuard;
use App\Modules\FestaDivino\Http\Controllers\Concerns\AuthorizesFestaDivino;
use App\Modules\FestaDivino\Http\Requests\CardapioCategoriaRequest;
use App\Modules\FestaDivino\Http\Resources\CategoriaCardapioResource;
use App\Modules\FestaDivino\Models\CategoriaCardapio;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CardapioCategoriaController extends BaseController
{
    use AuthorizesFestaDivino;

    public function index(Request $request): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $categorias = QueryBuilder::for(CategoriaCardapio::class)
            ->allowedFilters([
                AllowedFilter::partial('search', 'nome_categoria'),
            ])
            ->allowedSorts(['nome_categoria', 'id_categoria'])
            ->withCount('produtos')
            ->defaultSort('nome_categoria')
            ->paginate($request->integer('per_page', 50));

        return $this->jsonPaginated($categorias, CategoriaCardapioResource::class);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $categoria = CategoriaCardapio::query()
            ->withCount('produtos')
            ->findOrFail($id);

        return $this->jsonSuccess(new CategoriaCardapioResource($categoria));
    }

    public function store(CardapioCategoriaRequest $request, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $id = DB::connection($writeConnection)->transaction(
            fn () => DB::connection($writeConnection)->table('categoria')->insertGetId($payload),
            3
        );

        $auditLogger->log($request, 'create', 'cardapio_categoria', $id, null, $payload);

        return $this->jsonCreated(new CategoriaCardapioResource(
            CategoriaCardapio::query()->withCount('produtos')->findOrFail($id)
        ));
    }

    public function update(
        CardapioCategoriaRequest $request,
        int $id,
        FestaDivinoAuditLogger $auditLogger
    ): JsonResponse {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload) {
            $db = DB::connection($writeConnection);
            $row = $db->table('categoria')->where('id_categoria', $id)->first();
            abort_if($row === null, 404);

            $db->table('categoria')->where('id_categoria', $id)->update($payload);

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'update', 'cardapio_categoria', $id, $oldValues, $payload);

        return $this->jsonSuccess(new CategoriaCardapioResource(
            CategoriaCardapio::query()->withCount('produtos')->findOrFail($id)
        ));
    }

    public function destroy(Request $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id) {
            $db = DB::connection($writeConnection);
            $row = $db->table('categoria')->where('id_categoria', $id)->first();
            abort_if($row === null, 404);

            $productsCount = $db->table('produto')->where('id_categoria', $id)->count();
            if ($productsCount > 0) {
                abort(response()->json([
                    'success' => false,
                    'message' => 'Categoria possui produtos vinculados.',
                    'code' => 'FESTA_DIVINO_ENTITY_HAS_DEPENDENCIES',
                    'errors' => ['id' => ['Mova ou remova os produtos antes de excluir.']],
                ], 409));
            }

            $db->table('categoria')->where('id_categoria', $id)->delete();

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'delete', 'cardapio_categoria', $id, $oldValues, null);

        return $this->jsonDeleted('Categoria do cardapio removida com sucesso.');
    }

    private function authorizeWrite(Request $request): void
    {
        $this->authorizeFestaDivino($request, 'festa-divino.cardapio.manage');
        abort_unless($request->user()?->can('festa-divino.write'), 403);
    }

    private function payload(array $data): array
    {
        return [
            'nome_categoria' => $data['nome'],
            'icone_categoria' => $data['icone'],
        ];
    }
}
