<?php

namespace App\Modules\Alertas\Services;

use App\Modules\Alertas\Models\AlertDestination;
use App\Modules\Alertas\Support\AlertDatePresenter;
use App\Modules\WhatsApp\Support\WhatsAppTargetNormalizer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use RuntimeException;

class AlertDestinationService
{
    public function __construct(private readonly WhatsAppTargetNormalizer $targetNormalizer)
    {
    }

    public function paginate(array $filters = []): LengthAwarePaginator
    {
        $perPage = min(100, max(1, (int) ($filters['per_page'] ?? 20)));
        $search = trim((string) ($filters['search'] ?? ''));
        $includeInactive = (bool) ($filters['include_inactive'] ?? false);
        $includeArchived = (bool) ($filters['include_archived'] ?? false);

        $query = AlertDestination::query()
            ->withCount('alerts')
            ->orderByDesc('active')
            ->orderByDesc('id');

        if (!$includeArchived) {
            $query->whereNull('archived_at');
        }

        if (!$includeInactive) {
            $query->where('active', true);
        }

        if ($search !== '') {
            $query->where(function (Builder $builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('target_value', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function create(array $validated, ?int $userId = null): AlertDestination
    {
        $target = $this->targetNormalizer->normalizeWithKind((string) $validated['phone_number']);
        $this->assertUniqueTarget($target['target_kind'], $target['target_value']);

        return AlertDestination::query()->create([
            'name' => trim((string) $validated['name']),
            'target_kind' => $target['target_kind'],
            'target_value' => $target['target_value'],
            'tags' => array_values((array) ($validated['tags'] ?? [])),
            'active' => (bool) ($validated['active'] ?? true),
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);
    }

    public function update(AlertDestination $destination, array $validated, ?int $userId = null): AlertDestination
    {
        if ($destination->archived_at !== null) {
            throw new RuntimeException('Destino arquivado nao pode ser editado');
        }

        if (array_key_exists('phone_number', $validated)) {
            $target = $this->targetNormalizer->normalizeWithKind((string) $validated['phone_number']);
            $this->assertUniqueTarget($target['target_kind'], $target['target_value'], $destination->id);
            $destination->target_kind = $target['target_kind'];
            $destination->target_value = $target['target_value'];
        }

        if (array_key_exists('name', $validated)) {
            $destination->name = trim((string) $validated['name']);
        }

        if (array_key_exists('tags', $validated)) {
            $destination->tags = array_values((array) ($validated['tags'] ?? []));
        }

        if (array_key_exists('active', $validated)) {
            $destination->active = (bool) $validated['active'];
        }

        $destination->updated_by = $userId;
        $destination->save();

        return $destination->fresh(['alerts']);
    }

    public function archive(AlertDestination $destination, ?int $userId = null): AlertDestination
    {
        $destination->forceFill([
            'active' => false,
            'archived_at' => now((string) config('alertas.timezone', config('app.timezone', 'UTC'))),
            'updated_by' => $userId,
        ])->save();

        return $destination->fresh();
    }

    public function toggle(AlertDestination $destination, ?int $userId = null): AlertDestination
    {
        if ($destination->archived_at !== null) {
            throw new RuntimeException('Destino arquivado nao pode ser reativado por toggle');
        }

        $destination->forceFill([
            'active' => !$destination->active,
            'updated_by' => $userId,
        ])->save();

        return $destination->fresh();
    }

    public function serialize(AlertDestination $destination): array
    {
        return [
            'destination_id' => $destination->id,
            'name' => $destination->name,
            'phone_number' => $destination->target_value,
            'target_kind' => $destination->target_kind,
            'target_value' => $destination->target_value,
            'tags' => array_values((array) ($destination->tags ?? [])),
            'active' => (bool) $destination->active,
            'archived_at' => AlertDatePresenter::isoFromStored($destination, 'archived_at'),
            'last_sent_at' => AlertDatePresenter::isoFromStored($destination, 'last_sent_at'),
            'alert_count' => (int) ($destination->alerts_count ?? $destination->alerts()->count()),
            'created_at' => AlertDatePresenter::isoFromValue($destination->created_at),
            'updated_at' => AlertDatePresenter::isoFromValue($destination->updated_at),
        ];
    }

    private function assertUniqueTarget(string $targetKind, string $targetValue, ?int $ignoreId = null): void
    {
        $query = AlertDestination::query()
            ->where('target_kind', $targetKind)
            ->where('target_value', $targetValue);

        if ($ignoreId !== null) {
            $query->whereKeyNot($ignoreId);
        }

        if ($query->exists()) {
            throw new RuntimeException('Ja existe um destino com este numero ou ID de grupo');
        }
    }
}
