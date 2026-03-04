<?php

namespace App\Modules\Roteiros\Http\Controllers;

use App\Modules\Roteiros\Http\Resources\CategoriaResource;
use App\Modules\Roteiros\Models\Categoria;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class CategoriaController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $categorias = QueryBuilder::for(Categoria::class)
            ->allowedFilters([
                AllowedFilter::exact('active'),
                AllowedFilter::partial('search', 'nome'),
            ])
            ->allowedSorts(['nome', 'created_at'])
            ->withCount('materias')
            ->defaultSort('nome')
            ->paginate($request->get('per_page', 50));

        return $this->jsonPaginated($categorias, CategoriaResource::class);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'cor' => ['nullable', 'string', 'max:7'],
        ]);

        $data['slug'] = Str::slug($data['nome']);
        $categoria = Categoria::create($data);

        return $this->jsonCreated(new CategoriaResource($categoria));
    }

    public function show(int $id): JsonResponse
    {
        $categoria = Categoria::withCount('materias')->findOrFail($id);
        return $this->jsonSuccess(new CategoriaResource($categoria));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $categoria = Categoria::findOrFail($id);

        $data = $request->validate([
            'nome' => ['sometimes', 'string', 'max:255'],
            'cor' => ['nullable', 'string', 'max:7'],
            'active' => ['sometimes', 'boolean'],
        ]);

        if (isset($data['nome'])) {
            $data['slug'] = Str::slug($data['nome']);
        }

        $categoria->update($data);
        return $this->jsonSuccess(new CategoriaResource($categoria), 'Categoria atualizada');
    }

    public function destroy(int $id): JsonResponse
    {
        $categoria = Categoria::findOrFail($id);
        $categoria->delete();
        return $this->jsonDeleted('Categoria removida');
    }
}
