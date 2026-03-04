<?php

namespace App\Modules\Roteiros\Http\Controllers;

use App\Modules\Roteiros\Http\Resources\StatusMateriaResource;
use App\Modules\Roteiros\Models\StatusMateria;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class StatusMateriaController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $statuses = QueryBuilder::for(StatusMateria::class)
            ->allowedFilters([
                AllowedFilter::exact('active'),
                AllowedFilter::partial('search', 'nome'),
            ])
            ->allowedSorts(['nome', 'ordem', 'created_at'])
            ->defaultSort('ordem')
            ->paginate($request->get('per_page', 50));

        return $this->jsonPaginated($statuses, StatusMateriaResource::class);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nome' => ['required', 'string', 'max:100'],
            'icone' => ['nullable', 'string', 'max:50'],
            'cor' => ['nullable', 'string', 'max:30'],
        ]);

        $data['slug'] = Str::slug($data['nome'], '_');
        $data['icone'] = $data['icone'] ?? '⚪';
        $data['ordem'] = StatusMateria::max('ordem') + 1;

        $status = StatusMateria::create($data);

        return $this->jsonCreated(new StatusMateriaResource($status));
    }

    public function show(int $id): JsonResponse
    {
        $status = StatusMateria::findOrFail($id);
        return $this->jsonSuccess(new StatusMateriaResource($status));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $status = StatusMateria::findOrFail($id);

        $data = $request->validate([
            'nome' => ['sometimes', 'string', 'max:100'],
            'icone' => ['nullable', 'string', 'max:50'],
            'cor' => ['nullable', 'string', 'max:30'],
            'active' => ['sometimes', 'boolean'],
        ]);

        if (isset($data['nome'])) {
            $data['slug'] = Str::slug($data['nome'], '_');
        }

        $status->update($data);
        return $this->jsonSuccess(new StatusMateriaResource($status), 'Status atualizado');
    }

    public function destroy(int $id): JsonResponse
    {
        $status = StatusMateria::findOrFail($id);
        $status->delete();
        return $this->jsonDeleted('Status removido');
    }
}
