<?php

namespace App\Modules\FestaDivino\Http\Controllers;

use App\Modules\FestaDivino\Actions\Shared\FestaDivinoAuditLogger;
use App\Modules\FestaDivino\Actions\Shared\FestaDivinoWriteGuard;
use App\Modules\FestaDivino\Http\Controllers\Concerns\AuthorizesFestaDivino;
use App\Modules\FestaDivino\Http\Requests\DivinoTextoRequest;
use App\Modules\FestaDivino\Http\Resources\DivinoTextoResource;
use App\Modules\FestaDivino\Models\DivinoTexto;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class TextoController extends BaseController
{
    use AuthorizesFestaDivino;

    public function index(Request $request): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $textos = QueryBuilder::for(DivinoTexto::class)
            ->allowedFilters([
                AllowedFilter::exact('categoria'),
                AllowedFilter::partial('search', 'texto_curto'),
            ])
            ->allowedSorts(['categoria', 'criado_em', 'atualizado_em'])
            ->defaultSort('-criado_em')
            ->paginate($request->integer('per_page', 25));

        return $this->jsonPaginated($textos, DivinoTextoResource::class);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        return $this->jsonSuccess(new DivinoTextoResource(DivinoTexto::query()->findOrFail($id)));
    }

    public function store(DivinoTextoRequest $request, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated(), true);
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $id = DB::connection($writeConnection)->transaction(
            fn () => DB::connection($writeConnection)->table('divino_textos')->insertGetId($payload),
            3
        );

        $auditLogger->log($request, 'create', 'conteudo_texto', $id, null, $payload);

        return $this->jsonCreated(new DivinoTextoResource(DivinoTexto::query()->findOrFail($id)));
    }

    public function update(DivinoTextoRequest $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload) {
            $db = DB::connection($writeConnection);
            $row = $db->table('divino_textos')->where('id', $id)->first();
            abort_if($row === null, 404);

            $db->table('divino_textos')->where('id', $id)->update($payload);

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'update', 'conteudo_texto', $id, $oldValues, $payload);

        return $this->jsonSuccess(new DivinoTextoResource(DivinoTexto::query()->findOrFail($id)));
    }

    public function destroy(Request $request, int $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id) {
            $db = DB::connection($writeConnection);
            $row = $db->table('divino_textos')->where('id', $id)->first();
            abort_if($row === null, 404);

            $db->table('divino_textos')->where('id', $id)->delete();

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'delete', 'conteudo_texto', $id, $oldValues, null);

        return $this->jsonDeleted('Texto removido com sucesso.');
    }

    private function authorizeWrite(Request $request): void
    {
        $this->authorizeFestaDivino($request, 'festa-divino.conteudo.manage');
        abort_unless($request->user()?->can('festa-divino.write'), 403);
    }

    private function payload(array $data, bool $creating = false): array
    {
        $now = now()->toDateTimeString();
        $payload = [
            'texto_curto' => $data['texto_curto'],
            'texto_detalhado' => $data['texto_detalhado'],
            'categoria' => $data['categoria'],
            'icone_categoria' => $data['icone_categoria'] ?? null,
            'atualizado_em' => $now,
        ];

        if ($creating) {
            $payload['criado_em'] = $now;
        }

        return $payload;
    }
}
