<?php

namespace App\Modules\VipGallery\Support;

use App\Modules\Externas\Models\ExternalEvent;

class VipGalleryEventResolver
{
    public function resolvePublic(string $identifier): ExternalEvent
    {
        $query = ExternalEvent::query()
            ->where('is_vip_gallery', true);

        if (ctype_digit($identifier)) {
            $query->where(function ($inner) use ($identifier) {
                $inner->where('id', (int) $identifier)
                    ->orWhere('gallery_slug', $identifier);
            });
        } else {
            $query->where('gallery_slug', $identifier);
        }

        return $query->firstOrFail();
    }

    public function resolveActiveByGroupId(string $groupId): ?ExternalEvent
    {
        return ExternalEvent::query()
            ->where('is_vip_gallery', true)
            ->where('vip_gallery_status', ExternalEvent::VIP_GALLERY_STATUS_ACTIVE)
            ->where('whatsapp_group_id', $groupId)
            ->first();
    }
}
