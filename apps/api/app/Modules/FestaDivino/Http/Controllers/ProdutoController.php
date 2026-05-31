<?php

namespace App\Modules\FestaDivino\Http\Controllers;

use App\Modules\FestaDivino\Actions\Shared\FestaDivinoAuditLogger;
use App\Modules\FestaDivino\Actions\Shared\FestaDivinoWriteGuard;
use App\Modules\FestaDivino\Http\Controllers\Concerns\AuthorizesFestaDivino;
use App\Modules\FestaDivino\Http\Requests\ProdutoRequest;
use App\Modules\FestaDivino\Http\Resources\ProdutoResource;
use App\Modules\FestaDivino\Models\Produto;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ProdutoController extends BaseController
{
    use AuthorizesFestaDivino;

    public function index(Request $request): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $produtos = QueryBuilder::for(Produto::class)
            ->allowedFilters([
                AllowedFilter::partial('search', 'nome_produto'),
                AllowedFilter::exact('id_categoria'),
            ])
            ->allowedIncludes(['categoria'])
            ->allowedSorts(['nome_produto', 'preco', 'id_produto'])
            ->defaultSort('nome_produto')
            ->paginate($request->integer('per_page', 50));

        return $this->jsonPaginated($produtos, ProdutoResource::class);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $produto = QueryBuilder::for(Produto::class)
            ->allowedIncludes(['categoria'])
            ->whereKey($id)
            ->firstOrFail();

        return $this->jsonSuccess(new ProdutoResource($produto));
    }

    public function store(ProdutoRequest $request, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $id = DB::connection($writeConnection)->transaction(
            fn () => DB::connection($writeConnection)->table('produto')->insertGetId($payload),
            3
        );

        $auditLogger->log($request, 'create', 'cardapio_produto', $id, null, $payload);

        return $this->jsonCreated(new ProdutoResource($this->findProdutoForResponse($id)));
    }

    public function update(ProdutoRequest $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload) {
            $db = DB::connection($writeConnection);
            $row = $db->table('produto')->where('id_produto', $id)->first();
            abort_if($row === null, 404);

            $db->table('produto')->where('id_produto', $id)->update($payload);

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'update', 'cardapio_produto', $id, $oldValues, $payload);

        return $this->jsonSuccess(new ProdutoResource($this->findProdutoForResponse($id)));
    }

    public function destroy(Request $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id) {
            $db = DB::connection($writeConnection);
            $row = $db->table('produto')->where('id_produto', $id)->first();
            abort_if($row === null, 404);

            $db->table('produto')->where('id_produto', $id)->delete();

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'delete', 'cardapio_produto', $id, $oldValues, null);

        return $this->jsonDeleted('Produto removido com sucesso.');
    }

    private function authorizeWrite(Request $request): void
    {
        $this->authorizeFestaDivino($request, 'festa-divino.cardapio.manage');
        abort_unless($request->user()?->can('festa-divino.write'), 403);
    }

    private function payload(array $data): array
    {
        return [
            'nome_produto' => $data['nome'],
            'preco' => $data['preco'],
            'foto' => $data['foto'] ?? null,
            'id_categoria' => $data['categoria_id'],
        ];
    }

    private function findProdutoForResponse(int $id): Produto
    {
        return Produto::query()
            ->with('categoria')
            ->findOrFail($id);
    }
}
