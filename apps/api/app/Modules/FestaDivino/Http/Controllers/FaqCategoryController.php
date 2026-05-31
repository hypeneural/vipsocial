<?php

namespace App\Modules\FestaDivino\Http\Controllers;

use App\Modules\FestaDivino\Actions\Shared\FestaDivinoAuditLogger;
use App\Modules\FestaDivino\Actions\Shared\FestaDivinoWriteGuard;
use App\Modules\FestaDivino\Http\Controllers\Concerns\AuthorizesFestaDivino;
use App\Modules\FestaDivino\Http\Requests\FaqCategoryRequest;
use App\Modules\FestaDivino\Http\Requests\FaqReorderRequest;
use App\Modules\FestaDivino\Http\Requests\FaqStatusRequest;
use App\Modules\FestaDivino\Http\Resources\FaqCategoryResource;
use App\Modules\FestaDivino\Models\FaqCategory;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class FaqCategoryController extends BaseController
{
    use AuthorizesFestaDivino;

    public function index(Request $request): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $categorias = QueryBuilder::for(FaqCategory::class)
            ->allowedFilters([
                AllowedFilter::exact('is_active'),
                AllowedFilter::partial('search', 'name'),
            ])
            ->allowedSorts(['display_order', 'name', 'id'])
            ->withCount('items')
            ->defaultSort('display_order')
            ->paginate($request->integer('per_page', 50));

        return $this->jsonPaginated($categorias, FaqCategoryResource::class);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $categoria = FaqCategory::query()
            ->withCount('items')
            ->findOrFail($id);

        return $this->jsonSuccess(new FaqCategoryResource($categoria));
    }

    public function store(FaqCategoryRequest $request, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated(), true);
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $id = DB::connection($writeConnection)->transaction(
            fn () => DB::connection($writeConnection)->table('faq_category')->insertGetId($payload),
            3
        );

        $auditLogger->log($request, 'create', 'faq_categoria', $id, null, $payload);

        return $this->jsonCreated(new FaqCategoryResource(
            FaqCategory::query()->withCount('items')->findOrFail($id)
        ));
    }

    public function update(
        FaqCategoryRequest $request,
        int $id,
        FestaDivinoAuditLogger $auditLogger
    ): JsonResponse {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload) {
            $db = DB::connection($writeConnection);
            $row = $db->table('faq_category')->where('id', $id)->first();
            abort_if($row === null, 404);

            $db->table('faq_category')->where('id', $id)->update($payload);

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'update', 'faq_categoria', $id, $oldValues, $payload);

        return $this->jsonSuccess(new FaqCategoryResource(
            FaqCategory::query()->withCount('items')->findOrFail($id)
        ));
    }

    public function updateStatus(
        FaqStatusRequest $request,
        int $id,
        FestaDivinoAuditLogger $auditLogger
    ): JsonResponse {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = [
            'is_active' => (bool) $request->validated('ativo'),
            'updated_at' => now()->toDateTimeString(),
        ];
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload) {
            $db = DB::connection($writeConnection);
            $row = $db->table('faq_category')->where('id', $id)->first();
            abort_if($row === null, 404);

            $db->table('faq_category')->where('id', $id)->update($payload);

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'status', 'faq_categoria', $id, $oldValues, $payload);

        return $this->jsonSuccess(new FaqCategoryResource(
            FaqCategory::query()->withCount('items')->findOrFail($id)
        ));
    }

    public function reorder(FaqReorderRequest $request, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $items = collect($request->validated('items'))
            ->map(fn (array $item) => ['id' => (int) $item['id'], 'ordem' => (int) $item['ordem']])
            ->values();
        $ids = $items->pluck('id')->all();
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $items, $ids) {
            $db = DB::connection($writeConnection);
            $rows = $db->table('faq_category')
                ->whereIn('id', $ids)
                ->lockForUpdate()
                ->get();

            if ($rows->count() !== count($ids)) {
                abort(response()->json([
                    'success' => false,
                    'message' => 'Uma ou mais categorias nao foram encontradas.',
                    'code' => 'FESTA_DIVINO_FAQ_REORDER_INVALID_ITEMS',
                    'errors' => ['items' => ['Revise os itens enviados para ordenacao.']],
                ], 422));
            }

            foreach ($items as $item) {
                $db->table('faq_category')->where('id', $item['id'])->update([
                    'display_order' => $item['ordem'],
                    'updated_at' => now()->toDateTimeString(),
                ]);
            }

            return $rows->map(fn (object $row) => (array) $row)->all();
        }, 3);

        $auditLogger->log($request, 'reorder', 'faq_categoria', null, $oldValues, $items->all());

        $categorias = FaqCategory::query()
            ->withCount('items')
            ->whereIn('id', $ids)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();

        return $this->jsonSuccess(FaqCategoryResource::collection($categorias));
    }

    public function destroy(Request $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id) {
            $db = DB::connection($writeConnection);
            $row = $db->table('faq_category')->where('id', $id)->first();
            abort_if($row === null, 404);

            $itemsCount = $db->table('faq_item')->where('category_id', $id)->count();
            if ($itemsCount > 0) {
                abort(response()->json([
                    'success' => false,
                    'message' => 'Categoria possui perguntas vinculadas.',
                    'code' => 'FESTA_DIVINO_ENTITY_HAS_DEPENDENCIES',
                    'errors' => ['id' => ['Mova ou remova as perguntas antes de excluir.']],
                ], 409));
            }

            $db->table('faq_category')->where('id', $id)->delete();

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'delete', 'faq_categoria', $id, $oldValues, null);

        return $this->jsonDeleted('Categoria do FAQ removida com sucesso.');
    }

    private function authorizeWrite(Request $request): void
    {
        $this->authorizeFestaDivino($request, 'festa-divino.faq.manage');
        abort_unless($request->user()?->can('festa-divino.write'), 403);
    }

    private function payload(array $data, bool $creating = false): array
    {
        $now = now()->toDateTimeString();
        $payload = [
            'name' => $data['nome'],
            'icon' => $data['icone'],
            'display_order' => $data['ordem'],
            'is_active' => (bool) $data['ativo'],
            'updated_at' => $now,
        ];

        if ($creating) {
            $payload['created_at'] = $now;
        }

        return $payload;
    }
}
