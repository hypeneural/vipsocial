<?php

namespace App\Modules\NewsRadarWhatsApp\Actions;

use App\Models\User;
use App\Modules\NewsRadarWhatsApp\Models\UserWhatsAppNewsGroup;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppNewsBundle;

class EnsureWhatsAppNewsGroupAccessAction
{
    public function forGroup(User $user, string $groupFk): UserWhatsAppNewsGroup
    {
        return UserWhatsAppNewsGroup::query()
            ->where('user_id', $user->getKey())
            ->where('whatsapp_group_fk', $groupFk)
            ->where('is_active', true)
            ->firstOrFail();
    }

    public function forBundle(User $user, WhatsAppNewsBundle $bundle): UserWhatsAppNewsGroup
    {
        return $this->forGroup($user, $bundle->whatsapp_group_fk);
    }
}
