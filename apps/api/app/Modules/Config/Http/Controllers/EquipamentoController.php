<?php

namespace App\Modules\Config\Http\Controllers;

use App\Modules\Config\Models\Equipment;
use App\Modules\Config\Models\EquipmentCategory;
use App\Modules\Config\Models\EquipmentStatus;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EquipamentoController extends BaseController
{
    // ══════════════════════════════════════════
    // CATEGORIES
    // ══════════════════════════════════════════

    public function categories(): JsonResponse
    {
        $categories = EquipmentCategory::orderBy('sort_order')
            ->orderBy('name')
            ->withCount('equipments')
            ->get();

        return $this->jsonSuccess($categories);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'icon' => ['nullable', 'string', 'max:50'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $category = EquipmentCategory::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'icon' => $validated['icon'] ?? 'Package',
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        return $this->jsonCreated($category);
    }

    public function updateCategory(Request $request, int $id): JsonResponse
    {
        $category = EquipmentCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'icon' => ['nullable', 'string', 'max:50'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category->update($validated);

        return $this->jsonSuccess($category);
    }

    public function destroyCategory(int $id): JsonResponse
    {
        $category = EquipmentCategory::withCount('equipments')->findOrFail($id);

        if ($category->equipments_count > 0) {
            return $this->jsonError(
                "Não é possível excluir a categoria '{$category->name}' pois existem {$category->equipments_count} equipamento(s) vinculado(s)",
                'CONFLICT',
                409
            );
        }

        $category->delete();

        return $this->jsonDeleted();
    }

    // ══════════════════════════════════════════
    // STATUSES
    // ══════════════════════════════════════════

    public function statuses(): JsonResponse
    {
        $statuses = EquipmentStatus::orderBy('sort_order')
            ->orderBy('name')
            ->withCount('equipments')
            ->get();

        return $this->jsonSuccess($statuses);
    }

    public function storeStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'icon' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:50'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $status = EquipmentStatus::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'icon' => $validated['icon'] ?? 'CircleDot',
            'color' => $validated['color'] ?? 'bg-gray-500',
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        return $this->jsonCreated($status);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $status = EquipmentStatus::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'icon' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:50'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $status->update($validated);

        return $this->jsonSuccess($status);
    }

    public function destroyStatus(int $id): JsonResponse
    {
        $status = EquipmentStatus::withCount('equipments')->findOrFail($id);

        if ($status->equipments_count > 0) {
            return $this->jsonError(
                "Não é possível excluir o status '{$status->name}' pois existem {$status->equipments_count} equipamento(s) vinculado(s)",
                'CONFLICT',
                409
            );
        }

        $status->delete();

        return $this->jsonDeleted();
    }

    // ══════════════════════════════════════════
    // EQUIPMENTS
    // ══════════════════════════════════════════

    public function index(Request $request): JsonResponse
    {
        $query = Equipment::with(['category', 'status']);

        // Filters
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('status_id')) {
            $query->where('status_id', $request->status_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nome', 'like', "%{$search}%")
                    ->orWhere('marca', 'like', "%{$search}%")
                    ->orWhere('modelo', 'like', "%{$search}%")
                    ->orWhere('patrimonio', 'like', "%{$search}%");
            });
        }

        $perPage = $request->input('per_page', 20);
        $equipments = $query->orderBy('nome')->paginate($perPage);

        return $this->jsonPaginated($equipments);
    }

    public function show(int $id): JsonResponse
    {
        $equipment = Equipment::with(['category', 'status'])->findOrFail($id);

        return $this->jsonSuccess($equipment);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nome' => ['required', 'string', 'max:200'],
            'category_id' => ['required', 'exists:equipment_categories,id'],
            'marca' => ['nullable', 'string', 'max:100'],
            'modelo' => ['nullable', 'string', 'max:100'],
            'patrimonio' => ['nullable', 'string', 'max:50', 'unique:equipments,patrimonio'],
            'status_id' => ['required', 'exists:equipment_statuses,id'],
            'observacoes' => ['nullable', 'string'],
        ]);

        $equipment = Equipment::create($validated);
        $equipment->load(['category', 'status']);

        return $this->jsonCreated($equipment);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $equipment = Equipment::findOrFail($id);

        $validated = $request->validate([
            'nome' => ['sometimes', 'string', 'max:200'],
            'category_id' => ['sometimes', 'exists:equipment_categories,id'],
            'marca' => ['nullable', 'string', 'max:100'],
            'modelo' => ['nullable', 'string', 'max:100'],
            'patrimonio' => ['nullable', 'string', 'max:50', "unique:equipments,patrimonio,{$id}"],
            'status_id' => ['sometimes', 'exists:equipment_statuses,id'],
            'observacoes' => ['nullable', 'string'],
        ]);

        $equipment->update($validated);
        $equipment->load(['category', 'status']);

        return $this->jsonSuccess($equipment);
    }

    public function destroy(int $id): JsonResponse
    {
        $equipment = Equipment::findOrFail($id);
        $equipment->delete();

        return $this->jsonDeleted();
    }

    public function changeEquipmentStatus(Request $request, int $id): JsonResponse
    {
        $equipment = Equipment::findOrFail($id);

        $validated = $request->validate([
            'status_id' => ['required', 'exists:equipment_statuses,id'],
        ]);

        $equipment->update(['status_id' => $validated['status_id']]);
        $equipment->load(['category', 'status']);

        return $this->jsonSuccess($equipment);
    }

    /**
     * Stats for the dashboard cards
     */
    public function stats(): JsonResponse
    {
        $total = Equipment::count();
        $byStatus = EquipmentStatus::withCount('equipments')
            ->orderBy('sort_order')
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'slug' => $s->slug,
                'icon' => $s->icon,
                'color' => $s->color,
                'count' => $s->equipments_count,
            ]);

        $byCategory = EquipmentCategory::withCount('equipments')
            ->orderBy('sort_order')
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'icon' => $c->icon,
                'count' => $c->equipments_count,
            ]);

        return $this->jsonSuccess([
            'total' => $total,
            'by_status' => $byStatus,
            'by_category' => $byCategory,
        ]);
    }
}
