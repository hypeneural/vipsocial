<?php

namespace App\Modules\NewsRadarWhatsApp\Actions;

use App\Models\User;
use App\Modules\NewsRadarWhatsApp\Models\UserWhatsAppEventState;
use App\Modules\NewsRadarWhatsApp\Models\UserWhatsAppNewsGroup;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppInboundEvent;

class SetUserWhatsAppEventStateAction
{
    public function setIgnored(User $user, WhatsAppInboundEvent $event, bool $ignored): UserWhatsAppEventState
    {
        $this->ensureUserHasGroupAccess($user, $event);

        return $this->persistState($user, $event, [
            'is_ignored' => $ignored,
        ]);
    }

    public function setStarred(User $user, WhatsAppInboundEvent $event, bool $starred): UserWhatsAppEventState
    {
        $this->ensureUserHasGroupAccess($user, $event);

        return $this->persistState($user, $event, [
            'is_starred' => $starred,
        ]);
    }

    public function markReviewed(User $user, WhatsAppInboundEvent $event): UserWhatsAppEventState
    {
        $this->ensureUserHasGroupAccess($user, $event);

        return $this->persistState($user, $event, [
            'reviewed_at' => now(),
        ]);
    }

    private function persistState(User $user, WhatsAppInboundEvent $event, array $attributes): UserWhatsAppEventState
    {
        $state = UserWhatsAppEventState::query()->firstOrNew([
            'user_id' => $user->getKey(),
            'inbound_event_id' => $event->getKey(),
        ]);

        $state->fill($attributes);

        if (! array_key_exists('last_seen_at', $attributes)) {
            $state->last_seen_at ??= now();
        }

        $state->save();

        return $state->fresh();
    }

    private function ensureUserHasGroupAccess(User $user, WhatsAppInboundEvent $event): void
    {
        UserWhatsAppNewsGroup::query()
            ->where('user_id', $user->getKey())
            ->where('whatsapp_group_fk', $event->whatsapp_group_fk)
            ->where('is_active', true)
            ->firstOrFail();
    }
}
