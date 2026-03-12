<?php

namespace App\Modules\NewsRadarWhatsApp\Actions;

use App\Models\User;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppNewsBundle;
use Illuminate\Support\Facades\DB;

class RemoveWhatsAppNewsBundleItemAction
{
    public function __construct(
        private readonly UpdateWhatsAppNewsBundleAction $updateBundle,
        private readonly SyncWhatsAppNewsBundleMetricsAction $syncMetrics,
    ) {
    }

    public function execute(User $user, WhatsAppNewsBundle $bundle, int $eventId, int $lockVersion): WhatsAppNewsBundle
    {
        $this->updateBundle->assertLockVersion($bundle, $lockVersion);

        return DB::transaction(function () use ($user, $bundle, $eventId): WhatsAppNewsBundle {
            $bundle->items()->where('inbound_event_id', $eventId)->delete();

            $bundle->items()
                ->orderBy('sort_order')
                ->get()
                ->values()
                ->each(function ($item, $index) {
                    $item->update([
                        'sort_order' => $index + 1,
                    ]);
                });

            $bundle->forceFill([
                'updated_by' => $user->getKey(),
                'lock_version' => $bundle->lock_version + 1,
            ])->save();

            return $this->syncMetrics->execute($bundle);
        });
    }
}
