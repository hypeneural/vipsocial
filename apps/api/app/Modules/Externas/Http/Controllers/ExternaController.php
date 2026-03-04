<?php

namespace App\Modules\Externas\Http\Controllers;

use App\Models\User;
use App\Modules\Config\Models\Equipment;
use App\Modules\Externas\Models\EventActivityLog;
use App\Modules\Externas\Models\EventCategory;
use App\Modules\Externas\Models\EventStatus;
use App\Modules\Externas\Models\ExternalEvent;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class ExternaController extends BaseController
{
    // ══════════════════════════════════════════
    // CATEGORIES
    // ══════════════════════════════════════════

    public function categories(): JsonResponse
    {
        $categories = EventCategory::orderBy('sort_order')
            ->orderBy('name')
            ->withCount('events')
            ->get();

        return $this->jsonSuccess($categories);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'icon' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:50'],
        ]);

        $category = EventCategory::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'icon' => $validated['icon'] ?? 'FileText',
            'color' => $validated['color'] ?? 'bg-gray-500',
            'sort_order' => 0,
        ]);

        return $this->jsonCreated($category);
    }

    public function updateCategory(Request $request, int $id): JsonResponse
    {
        $category = EventCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'icon' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:50'],
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category->update($validated);

        return $this->jsonSuccess($category);
    }

    public function destroyCategory(int $id): JsonResponse
    {
        $category = EventCategory::withCount('events')->findOrFail($id);

        if ($category->events_count > 0) {
            return $this->jsonError(
                "Não é possível excluir a categoria '{$category->name}' pois existem {$category->events_count} evento(s) vinculado(s)",
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
        $statuses = EventStatus::orderBy('sort_order')
            ->orderBy('name')
            ->withCount('events')
            ->get();

        return $this->jsonSuccess($statuses);
    }

    public function storeStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'icon' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:50'],
        ]);

        $status = EventStatus::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'icon' => $validated['icon'] ?? 'CircleDot',
            'color' => $validated['color'] ?? 'bg-gray-500',
            'sort_order' => 0,
        ]);

        return $this->jsonCreated($status);
    }

    public function updateEventStatus(Request $request, int $id): JsonResponse
    {
        $status = EventStatus::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'icon' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:50'],
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $status->update($validated);

        return $this->jsonSuccess($status);
    }

    public function destroyStatus(int $id): JsonResponse
    {
        $status = EventStatus::withCount('events')->findOrFail($id);

        if ($status->events_count > 0) {
            return $this->jsonError(
                "Não é possível excluir o status '{$status->name}' pois existem {$status->events_count} evento(s) vinculado(s)",
                'CONFLICT',
                409
            );
        }

        $status->delete();

        return $this->jsonDeleted();
    }

    // ══════════════════════════════════════════
    // EVENTS
    // ══════════════════════════════════════════

    public function index(Request $request): JsonResponse
    {
        $query = ExternalEvent::with(['category', 'status', 'collaborators', 'equipment']);

        // ── Filters ────────────────────────────
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('status_id')) {
            $query->where('status_id', $request->status_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('titulo', 'like', "%{$search}%")
                    ->orWhere('local', 'like', "%{$search}%")
                    ->orWhere('briefing', 'like', "%{$search}%");
            });
        }

        if ($request->filled('data_inicio')) {
            $query->where('data_hora', '>=', $request->data_inicio);
        }

        if ($request->filled('data_fim')) {
            $query->where('data_hora', '<=', $request->data_fim);
        }

        $perPage = $request->input('per_page', 20);
        $events = $query->orderBy('data_hora', 'desc')->paginate($perPage);

        return $this->jsonPaginated($events);
    }

    public function show(int $id): JsonResponse
    {
        $event = ExternalEvent::with([
            'category',
            'status',
            'collaborators',
            'equipment.category',
        ])->findOrFail($id);

        return $this->jsonSuccess($event);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'titulo' => ['required', 'string', 'max:200'],
            'category_id' => ['required', 'exists:event_categories,id'],
            'status_id' => ['required', 'exists:event_statuses,id'],
            'briefing' => ['nullable', 'string'],
            'data_hora' => ['required', 'date'],
            'data_hora_fim' => ['nullable', 'date', 'after:data_hora'],
            'local' => ['required', 'string', 'max:200'],
            'endereco_completo' => ['nullable', 'string', 'max:300'],
            'contato_nome' => ['nullable', 'string', 'max:100'],
            'contato_whatsapp' => ['nullable', 'string', 'max:30'],
            'observacao_interna' => ['nullable', 'string'],
            'colaboradores' => ['nullable', 'array'],
            'colaboradores.*.user_id' => ['required', 'exists:users,id'],
            'colaboradores.*.funcao' => ['nullable', 'string', 'max:100'],
            'equipamentos' => ['nullable', 'array'],
            'equipamentos.*.equipment_id' => ['required', 'exists:equipments,id'],
            'equipamentos.*.checked' => ['nullable', 'boolean'],
        ]);

        $event = ExternalEvent::create(collect($validated)->except(['colaboradores', 'equipamentos'])->toArray());

        // Sync collaborators
        if (!empty($validated['colaboradores'])) {
            $collabSync = [];
            foreach ($validated['colaboradores'] as $colab) {
                $collabSync[$colab['user_id']] = ['funcao' => $colab['funcao'] ?? null];
            }
            $event->collaborators()->sync($collabSync);
        }

        // Sync equipment
        if (!empty($validated['equipamentos'])) {
            $equipSync = [];
            foreach ($validated['equipamentos'] as $equip) {
                $equipSync[$equip['equipment_id']] = ['checked' => $equip['checked'] ?? false];
            }
            $event->equipment()->sync($equipSync);
        }

        $event->load(['category', 'status', 'collaborators', 'equipment']);

        // Log creation
        EventActivityLog::log($event->id, 'created', "Evento \"{$event->titulo}\" criado");

        return $this->jsonCreated($event);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $event = ExternalEvent::findOrFail($id);

        $validated = $request->validate([
            'titulo' => ['sometimes', 'string', 'max:200'],
            'category_id' => ['sometimes', 'exists:event_categories,id'],
            'status_id' => ['sometimes', 'exists:event_statuses,id'],
            'briefing' => ['nullable', 'string'],
            'data_hora' => ['sometimes', 'date'],
            'data_hora_fim' => ['nullable', 'date'],
            'local' => ['sometimes', 'string', 'max:200'],
            'endereco_completo' => ['nullable', 'string', 'max:300'],
            'contato_nome' => ['nullable', 'string', 'max:100'],
            'contato_whatsapp' => ['nullable', 'string', 'max:30'],
            'observacao_interna' => ['nullable', 'string'],
            'colaboradores' => ['nullable', 'array'],
            'colaboradores.*.user_id' => ['required', 'exists:users,id'],
            'colaboradores.*.funcao' => ['nullable', 'string', 'max:100'],
            'equipamentos' => ['nullable', 'array'],
            'equipamentos.*.equipment_id' => ['required', 'exists:equipments,id'],
            'equipamentos.*.checked' => ['nullable', 'boolean'],
        ]);

        // Track changes for activity log
        $fieldLabels = [
            'titulo' => 'Título',
            'category_id' => 'Categoria',
            'status_id' => 'Status',
            'briefing' => 'Briefing',
            'data_hora' => 'Data/Hora Início',
            'data_hora_fim' => 'Data/Hora Fim',
            'local' => 'Local',
            'endereco_completo' => 'Endereço',
            'contato_nome' => 'Contato',
            'contato_whatsapp' => 'WhatsApp',
            'observacao_interna' => 'Observação interna',
        ];
        $original = $event->getOriginal();

        $event->update(collect($validated)->except(['colaboradores', 'equipamentos'])->toArray());

        // Log field changes
        $changes = [];
        foreach ($fieldLabels as $field => $label) {
            $oldVal = $original[$field] ?? null;
            $newVal = $event->{$field};
            if ($field === 'data_hora' || $field === 'data_hora_fim') {
                $oldVal = $oldVal ? Carbon::parse($oldVal)->toIso8601String() : null;
                $newVal = $newVal ? $newVal->toIso8601String() : null;
            }
            if ((string) $oldVal !== (string) $newVal) {
                $changes[$label] = ['de' => $oldVal, 'para' => (string) $newVal];
            }
        }

        if (!empty($changes)) {
            $changedFields = implode(', ', array_keys($changes));
            EventActivityLog::log($event->id, 'updated', "Campos alterados: {$changedFields}", $changes);
        }

        // Re-sync collaborators if provided
        if (array_key_exists('colaboradores', $validated)) {
            $collabSync = [];
            foreach ($validated['colaboradores'] ?? [] as $colab) {
                $collabSync[$colab['user_id']] = ['funcao' => $colab['funcao'] ?? null];
            }
            $event->collaborators()->sync($collabSync);
        }

        // Re-sync equipment if provided
        if (array_key_exists('equipamentos', $validated)) {
            $equipSync = [];
            foreach ($validated['equipamentos'] ?? [] as $equip) {
                $equipSync[$equip['equipment_id']] = ['checked' => $equip['checked'] ?? false];
            }
            $event->equipment()->sync($equipSync);
        }

        $event->load(['category', 'status', 'collaborators', 'equipment']);

        return $this->jsonSuccess($event);
    }

    public function destroy(int $id): JsonResponse
    {
        $event = ExternalEvent::findOrFail($id);
        $event->delete();

        return $this->jsonDeleted();
    }

    public function changeStatus(Request $request, int $id): JsonResponse
    {
        $event = ExternalEvent::with('status')->findOrFail($id);
        $oldStatus = $event->status?->name ?? 'N/A';

        $validated = $request->validate([
            'status_id' => ['required', 'exists:event_statuses,id'],
        ]);

        $event->update(['status_id' => $validated['status_id']]);
        $event->load(['category', 'status', 'collaborators', 'equipment']);

        $newStatus = $event->status?->name ?? 'N/A';
        EventActivityLog::log(
            $event->id,
            'status_changed',
            "Status alterado de \"{$oldStatus}\" para \"{$newStatus}\"",
            ['Status' => ['de' => $oldStatus, 'para' => $newStatus]]
        );

        return $this->jsonSuccess($event);
    }

    public function updateChecklist(Request $request, int $id): JsonResponse
    {
        $event = ExternalEvent::findOrFail($id);

        $validated = $request->validate([
            'equipamentos' => ['required', 'array'],
            'equipamentos.*.equipment_id' => ['required', 'exists:equipments,id'],
            'equipamentos.*.checked' => ['required', 'boolean'],
        ]);

        $equipSync = [];
        foreach ($validated['equipamentos'] as $equip) {
            $equipSync[$equip['equipment_id']] = ['checked' => $equip['checked']];
        }

        $event->equipment()->sync($equipSync);
        $event->load(['equipment']);

        return $this->jsonSuccess($event);
    }

    public function upcoming(int $days = 7): JsonResponse
    {
        $now = Carbon::now();
        $end = Carbon::now()->addDays($days);

        $events = ExternalEvent::with(['category', 'status', 'collaborators'])
            ->where(function ($q) use ($now, $end) {
                $q->whereBetween('data_hora', [$now, $end])
                    ->orWhere(function ($q2) use ($now) {
                        // Also include events currently in progress
                        $q2->whereHas('status', fn($sq) => $sq->where('slug', 'em-andamento'));
                    });
            })
            ->orderBy('data_hora')
            ->get();

        return $this->jsonSuccess($events);
    }

    public function stats(): JsonResponse
    {
        $today = Carbon::today();

        $total = ExternalEvent::count();

        $todayCount = ExternalEvent::whereDate('data_hora', $today)->count();

        $byStatus = EventStatus::withCount('events')
            ->orderBy('sort_order')
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'slug' => $s->slug,
                'icon' => $s->icon,
                'color' => $s->color,
                'count' => $s->events_count,
            ]);

        $byCategory = EventCategory::withCount('events')
            ->orderBy('sort_order')
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'icon' => $c->icon,
                'color' => $c->color,
                'count' => $c->events_count,
            ]);

        return $this->jsonSuccess([
            'total' => $total,
            'today' => $todayCount,
            'by_status' => $byStatus,
            'by_category' => $byCategory,
        ]);
    }

    // ══════════════════════════════════════════
    // EQUIPMENT AVAILABILITY
    // ══════════════════════════════════════════

    /**
     * Check equipment availability for a date range.
     * Returns list of equipment IDs that are committed to other events
     * during the given period, with conflicting event details.
     */
    public function equipmentAvailability(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'data_hora' => ['required', 'date'],
            'data_hora_fim' => ['nullable', 'date'],
            'exclude_event_id' => ['nullable', 'integer'],
        ]);

        $start = Carbon::parse($validated['data_hora']);
        // If no end time given, assume 2 hours
        $end = isset($validated['data_hora_fim'])
            ? Carbon::parse($validated['data_hora_fim'])
            : (clone $start)->addHours(2);
        $excludeId = $validated['exclude_event_id'] ?? null;

        // Find events that overlap with [start, end]
        $overlappingEvents = ExternalEvent::with(['category', 'status', 'equipment'])
            ->where(function ($q) use ($start, $end) {
                // Event starts before our end AND event ends after our start (or has no end)
                $q->where('data_hora', '<', $end)
                    ->where(function ($q2) use ($start) {
                    $q2->where('data_hora_fim', '>', $start)
                        ->orWhereNull('data_hora_fim');
                });
            })
            ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
            // Only consider non-cancelled events
            ->whereHas('status', fn($q) => $q->where('slug', '!=', 'cancelado'))
            ->get();

        // Build map: equipment_id => [conflicting events info]
        $conflicts = [];
        foreach ($overlappingEvents as $event) {
            foreach ($event->equipment as $equip) {
                $conflicts[$equip->id][] = [
                    'event_id' => $event->id,
                    'titulo' => $event->titulo,
                    'data_hora' => $event->data_hora?->toIso8601String(),
                    'data_hora_fim' => $event->data_hora_fim?->toIso8601String(),
                    'local' => $event->local,
                    'status' => $event->status?->name,
                ];
            }
        }

        return $this->jsonSuccess($conflicts);
    }

    /**
     * Get the schedule (agenda) for a specific equipment.
     * Returns all events that use this equipment, ordered by date.
     */
    public function equipmentSchedule(int $equipmentId): JsonResponse
    {
        $equipment = Equipment::with(['category', 'status'])->findOrFail($equipmentId);

        $events = ExternalEvent::with(['category', 'status'])
            ->whereHas('equipment', fn($q) => $q->where('equipments.id', $equipmentId))
            ->orderBy('data_hora', 'desc')
            ->get()
            ->map(fn($ev) => [
                'id' => $ev->id,
                'titulo' => $ev->titulo,
                'data_hora' => $ev->data_hora?->toIso8601String(),
                'data_hora_fim' => $ev->data_hora_fim?->toIso8601String(),
                'local' => $ev->local,
                'category' => $ev->category,
                'status' => $ev->status,
            ]);

        return $this->jsonSuccess([
            'equipment' => $equipment,
            'events' => $events,
        ]);
    }

    // ══════════════════════════════════════════
    // ACTIVITY LOGS
    // ══════════════════════════════════════════

    public function logs(int $id): JsonResponse
    {
        $event = ExternalEvent::findOrFail($id);

        $logs = $event->activityLogs()
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->jsonSuccess($logs);
    }
}
