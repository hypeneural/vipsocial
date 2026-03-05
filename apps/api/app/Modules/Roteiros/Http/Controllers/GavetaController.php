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
                AllowedFilter::partial('search', 'titulo'),
            ])
            ->allowedIncludes(['user'])
            ->defaultSort('-created_at')
            ->paginate($request->get('per_page', 15));

        return $this->jsonPaginated($gavetas, GavetaResource::class);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
        ]);

        $data['active'] = true;
        // The user ID should be assigned automatically to the logged-in user
        if (auth()->check()) {
            $data['user_id'] = auth()->id();
        }

        $gaveta = Gaveta::create($data);
        return $this->jsonCreated(new GavetaResource($gaveta->load('user')));
    }

    public function show(int $id): JsonResponse
    {
        $gaveta = Gaveta::with('user')->findOrFail($id);
        return $this->jsonSuccess(new GavetaResource($gaveta));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $gaveta = Gaveta::findOrFail($id);
        $gaveta->update($request->validate([
            'titulo' => ['sometimes', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
            'active' => ['sometimes', 'boolean'],
            'is_checked' => ['sometimes', 'boolean'],
        ]));

        return $this->jsonSuccess(new GavetaResource($gaveta->load('user')), 'Notícia de gaveta atualizada');
    }

    public function destroy(int $id): JsonResponse
    {
        Gaveta::findOrFail($id)->delete();
        return $this->jsonDeleted('Notícia de gaveta removida');
    }
}
