<?php

namespace App\Modules\Roteiros\Http\Controllers;

use App\Modules\Roteiros\Actions\CreateRoteiroAction;
use App\Modules\Roteiros\Actions\DuplicateRoteiroAction;
use App\Modules\Roteiros\Actions\ReorderMateriasAction;
use App\Modules\Roteiros\Http\Requests\CreateMateriaRequest;
use App\Modules\Roteiros\Http\Requests\CreateRoteiroRequest;
use App\Modules\Roteiros\Http\Requests\ReorderMateriasRequest;
use App\Modules\Roteiros\Http\Requests\UpdateRoteiroRequest;
use App\Modules\Roteiros\Http\Resources\RoteiroResource;
use App\Modules\Roteiros\Http\Resources\MateriaResource;
use App\Modules\Roteiros\Models\Materia;
use App\Modules\Roteiros\Models\Roteiro;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class RoteiroController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $roteiros = QueryBuilder::for(Roteiro::class)
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('programa'),
                AllowedFilter::exact('data'),
                AllowedFilter::scope('today'),
                AllowedFilter::partial('search', 'titulo'),
            ])
            ->allowedSorts(['data', 'titulo', 'created_at', 'status'])
            ->allowedIncludes(['materias', 'materias.categoria', 'createdBy', 'updatedBy'])
            ->withCount('materias')
            ->defaultSort('-data')
            ->paginate($request->get('per_page', 15));

        return $this->jsonPaginated($roteiros, RoteiroResource::class);
    }

    public function store(CreateRoteiroRequest $request, CreateRoteiroAction $action): JsonResponse
    {
        $roteiro = $action->execute(
            $request->safe()->except('materias'),
            $request->validated('materias'),
        );

        return $this->jsonCreated(new RoteiroResource($roteiro));
    }

    public function show(int $id): JsonResponse
    {
        $roteiro = Roteiro::with(['materias.categoria', 'createdBy', 'updatedBy'])
            ->withCount('materias')
            ->findOrFail($id);

        return $this->jsonSuccess(new RoteiroResource($roteiro));
    }

    public function update(UpdateRoteiroRequest $request, int $id): JsonResponse
    {
        $roteiro = Roteiro::findOrFail($id);

        $data = $request->validated();
        $data['updated_by'] = auth()->id();

        $roteiro->update($data);
        $roteiro->load(['materias.categoria', 'createdBy', 'updatedBy']);

        return $this->jsonSuccess(new RoteiroResource($roteiro), 'Roteiro atualizado');
    }

    public function destroy(int $id): JsonResponse
    {
        $roteiro = Roteiro::findOrFail($id);
        $roteiro->delete();

        return $this->jsonDeleted('Roteiro removido');
    }

    public function duplicate(int $id, DuplicateRoteiroAction $action): JsonResponse
    {
        $original = Roteiro::with('materias')->findOrFail($id);
        $clone = $action->execute($original);

        return $this->jsonCreated(new RoteiroResource($clone), 'Roteiro duplicado');
    }

    // ── Matérias (nested) ────────────────────────────────

    public function addMateria(CreateMateriaRequest $request, int $roteiroId): JsonResponse
    {
        $roteiro = Roteiro::findOrFail($roteiroId);
        $maxOrdem = $roteiro->materias()->max('ordem') ?? 0;

        $materia = $roteiro->materias()->create(array_merge(
            $request->validated(),
            ['ordem' => $maxOrdem + 1]
        ));

        $materia->load('categoria');
        $roteiro->update(['updated_by' => auth()->id()]);

        return $this->jsonCreated(new MateriaResource($materia));
    }

    public function updateMateria(Request $request, int $roteiroId, int $materiaId): JsonResponse
    {
        $materia = Materia::where('roteiro_id', $roteiroId)->findOrFail($materiaId);

        $materia->update($request->only([
            'shortcut',
            'titulo',
            'descricao',
            'duracao',
            'status',
            'categoria_id',
            'creditos_gc',
        ]));

        Roteiro::where('id', $roteiroId)->update(['updated_by' => auth()->id()]);
        $materia->load('categoria');

        return $this->jsonSuccess(new MateriaResource($materia), 'Matéria atualizada');
    }

    public function deleteMateria(int $roteiroId, int $materiaId): JsonResponse
    {
        $materia = Materia::where('roteiro_id', $roteiroId)->findOrFail($materiaId);
        $materia->delete();

        Roteiro::where('id', $roteiroId)->update(['updated_by' => auth()->id()]);

        return $this->jsonDeleted('Matéria removida');
    }

    public function reorderMaterias(ReorderMateriasRequest $request, int $roteiroId, ReorderMateriasAction $action): JsonResponse
    {
        Roteiro::findOrFail($roteiroId);
        $action->execute($request->validated('materias'));

        Roteiro::where('id', $roteiroId)->update(['updated_by' => auth()->id()]);

        return $this->jsonSuccess(null, 'Matérias reordenadas');
    }

    public function findOrCreate(Request $request): JsonResponse
    {
        $date = $request->input('data');

        if (!$date || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return $this->jsonError('Parâmetro "data" é obrigatório (YYYY-MM-DD)', 422);
        }

        $roteiro = Roteiro::with(['materias.categoria', 'createdBy', 'updatedBy'])
            ->where('data', $date)
            ->first();

        if ($roteiro) {
            return $this->jsonSuccess(new RoteiroResource($roteiro));
        }

        // Create new roteiro with 12 empty matérias
        $roteiro = Roteiro::create([
            'titulo' => 'Roteiro ' . \Carbon\Carbon::parse($date)->format('d/m/Y'),
            'data' => $date,
            'status' => 'rascunho',
            'created_by' => auth()->id(),
            'updated_by' => auth()->id(),
        ]);

        for ($i = 1; $i <= 12; $i++) {
            $roteiro->materias()->create([
                'shortcut' => "F{$i}",
                'titulo' => '',
                'descricao' => '',
                'duracao' => '00:00:00',
                'status' => 'pendente',
                'creditos_gc' => '',
                'ordem' => $i,
            ]);
        }

        $roteiro->load(['materias.categoria', 'createdBy', 'updatedBy']);

        return $this->jsonCreated(new RoteiroResource($roteiro), 'Roteiro criado com 12 matérias');
    }

    // ── Audit Logs ──────────────────────────────────────

    /**
     * GET /roteiros/{roteiroId}/materias/{materiaId}/logs
     * Timeline de uma matéria específica
     */
    public function materiaLogs(Request $request, int $roteiroId, int $materiaId): JsonResponse
    {
        $materia = Materia::where('roteiro_id', $roteiroId)->findOrFail($materiaId);

        $logs = Activity::where('subject_type', Materia::class)
            ->where('subject_id', $materia->id)
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

    /**
     * GET /roteiros/logs-by-date?date=YYYY-MM-DD
     * Todos os logs de matérias de um roteiro na data especificada
     */
    public function logsByDate(Request $request): JsonResponse
    {
        $date = $request->get('date');

        if (!$date || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return $this->jsonError('Parâmetro "date" é obrigatório (YYYY-MM-DD)', 422);
        }

        $roteiro = Roteiro::where('data', $date)->first();

        if (!$roteiro) {
            return $this->jsonSuccess([]);
        }

        $materiaIds = $roteiro->materias()->pluck('id');

        $logs = Activity::where('subject_type', Materia::class)
            ->whereIn('subject_id', $materiaIds)
            ->with('causer:id,name,email,avatar_url')
            ->latest()
            ->paginate($request->get('per_page', 100));

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
