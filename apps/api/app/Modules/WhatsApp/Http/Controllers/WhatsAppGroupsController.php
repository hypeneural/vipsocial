<?php

namespace App\Modules\WhatsApp\Http\Controllers;

use App\Modules\WhatsApp\Exceptions\WhatsAppProviderException;
use App\Modules\WhatsApp\Http\Requests\StoreWhatsAppGroupRequest;
use App\Modules\WhatsApp\Http\Requests\SyncWhatsAppGroupRequest;
use App\Modules\WhatsApp\Http\Requests\UpdateWhatsAppGroupRequest;
use App\Modules\WhatsApp\Models\WhatsAppGroup;
use App\Modules\WhatsApp\Services\GroupSyncService;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class WhatsAppGroupsController extends BaseController
{
    public function __construct(private readonly GroupSyncService $syncService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->integer('per_page', 20);
        if ($perPage < 1) {
            $perPage = 20;
        }
        if ($perPage > 100) {
            $perPage = 100;
        }

        $includeInactive = filter_var($request->input('include_inactive', false), FILTER_VALIDATE_BOOLEAN);

        $query = WhatsAppGroup::query()
            ->withCount([
                'memberships as members_current' => fn($q) => $q->active(),
            ])
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->orderBy('subject');

        if (!$includeInactive) {
            $query->active();
        }

        $paginator = $query->paginate($perPage)->withQueryString();
        $items = $paginator->getCollection()
            ->map(fn(WhatsAppGroup $group) => $this->serializeGroup($group))
            ->values()
            ->all();

        return response()->json([
            'success' => true,
            'data' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            'message' => '',
        ]);
    }

    public function store(StoreWhatsAppGroupRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $syncNow = (bool) ($validated['sync_now'] ?? false);
        $force = (bool) ($validated['force'] ?? false);

        try {
            $group = WhatsAppGroup::query()->create([
                'group_id' => $validated['group_id'],
                'is_active' => (bool) ($validated['is_active'] ?? true),
                'name' => $validated['name'] ?? null,
                'subject' => $validated['subject'] ?? null,
                'description' => $validated['description'] ?? null,
            ]);

            $payload = [
                'group' => $this->serializeGroup($group->fresh()),
            ];

            if ($syncNow) {
                $payload['sync'] = $this->syncService->syncGroupById(
                    groupId: $group->group_id,
                    force: $force
                );
                $payload['group'] = $this->serializeGroup($group->fresh());
            }

            return $this->jsonCreated($payload, 'Grupo monitorado criado com sucesso');
        } catch (WhatsAppProviderException $e) {
            return $this->jsonError(
                message: $e->getMessage(),
                code: 'WHATSAPP_PROVIDER_ERROR',
                status: $e->status(),
                errors: [
                    'provider_status' => $e->status(),
                    'provider_body' => $e->responseBody(),
                ]
            );
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError('Falha ao criar grupo monitorado', 'WHATSAPP_GROUP_CREATE_FAILED', 500);
        }
    }

    public function update(string $groupId, UpdateWhatsAppGroupRequest $request): JsonResponse
    {
        $group = $this->findByGroupId($groupId);
        $validated = $request->validated();

        $group->fill([
            'is_active' => array_key_exists('is_active', $validated)
                ? (bool) $validated['is_active']
                : $group->is_active,
            'name' => array_key_exists('name', $validated) ? $validated['name'] : $group->name,
            'subject' => array_key_exists('subject', $validated) ? $validated['subject'] : $group->subject,
            'description' => array_key_exists('description', $validated) ? $validated['description'] : $group->description,
        ]);
        $group->save();

        return $this->jsonSuccess(
            $this->serializeGroup($group->fresh()),
            'Grupo monitorado atualizado com sucesso'
        );
    }

    public function sync(string $groupId, SyncWhatsAppGroupRequest $request): JsonResponse
    {
        $group = $this->findByGroupId($groupId);
        $force = (bool) $request->boolean('force', false);

        try {
            $syncResult = $this->syncService->syncGroupById(
                groupId: $group->group_id,
                force: $force
            );

            return $this->jsonSuccess([
                'group' => $this->serializeGroup($group->fresh()),
                'sync' => $syncResult,
            ], 'Sincronizacao executada');
        } catch (WhatsAppProviderException $e) {
            return $this->jsonError(
                message: $e->getMessage(),
                code: 'WHATSAPP_PROVIDER_ERROR',
                status: $e->status(),
                errors: [
                    'provider_status' => $e->status(),
                    'provider_body' => $e->responseBody(),
                ]
            );
        } catch (Throwable $e) {
            report($e);

            return $this->jsonError(
                message: 'Falha ao sincronizar grupo monitorado',
                code: 'WHATSAPP_GROUP_SYNC_FAILED',
                status: 500
            );
        }
    }

    private function findByGroupId(string $groupId): WhatsAppGroup
    {
        $normalizedGroupId = strtolower(trim($groupId));

        $group = WhatsAppGroup::query()->where('group_id', $normalizedGroupId)->first();
        if ($group === null) {
            throw (new ModelNotFoundException())->setModel(WhatsAppGroup::class, [$normalizedGroupId]);
        }

        return $group;
    }

    private function serializeGroup(WhatsAppGroup $group): array
    {
        return [
            'group_id' => $group->group_id,
            'name' => $group->name,
            'subject' => $group->subject,
            'description' => $group->description,
            'is_active' => (bool) $group->is_active,
            'members_current' => (int) ($group->members_current ?? 0),
            'last_member_count' => $group->last_member_count !== null ? (int) $group->last_member_count : null,
            'last_synced_at' => $group->last_synced_at?->toIso8601String(),
            'created_at' => $group->created_at?->toIso8601String(),
            'updated_at' => $group->updated_at?->toIso8601String(),
        ];
    }
}
