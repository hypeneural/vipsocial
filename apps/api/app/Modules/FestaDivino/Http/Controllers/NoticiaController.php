<?php

namespace App\Modules\FestaDivino\Http\Controllers;

use App\Modules\FestaDivino\Actions\Shared\FestaDivinoAuditLogger;
use App\Modules\FestaDivino\Actions\Shared\FestaDivinoWriteGuard;
use App\Modules\FestaDivino\Http\Controllers\Concerns\AuthorizesFestaDivino;
use App\Modules\FestaDivino\Http\Requests\NoticiaFestaRequest;
use App\Modules\FestaDivino\Http\Resources\NoticiaFestaResource;
use App\Modules\FestaDivino\Models\NoticiaFesta;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class NoticiaController extends BaseController
{
    use AuthorizesFestaDivino;

    public function index(Request $request): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $noticias = QueryBuilder::for(NoticiaFesta::class)
            ->allowedFilters([
                AllowedFilter::partial('search', 'titulo'),
            ])
            ->allowedSorts(['titulo', 'data_hora_publicacao', 'data_cadastro'])
            ->defaultSort('-data_hora_publicacao')
            ->paginate($request->integer('per_page', 25));

        return $this->jsonPaginated($noticias, NoticiaFestaResource::class);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        return $this->jsonSuccess(new NoticiaFestaResource(NoticiaFesta::query()->findOrFail($id)));
    }

    public function store(NoticiaFestaRequest $request, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated(), true);
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $id = DB::connection($writeConnection)->transaction(
            fn () => DB::connection($writeConnection)->table('noticias_festa')->insertGetId($payload),
            3
        );

        $auditLogger->log($request, 'create', 'conteudo_noticia', $id, null, $payload);

        return $this->jsonCreated(new NoticiaFestaResource(NoticiaFesta::query()->findOrFail($id)));
    }

    public function update(NoticiaFestaRequest $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload) {
            $db = DB::connection($writeConnection);
            $row = $db->table('noticias_festa')->where('id_noticia', $id)->first();
            abort_if($row === null, 404);

            $db->table('noticias_festa')->where('id_noticia', $id)->update($payload);

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'update', 'conteudo_noticia', $id, $oldValues, $payload);

        return $this->jsonSuccess(new NoticiaFestaResource(NoticiaFesta::query()->findOrFail($id)));
    }

    public function destroy(Request $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id) {
            $db = DB::connection($writeConnection);
            $row = $db->table('noticias_festa')->where('id_noticia', $id)->first();
            abort_if($row === null, 404);

            $db->table('noticias_festa')->where('id_noticia', $id)->delete();

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'delete', 'conteudo_noticia', $id, $oldValues, null);

        return $this->jsonDeleted('Noticia removida com sucesso.');
    }

    private function authorizeWrite(Request $request): void
    {
        $this->authorizeFestaDivino($request, 'festa-divino.conteudo.manage');
        abort_unless($request->user()?->can('festa-divino.write'), 403);
    }

    private function payload(array $data, bool $creating = false): array
    {
        $payload = [
            'titulo' => $data['titulo'],
            'linha_apoio' => $data['linha_apoio'] ?? null,
            'url_noticia' => $data['url'],
            'data_hora_publicacao' => $data['data_hora_publicacao'].':00',
            'url_thumb' => $data['thumb_url'] ?? null,
        ];

        if ($creating) {
            $payload['data_cadastro'] = now()->toDateTimeString();
        }

        return $payload;
    }
}
