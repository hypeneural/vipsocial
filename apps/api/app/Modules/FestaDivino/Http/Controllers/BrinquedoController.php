<?php

namespace App\Modules\FestaDivino\Http\Controllers;

use App\Modules\FestaDivino\Actions\Shared\FestaDivinoAuditLogger;
use App\Modules\FestaDivino\Actions\Shared\FestaDivinoWriteGuard;
use App\Modules\FestaDivino\Http\Controllers\Concerns\AuthorizesFestaDivino;
use App\Modules\FestaDivino\Http\Requests\BrinquedoRequest;
use App\Modules\FestaDivino\Http\Requests\FaqStatusRequest;
use App\Modules\FestaDivino\Http\Resources\BrinquedoResource;
use App\Modules\FestaDivino\Models\Brinquedo;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class BrinquedoController extends BaseController
{
    use AuthorizesFestaDivino;

    public function index(Request $request): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $brinquedos = QueryBuilder::for(Brinquedo::class)
            ->allowedFilters([
                AllowedFilter::exact('active'),
                AllowedFilter::partial('search', 'nome'),
            ])
            ->allowedSorts(['nome', 'active', 'created_at', 'updated_at'])
            ->defaultSort('nome')
            ->paginate($request->integer('per_page', 50));

        return $this->jsonPaginated($brinquedos, BrinquedoResource::class);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        return $this->jsonSuccess(new BrinquedoResource(Brinquedo::query()->findOrFail($id)));
    }

    public function store(BrinquedoRequest $request, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated(), true);
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $id = DB::connection($writeConnection)->transaction(
            fn () => DB::connection($writeConnection)->table('brinquedos')->insertGetId($payload),
            3
        );

        $auditLogger->log($request, 'create', 'brinquedo', $id, null, $payload);

        return $this->jsonCreated(new BrinquedoResource(Brinquedo::query()->findOrFail($id)));
    }

    public function update(BrinquedoRequest $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload) {
            $db = DB::connection($writeConnection);
            $row = $db->table('brinquedos')->where('id', $id)->first();
            abort_if($row === null, 404);

            $db->table('brinquedos')->where('id', $id)->update($payload);

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'update', 'brinquedo', $id, $oldValues, $payload);

        return $this->jsonSuccess(new BrinquedoResource(Brinquedo::query()->findOrFail($id)));
    }

    public function updateStatus(FaqStatusRequest $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = [
            'active' => (bool) $request->validated('ativo'),
            'updated_at' => now()->toDateTimeString(),
        ];
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload) {
            $db = DB::connection($writeConnection);
            $row = $db->table('brinquedos')->where('id', $id)->first();
            abort_if($row === null, 404);

            $db->table('brinquedos')->where('id', $id)->update($payload);

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'status', 'brinquedo', $id, $oldValues, $payload);

        return $this->jsonSuccess(new BrinquedoResource(Brinquedo::query()->findOrFail($id)));
    }

    public function destroy(Request $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id) {
            $db = DB::connection($writeConnection);
            $row = $db->table('brinquedos')->where('id', $id)->first();
            abort_if($row === null, 404);

            $db->table('brinquedos')->where('id', $id)->delete();

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'delete', 'brinquedo', $id, $oldValues, null);

        return $this->jsonDeleted('Brinquedo removido com sucesso.');
    }

    private function authorizeWrite(Request $request): void
    {
        $this->authorizeFestaDivino($request, 'festa-divino.brinquedos.manage');
        abort_unless($request->user()?->can('festa-divino.write'), 403);
    }

    private function payload(array $data, bool $creating = false): array
    {
        $now = now()->toDateTimeString();
        $payload = [
            'nome' => $data['nome'],
            'descricao' => $data['descricao'],
            'video' => $data['video'],
            'thumb_url' => $data['thumb_url'],
            'active' => (bool) $data['ativo'],
            'updated_at' => $now,
        ];

        if ($creating) {
            $payload['created_at'] = $now;
        }

        return $payload;
    }
}
