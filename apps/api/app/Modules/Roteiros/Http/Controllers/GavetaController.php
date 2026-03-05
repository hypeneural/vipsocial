<?php

namespace App\Modules\Roteiros\Http\Controllers;

use App\Modules\Roteiros\Http\Resources\GavetaResource;
use App\Modules\Roteiros\Models\Gaveta;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;
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

    /**
     * GET /gavetas/{id}/logs
     */
    public function logs(Request $request, int $id): JsonResponse
    {
        $gaveta = Gaveta::findOrFail($id);

        $logs = Activity::where('subject_type', Gaveta::class)
            ->where('subject_id', $gaveta->id)
            ->with('causer:id,name,email,avatar_url')
            ->latest()
            ->paginate($request->get('per_page', 50));

        $data = collect($logs->items())->map(fn(Activity $log) => $this->formatLogEntry($log));

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total(),
            ],
        ]);
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

        return $this->jsonSuccess(
            new GavetaResource($gaveta->load('user')),
            'Noticia de gaveta atualizada'
        );
    }

    public function destroy(int $id): JsonResponse
    {
        Gaveta::findOrFail($id)->delete();

        return $this->jsonDeleted('Noticia de gaveta removida');
    }

    private function formatLogEntry(Activity $log): array
    {
        $props = $log->properties->toArray();
        $causer = $log->causer;

        return [
            'id' => (string) $log->id,
            'user_id' => $causer ? (string) $causer->id : null,
            'user_name' => $causer?->name ?? 'Sistema',
            'user_email' => $causer?->email ?? '-',
            'user_avatar' => $causer?->avatar_url ?? null,
            'action' => $props['action'] ?? 'update',
            'module' => $props['module'] ?? 'roteiros',
            'resource_name' => $props['resource_name'] ?? null,
            'subject_id' => $log->subject_id ? (string) $log->subject_id : null,
            'description' => $log->description,
            'changes' => $props['changes'] ?? null,
            'created_at' => $log->created_at->toIso8601String(),
        ];
    }
}
