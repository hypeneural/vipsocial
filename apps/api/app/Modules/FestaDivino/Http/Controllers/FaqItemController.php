<?php

namespace App\Modules\FestaDivino\Http\Controllers;

use App\Modules\FestaDivino\Actions\Shared\FestaDivinoAuditLogger;
use App\Modules\FestaDivino\Actions\Shared\FestaDivinoWriteGuard;
use App\Modules\FestaDivino\Http\Controllers\Concerns\AuthorizesFestaDivino;
use App\Modules\FestaDivino\Http\Requests\FaqItemRequest;
use App\Modules\FestaDivino\Http\Requests\FaqReorderRequest;
use App\Modules\FestaDivino\Http\Requests\FaqStatusRequest;
use App\Modules\FestaDivino\Http\Resources\FaqItemResource;
use App\Modules\FestaDivino\Models\FaqItem;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class FaqItemController extends BaseController
{
    use AuthorizesFestaDivino;

    public function index(Request $request): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $items = QueryBuilder::for(FaqItem::class)
            ->allowedFilters([
                AllowedFilter::exact('category_id'),
                AllowedFilter::exact('is_active'),
                AllowedFilter::partial('search', 'question'),
            ])
            ->allowedIncludes(['category'])
            ->allowedSorts(['display_order', 'category_id', 'id'])
            ->defaultSort('category_id', 'display_order')
            ->paginate($request->integer('per_page', 50));

        return $this->jsonPaginated($items, FaqItemResource::class);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $item = QueryBuilder::for(FaqItem::class)
            ->allowedIncludes(['category'])
            ->whereKey($id)
            ->firstOrFail();

        return $this->jsonSuccess(new FaqItemResource($item));
    }

    public function store(FaqItemRequest $request, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated(), true);
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $id = DB::connection($writeConnection)->transaction(
            fn () => DB::connection($writeConnection)->table('faq_item')->insertGetId($payload),
            3
        );

        $auditLogger->log($request, 'create', 'faq_item', $id, null, $payload);

        return $this->jsonCreated(new FaqItemResource(
            FaqItem::query()->with('category')->findOrFail($id)
        ));
    }

    public function update(FaqItemRequest $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload) {
            $db = DB::connection($writeConnection);
            $row = $db->table('faq_item')->where('id', $id)->first();
            abort_if($row === null, 404);

            $db->table('faq_item')->where('id', $id)->update($payload);

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'update', 'faq_item', $id, $oldValues, $payload);

        return $this->jsonSuccess(new FaqItemResource(
            FaqItem::query()->with('category')->findOrFail($id)
        ));
    }

    public function updateStatus(FaqStatusRequest $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = [
            'is_active' => (bool) $request->validated('ativo'),
            'updated_at' => now()->toDateTimeString(),
        ];
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload) {
            $db = DB::connection($writeConnection);
            $row = $db->table('faq_item')->where('id', $id)->first();
            abort_if($row === null, 404);

            $db->table('faq_item')->where('id', $id)->update($payload);

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'status', 'faq_item', $id, $oldValues, $payload);

        return $this->jsonSuccess(new FaqItemResource(
            FaqItem::query()->with('category')->findOrFail($id)
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
            $rows = $db->table('faq_item')
                ->whereIn('id', $ids)
                ->lockForUpdate()
                ->get();

            if ($rows->count() !== count($ids)) {
                abort(response()->json([
                    'success' => false,
                    'message' => 'Uma ou mais perguntas nao foram encontradas.',
                    'code' => 'FESTA_DIVINO_FAQ_REORDER_INVALID_ITEMS',
                    'errors' => ['items' => ['Revise os itens enviados para ordenacao.']],
                ], 422));
            }

            foreach ($items as $item) {
                $db->table('faq_item')->where('id', $item['id'])->update([
                    'display_order' => $item['ordem'],
                    'updated_at' => now()->toDateTimeString(),
                ]);
            }

            return $rows->map(fn (object $row) => (array) $row)->all();
        }, 3);

        $auditLogger->log($request, 'reorder', 'faq_item', null, $oldValues, $items->all());

        $items = FaqItem::query()
            ->with('category')
            ->whereIn('id', $ids)
            ->orderBy('category_id')
            ->orderBy('display_order')
            ->get();

        return $this->jsonSuccess(FaqItemResource::collection($items));
    }

    public function destroy(Request $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id) {
            $db = DB::connection($writeConnection);
            $row = $db->table('faq_item')->where('id', $id)->first();
            abort_if($row === null, 404);

            $db->table('faq_item')->where('id', $id)->delete();

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'delete', 'faq_item', $id, $oldValues, null);

        return $this->jsonDeleted('Pergunta do FAQ removida com sucesso.');
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
            'category_id' => $data['category_id'],
            'question' => $data['pergunta'],
            'answer' => $data['resposta'],
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
