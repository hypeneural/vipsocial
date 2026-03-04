<?php

namespace App\Modules\Roteiros\Http\Controllers;

use App\Modules\Roteiros\Http\Resources\GavetaResource;
use App\Modules\Roteiros\Models\Gaveta;
use App\Modules\Roteiros\Models\NoticiaGaveta;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class GavetaController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $gavetas = QueryBuilder::for(Gaveta::class)
            ->allowedFilters([
                AllowedFilter::exact('active'),
                AllowedFilter::partial('search', 'nome'),
            ])
            ->allowedIncludes(['noticias'])
            ->withCount('noticias')
            ->defaultSort('-created_at')
            ->paginate($request->get('per_page', 15));

        return $this->jsonPaginated($gavetas, GavetaResource::class);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
        ]);

        $gaveta = Gaveta::create($data);
        return $this->jsonCreated(new GavetaResource($gaveta));
    }

    public function show(int $id): JsonResponse
    {
        $gaveta = Gaveta::with('noticias')->withCount('noticias')->findOrFail($id);
        return $this->jsonSuccess(new GavetaResource($gaveta));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $gaveta = Gaveta::findOrFail($id);
        $gaveta->update($request->validate([
            'nome' => ['sometimes', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
            'active' => ['sometimes', 'boolean'],
        ]));

        return $this->jsonSuccess(new GavetaResource($gaveta), 'Gaveta atualizada');
    }

    public function destroy(int $id): JsonResponse
    {
        Gaveta::findOrFail($id)->delete();
        return $this->jsonDeleted('Gaveta removida');
    }

    // ── Notícias (nested) ────────────────────────────────

    public function addNoticia(Request $request, int $gavetaId): JsonResponse
    {
        $gaveta = Gaveta::findOrFail($gavetaId);
        $maxOrdem = $gaveta->noticias()->max('ordem') ?? 0;

        $data = $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'conteudo' => ['nullable', 'string'],
        ]);

        $noticia = $gaveta->noticias()->create(array_merge($data, [
            'ordem' => $maxOrdem + 1,
        ]));

        return $this->jsonCreated($noticia);
    }

    public function updateNoticia(Request $request, int $gavetaId, int $noticiaId): JsonResponse
    {
        $noticia = NoticiaGaveta::where('gaveta_id', $gavetaId)->findOrFail($noticiaId);
        $noticia->update($request->only(['titulo', 'conteudo', 'is_checked']));

        return $this->jsonSuccess($noticia, 'Notícia atualizada');
    }

    public function deleteNoticia(int $gavetaId, int $noticiaId): JsonResponse
    {
        NoticiaGaveta::where('gaveta_id', $gavetaId)->findOrFail($noticiaId)->delete();
        return $this->jsonDeleted('Notícia removida');
    }
}
