<?php

namespace App\Modules\NewsRadarWhatsApp\Actions;

use App\Modules\NewsRadarWhatsApp\Models\WhatsAppNewsBundle;

class SyncWhatsAppNewsBundleMetricsAction
{
    public function execute(WhatsAppNewsBundle $bundle): WhatsAppNewsBundle
    {
        $bundle->loadMissing(['items.event.media']);

        $items = $bundle->items;
        $events = $items->pluck('event')->filter();

        $bundle->forceFill([
            'first_message_at' => $events->min('sent_at'),
            'last_message_at' => $events->max('sent_at'),
            'message_count' => $items->count(),
            'media_count' => $events->sum(fn ($event) => $event->media->count()),
            'primary_sender_name' => $events->pluck('sender_name')->filter()->first(),
        ])->save();

        return $bundle->fresh(['group', 'items.event']);
    }
}
