<?php

namespace App\Modules\FestaDivino\Http\Controllers;

use App\Modules\FestaDivino\Actions\Shared\FestaDivinoAuditLogger;
use App\Modules\FestaDivino\Actions\Shared\FestaDivinoWriteGuard;
use App\Modules\FestaDivino\Http\Controllers\Concerns\AuthorizesFestaDivino;
use App\Modules\FestaDivino\Http\Requests\ShortVideoRequest;
use App\Modules\FestaDivino\Http\Resources\ShortVideoResource;
use App\Modules\FestaDivino\Models\ShortVideo;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ShortController extends BaseController
{
    use AuthorizesFestaDivino;

    public function index(Request $request): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $shorts = QueryBuilder::for(ShortVideo::class)
            ->allowedFilters([
                AllowedFilter::partial('search', 'title'),
            ])
            ->allowedSorts(['title', 'created_at', 'updated_at'])
            ->defaultSort('-created_at')
            ->paginate($request->integer('per_page', 25));

        return $this->jsonPaginated($shorts, ShortVideoResource::class);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        return $this->jsonSuccess(new ShortVideoResource(ShortVideo::query()->findOrFail($id)));
    }

    public function store(ShortVideoRequest $request, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated(), true);
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        DB::connection($writeConnection)->transaction(
            fn () => DB::connection($writeConnection)->table('shorts_videos')->insert($payload),
            3
        );

        $auditLogger->log($request, 'create', 'midia_short', $payload['id'], null, $payload);

        return $this->jsonCreated(new ShortVideoResource(ShortVideo::query()->findOrFail($payload['id'])));
    }

    public function update(ShortVideoRequest $request, string $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload) {
            $db = DB::connection($writeConnection);
            $row = $db->table('shorts_videos')->where('id', $id)->first();
            abort_if($row === null, 404);

            $db->table('shorts_videos')->where('id', $id)->update($payload);

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'update', 'midia_short', $id, $oldValues, $payload);

        return $this->jsonSuccess(new ShortVideoResource(ShortVideo::query()->findOrFail($id)));
    }

    public function destroy(Request $request, string $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id) {
            $db = DB::connection($writeConnection);
            $row = $db->table('shorts_videos')->where('id', $id)->first();
            abort_if($row === null, 404);

            $db->table('shorts_videos')->where('id', $id)->delete();

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'delete', 'midia_short', $id, $oldValues, null);

        return $this->jsonDeleted('Short removido com sucesso.');
    }

    private function authorizeWrite(Request $request): void
    {
        $this->authorizeFestaDivino($request, 'festa-divino.conteudo.manage');
        abort_unless($request->user()?->can('festa-divino.write'), 403);
    }

    private function payload(array $data, bool $creating = false): array
    {
        $payload = [
            'title' => $data['titulo'],
            'thumb_url' => $data['thumb_url'] ?? null,
            'updated_at' => now()->toDateTimeString(),
        ];

        if ($creating) {
            $payload['id'] = $data['id'];
            $payload['created_at'] = now()->toDateTimeString();
        }

        return $payload;
    }
}
