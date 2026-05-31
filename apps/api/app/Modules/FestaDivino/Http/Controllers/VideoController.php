<?php

namespace App\Modules\FestaDivino\Http\Controllers;

use App\Modules\FestaDivino\Actions\Shared\FestaDivinoAuditLogger;
use App\Modules\FestaDivino\Actions\Shared\FestaDivinoWriteGuard;
use App\Modules\FestaDivino\Http\Controllers\Concerns\AuthorizesFestaDivino;
use App\Modules\FestaDivino\Http\Requests\YoutubeVideoRequest;
use App\Modules\FestaDivino\Http\Resources\YoutubeVideoResource;
use App\Modules\FestaDivino\Models\YoutubeVideo;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class VideoController extends BaseController
{
    use AuthorizesFestaDivino;

    public function index(Request $request): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        $videos = QueryBuilder::for(YoutubeVideo::class)
            ->allowedFilters([
                AllowedFilter::partial('search', 'title'),
            ])
            ->allowedSorts(['title', 'create_at', 'update_at'])
            ->defaultSort('-create_at')
            ->paginate($request->integer('per_page', 25));

        return $this->jsonPaginated($videos, YoutubeVideoResource::class);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $this->authorizeFestaDivino($request);

        return $this->jsonSuccess(new YoutubeVideoResource(YoutubeVideo::query()->findOrFail($id)));
    }

    public function store(YoutubeVideoRequest $request, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated(), true);
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        DB::connection($writeConnection)->transaction(
            fn () => DB::connection($writeConnection)->table('youtube_videos')->insert($payload),
            3
        );

        $auditLogger->log($request, 'create', 'midia_video', $payload['id'], null, $payload);

        return $this->jsonCreated(new YoutubeVideoResource(YoutubeVideo::query()->findOrFail($payload['id'])));
    }

    public function update(YoutubeVideoRequest $request, string $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $payload = $this->payload($request->validated());
        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id, $payload) {
            $db = DB::connection($writeConnection);
            $row = $db->table('youtube_videos')->where('id', $id)->first();
            abort_if($row === null, 404);

            $db->table('youtube_videos')->where('id', $id)->update($payload);

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'update', 'midia_video', $id, $oldValues, $payload);

        return $this->jsonSuccess(new YoutubeVideoResource(YoutubeVideo::query()->findOrFail($id)));
    }

    public function destroy(Request $request, string $id, FestaDivinoAuditLogger $auditLogger): JsonResponse
    {
        $this->authorizeWrite($request);
        FestaDivinoWriteGuard::assertCanWrite();

        $writeConnection = config('festa-divino.write_connection', 'festa_divino_write');

        $oldValues = DB::connection($writeConnection)->transaction(function () use ($writeConnection, $id) {
            $db = DB::connection($writeConnection);
            $row = $db->table('youtube_videos')->where('id', $id)->first();
            abort_if($row === null, 404);

            $db->table('youtube_videos')->where('id', $id)->delete();

            return (array) $row;
        }, 3);

        $auditLogger->log($request, 'delete', 'midia_video', $id, $oldValues, null);

        return $this->jsonDeleted('Video removido com sucesso.');
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
            'description' => $data['descricao'],
            'thumb_url' => $data['thumb_url'] ?? null,
            'update_at' => now()->toDateTimeString(),
        ];

        if ($creating) {
            $payload['id'] = $data['id'];
            $payload['create_at'] = now()->toDateTimeString();
        }

        return $payload;
    }
}
