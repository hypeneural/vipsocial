<?php

namespace App\Modules\Externas\Http\Controllers;

use App\Modules\Config\Models\Equipment;
use App\Modules\Externas\Models\EventActivityLog;
use App\Modules\Externas\Models\EventCategory;
use App\Modules\Externas\Models\EventStatus;
use App\Modules\Externas\Models\ExternalEvent;
use App\Modules\VipGallery\Models\VipGalleryPhoto;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

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
        $query = $this->buildEventIndexQuery($request);

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

    public function vipGalleryIndex(Request $request): JsonResponse
    {
        $query = $this->buildEventIndexQuery($request, false)->where('is_vip_gallery', true);

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
                    ->orWhere('briefing', 'like', "%{$search}%")
                    ->orWhere('gallery_slug', 'like', "%{$search}%")
                    ->orWhere('whatsapp_group_id', 'like', "%{$search}%");
            });
        }

        if ($request->filled('data_inicio')) {
            $query->where('data_hora', '>=', $request->data_inicio);
        }

        if ($request->filled('data_fim')) {
            $query->where('data_hora', '<=', $request->data_fim);
        }

        $query
            ->withCount(['vipGalleryPhotos', 'vipGalleryBanners'])
            ->withSum('vipGalleryPhotos as vip_gallery_downloads_count', 'downloads_count');

        $perPage = $request->input('per_page', 20);
        $events = $query->orderBy('data_hora', 'desc')->paginate($perPage);

        $events->setCollection(
            $events->getCollection()->map(fn (ExternalEvent $event) => $this->serializeVipGalleryEvent($event))
        );

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
            ...$this->vipGalleryRules(),
            'colaboradores' => ['nullable', 'array'],
            'colaboradores.*.user_id' => ['required', 'exists:users,id'],
            'colaboradores.*.funcao' => ['nullable', 'string', 'max:100'],
            'equipamentos' => ['nullable', 'array'],
            'equipamentos.*.equipment_id' => ['required', 'exists:equipments,id'],
            'equipamentos.*.checked' => ['nullable', 'boolean'],
        ]);

        $this->assertValidVipGalleryConfiguration($validated);
        $validated = $this->normalizeVipGalleryPayload($validated);

        $event = ExternalEvent::create(collect($validated)->except(['colaboradores', 'equipamentos'])->toArray());

        // Sync collaborators
        if (! empty($validated['colaboradores'])) {
            $collabSync = [];
            foreach ($validated['colaboradores'] as $colab) {
                $collabSync[$colab['user_id']] = ['funcao' => $colab['funcao'] ?? null];
            }
            $event->collaborators()->sync($collabSync);
        }

        // Sync equipment
        if (! empty($validated['equipamentos'])) {
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
            ...$this->vipGalleryRules($event),
            'colaboradores' => ['nullable', 'array'],
            'colaboradores.*.user_id' => ['required', 'exists:users,id'],
            'colaboradores.*.funcao' => ['nullable', 'string', 'max:100'],
            'equipamentos' => ['nullable', 'array'],
            'equipamentos.*.equipment_id' => ['required', 'exists:equipments,id'],
            'equipamentos.*.checked' => ['nullable', 'boolean'],
        ]);

        $this->assertValidVipGalleryConfiguration($validated, $event);
        $validated = $this->normalizeVipGalleryPayload($validated, $event);

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
            'is_vip_gallery' => 'Cobertura VIP',
            'vip_gallery_status' => 'Status da galeria VIP',
            'whatsapp_group_id' => 'Grupo WhatsApp',
            'gallery_slug' => 'Slug da galeria',
            'custom_logo_path' => 'Logo customizada',
            'logo_size_percent' => 'Tamanho da logo',
            'allow_delete_command' => 'Comando de apagar',
            'delete_command_keyword' => 'Palavra-chave apagar',
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

        if (! empty($changes)) {
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
                    ->orWhere(function ($q2) {
                        // Also include events currently in progress
                        $q2->whereHas('status', fn ($sq) => $sq->where('slug', 'em-andamento'));
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
            ->map(fn ($s) => [
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
            ->map(fn ($c) => [
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

    public function vipGalleryStats(): JsonResponse
    {
        $vipEvents = ExternalEvent::query()->where('is_vip_gallery', true);

        return $this->jsonSuccess([
            'total_galleries' => (int) (clone $vipEvents)->count(),
            'active_galleries' => (int) (clone $vipEvents)
                ->where('vip_gallery_status', ExternalEvent::VIP_GALLERY_STATUS_ACTIVE)
                ->count(),
            'total_views' => (int) (clone $vipEvents)->sum('views_count'),
            'total_downloads' => (int) VipGalleryPhoto::query()
                ->whereIn('external_event_id', ExternalEvent::query()->where('is_vip_gallery', true)->select('id'))
                ->sum('downloads_count'),
        ]);
    }

    private function buildEventIndexQuery(Request $request, bool $withFullRelations = true)
    {
        $relations = $withFullRelations
            ? ['category', 'status', 'collaborators', 'equipment']
            : ['category', 'status'];

        $query = ExternalEvent::with($relations);

        if ($request->filled('vip_gallery_status')) {
            $query->where('vip_gallery_status', $request->vip_gallery_status);
        }

        if ($request->has('is_vip_gallery')) {
            $isVipGallery = filter_var($request->input('is_vip_gallery'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($isVipGallery !== null) {
                $query->where('is_vip_gallery', $isVipGallery);
            }
        }

        return $query;
    }

    private function serializeVipGalleryEvent(ExternalEvent $event): array
    {
        return array_merge($event->toArray(), [
            'vip_gallery_photos_count' => (int) ($event->vip_gallery_photos_count ?? 0),
            'vip_gallery_banners_count' => (int) ($event->vip_gallery_banners_count ?? 0),
            'vip_gallery_downloads_count' => (int) ($event->vip_gallery_downloads_count ?? 0),
            'vip_gallery_public_url' => $event->gallery_slug ? '/gallery/'.$event->gallery_slug : null,
            'vip_gallery_is_active' => $event->isVipGalleryActive(),
        ]);
    }

    private function vipGalleryRules(?ExternalEvent $event = null): array
    {
        $gallerySlugRule = Rule::unique('external_events', 'gallery_slug');
        $groupIdRule = Rule::unique('external_events', 'whatsapp_group_id');

        if ($event) {
            $gallerySlugRule = $gallerySlugRule->ignore($event->id);
            $groupIdRule = $groupIdRule->ignore($event->id);
        }

        return [
            'is_vip_gallery' => ['sometimes', 'boolean'],
            'vip_gallery_status' => ['nullable', Rule::in(ExternalEvent::vipGalleryStatuses())],
            'whatsapp_group_id' => ['nullable', 'string', 'max:120', $groupIdRule],
            'gallery_slug' => ['nullable', 'string', 'max:160', $gallerySlugRule],
            'custom_logo_path' => ['nullable', 'string', 'max:255'],
            'logo_size_percent' => ['nullable', 'integer', 'min:5', 'max:30'],
            'allow_delete_command' => ['sometimes', 'boolean'],
            'delete_command_keyword' => ['nullable', 'string', 'max:100'],
        ];
    }

    private function assertValidVipGalleryConfiguration(array $validated, ?ExternalEvent $event = null): void
    {
        $isVipGallery = $this->isVipGalleryEnabled($validated, $event);

        if (! $isVipGallery) {
            return;
        }

        $errors = [];
        $gallerySlug = trim((string) ($validated['gallery_slug'] ?? $event?->gallery_slug ?? ''));
        $whatsappGroupId = trim((string) ($validated['whatsapp_group_id'] ?? $event?->whatsapp_group_id ?? ''));
        $allowDeleteCommand = array_key_exists('allow_delete_command', $validated)
            ? (bool) $validated['allow_delete_command']
            : (bool) ($event?->allow_delete_command ?? false);
        $deleteCommandKeyword = trim((string) ($validated['delete_command_keyword'] ?? $event?->delete_command_keyword ?? ''));

        if ($gallerySlug === '') {
            $errors['gallery_slug'] = ['O slug da galeria VIP e obrigatorio quando a cobertura VIP estiver ativa.'];
        }

        if ($whatsappGroupId === '') {
            $errors['whatsapp_group_id'] = ['O grupo do WhatsApp e obrigatorio quando a cobertura VIP estiver ativa.'];
        }

        if ($allowDeleteCommand && $deleteCommandKeyword === '') {
            $errors['delete_command_keyword'] = ['A palavra-chave de apagar e obrigatoria quando o delete command estiver habilitado.'];
        }

        if (! empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function normalizeVipGalleryPayload(array $validated, ?ExternalEvent $event = null): array
    {
        $isVipGallery = $this->isVipGalleryEnabled($validated, $event);

        if (! $isVipGallery) {
            return array_merge($validated, [
                'is_vip_gallery' => false,
                'vip_gallery_status' => ExternalEvent::VIP_GALLERY_STATUS_DRAFT,
                'whatsapp_group_id' => null,
                'gallery_slug' => null,
                'custom_logo_path' => null,
                'logo_size_percent' => 15,
                'allow_delete_command' => false,
                'delete_command_keyword' => 'Apagar',
            ]);
        }

        $allowDeleteCommand = array_key_exists('allow_delete_command', $validated)
            ? (bool) $validated['allow_delete_command']
            : (bool) ($event?->allow_delete_command ?? false);
        $deleteCommandKeyword = trim((string) ($validated['delete_command_keyword'] ?? $event?->delete_command_keyword ?? 'Apagar'));

        return array_merge($validated, [
            'is_vip_gallery' => true,
            'vip_gallery_status' => $validated['vip_gallery_status'] ?? $event?->vip_gallery_status ?? ExternalEvent::VIP_GALLERY_STATUS_DRAFT,
            'whatsapp_group_id' => $validated['whatsapp_group_id'] ?? $event?->whatsapp_group_id,
            'gallery_slug' => $validated['gallery_slug'] ?? $event?->gallery_slug,
            'custom_logo_path' => $validated['custom_logo_path'] ?? $event?->custom_logo_path,
            'logo_size_percent' => (int) ($validated['logo_size_percent'] ?? $event?->logo_size_percent ?? 15),
            'allow_delete_command' => $allowDeleteCommand,
            'delete_command_keyword' => $allowDeleteCommand ? $deleteCommandKeyword : 'Apagar',
        ]);
    }

    private function isVipGalleryEnabled(array $validated, ?ExternalEvent $event = null): bool
    {
        if (array_key_exists('is_vip_gallery', $validated)) {
            return (bool) $validated['is_vip_gallery'];
        }

        return (bool) ($event?->is_vip_gallery ?? false);
    }

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
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            // Only consider non-cancelled events
            ->whereHas('status', fn ($q) => $q->where('slug', '!=', 'cancelado'))
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
            ->whereHas('equipment', fn ($q) => $q->where('equipments.id', $equipmentId))
            ->orderBy('data_hora', 'desc')
            ->get()
            ->map(fn ($ev) => [
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
