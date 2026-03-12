<?php

namespace App\Modules\NewsRadarWhatsApp\Actions;

use App\Models\User;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppInboundEvent;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppNewsBundle;
use Illuminate\Support\Facades\DB;

class AddWhatsAppNewsBundleItemsAction
{
    public function __construct(
        private readonly UpdateWhatsAppNewsBundleAction $updateBundle,
        private readonly SyncWhatsAppNewsBundleMetricsAction $syncMetrics,
    ) {
    }

    /**
     * @param  array<int, int>  $eventIds
     */
    public function execute(User $user, WhatsAppNewsBundle $bundle, array $eventIds, int $lockVersion): WhatsAppNewsBundle
    {
        $this->updateBundle->assertLockVersion($bundle, $lockVersion);

        return DB::transaction(function () use ($user, $bundle, $eventIds): WhatsAppNewsBundle {
            $events = WhatsAppInboundEvent::query()
                ->where('whatsapp_group_fk', $bundle->whatsapp_group_fk)
                ->whereIn('id', $eventIds)
                ->get()
                ->keyBy('id');

            if ($events->count() !== count(array_unique($eventIds))) {
                throw new \RuntimeException('Todos os eventos precisam pertencer ao mesmo grupo do bundle.');
            }

            $nextSortOrder = (int) $bundle->items()->max('sort_order');

            foreach ($eventIds as $eventId) {
                if ($bundle->items()->where('inbound_event_id', $eventId)->exists()) {
                    continue;
                }

                $nextSortOrder++;

                $bundle->items()->create([
                    'inbound_event_id' => $eventId,
                    'sort_order' => $nextSortOrder,
                    'is_cover' => false,
                    'added_by' => $user->getKey(),
                ]);
            }

            $bundle->forceFill([
                'updated_by' => $user->getKey(),
                'lock_version' => $bundle->lock_version + 1,
            ])->save();

            return $this->syncMetrics->execute($bundle);
        });
    }
}
