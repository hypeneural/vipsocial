<?php

namespace App\Modules\NewsRadarWhatsApp\Actions;

use App\Models\User;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppInboundEvent;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppNewsBundle;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CreateWhatsAppNewsBundleAction
{
    public function __construct(
        private readonly EnsureWhatsAppNewsGroupAccessAction $ensureAccess,
        private readonly SyncWhatsAppNewsBundleMetricsAction $syncMetrics,
    ) {
    }

    /**
     * @param  array<int, int>  $eventIds
     */
    public function execute(User $user, string $groupFk, array $eventIds, array $attributes = []): WhatsAppNewsBundle
    {
        $eventIds = array_values(array_unique($eventIds));

        $this->ensureAccess->forGroup($user, $groupFk);
        $events = $this->resolveEvents($groupFk, $eventIds);

        return DB::transaction(function () use ($user, $groupFk, $events, $attributes): WhatsAppNewsBundle {
            $bundle = WhatsAppNewsBundle::query()->create([
                'whatsapp_group_fk' => $groupFk,
                'status' => WhatsAppNewsBundle::STATUS_OPEN,
                'creation_mode' => $attributes['creation_mode'] ?? WhatsAppNewsBundle::CREATION_MODE_MANUAL,
                'title' => $attributes['title'] ?? null,
                'created_by' => $user->getKey(),
                'updated_by' => $user->getKey(),
                'lock_version' => 1,
            ]);

            foreach ($events->values() as $index => $event) {
                $bundle->items()->create([
                    'inbound_event_id' => $event->id,
                    'sort_order' => $index + 1,
                    'is_cover' => false,
                    'added_by' => $user->getKey(),
                ]);
            }

            return $this->syncMetrics->execute($bundle);
        });
    }

    /**
     * @param  array<int, int>  $eventIds
     * @return Collection<int, WhatsAppInboundEvent>
     */
    private function resolveEvents(string $groupFk, array $eventIds): Collection
    {
        $events = WhatsAppInboundEvent::query()
            ->with('media')
            ->where('whatsapp_group_fk', $groupFk)
            ->whereIn('id', $eventIds)
            ->get()
            ->keyBy('id');

        if ($events->count() !== count(array_unique($eventIds))) {
            throw new \RuntimeException('Todos os eventos precisam existir e pertencer ao mesmo grupo.');
        }

        return collect($eventIds)->map(fn ($eventId) => $events->get($eventId));
    }
}
