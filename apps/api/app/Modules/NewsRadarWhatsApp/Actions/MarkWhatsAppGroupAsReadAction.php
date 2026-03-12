<?php

namespace App\Modules\NewsRadarWhatsApp\Actions;

use App\Models\User;
use App\Modules\NewsRadarWhatsApp\Models\UserWhatsAppNewsGroup;
use App\Modules\NewsRadarWhatsApp\Models\UserWhatsAppEventState;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppInboundEvent;
use Illuminate\Support\Facades\DB;

class MarkWhatsAppGroupAsReadAction
{
    public function execute(User $user, UserWhatsAppNewsGroup $preference, int $lastSeenEventId): UserWhatsAppNewsGroup
    {
        return DB::transaction(function () use ($user, $preference, $lastSeenEventId): UserWhatsAppNewsGroup {
            $event = WhatsAppInboundEvent::query()
                ->whereKey($lastSeenEventId)
                ->where('whatsapp_group_fk', $preference->whatsapp_group_fk)
                ->firstOrFail();

            $preference->forceFill([
                'last_seen_event_id' => $event->id,
                'last_seen_event_at' => $event->sent_at ?? $event->received_at ?? now(),
            ])->save();

            $state = UserWhatsAppEventState::query()->firstOrNew([
                'user_id' => $user->getKey(),
                'inbound_event_id' => $event->id,
            ]);

            $state->fill([
                'last_seen_at' => now(),
            ])->save();

            return $preference->fresh(['group', 'lastSeenEvent']);
        });
    }
}
