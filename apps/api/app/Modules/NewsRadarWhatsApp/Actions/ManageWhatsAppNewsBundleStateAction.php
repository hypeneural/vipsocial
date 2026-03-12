<?php

namespace App\Modules\NewsRadarWhatsApp\Actions;

use App\Models\User;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppNewsBundle;

class ManageWhatsAppNewsBundleStateAction
{
    public function __construct(
        private readonly UpdateWhatsAppNewsBundleAction $updateBundle,
    ) {
    }

    public function setStarred(User $user, WhatsAppNewsBundle $bundle, bool $isStarred): WhatsAppNewsBundle
    {
        $bundle->forceFill([
            'is_starred' => $isStarred,
            'updated_by' => $user->getKey(),
        ])->save();

        return $bundle->fresh(['group', 'items.event']);
    }

    public function archive(User $user, WhatsAppNewsBundle $bundle, int $lockVersion): WhatsAppNewsBundle
    {
        $this->updateBundle->assertLockVersion($bundle, $lockVersion);

        if ($bundle->status === WhatsAppNewsBundle::STATUS_PROMOTED) {
            throw new \RuntimeException('Bundle promovido nao pode ser arquivado pelo fluxo comum.');
        }

        $bundle->forceFill([
            'status' => WhatsAppNewsBundle::STATUS_ARCHIVED,
            'archived_at' => now(),
            'updated_by' => $user->getKey(),
            'lock_version' => $bundle->lock_version + 1,
        ])->save();

        return $bundle->fresh(['group', 'items.event']);
    }

    public function reopen(User $user, WhatsAppNewsBundle $bundle, int $lockVersion): WhatsAppNewsBundle
    {
        $this->updateBundle->assertLockVersion($bundle, $lockVersion);

        $bundle->forceFill([
            'status' => WhatsAppNewsBundle::STATUS_OPEN,
            'archived_at' => null,
            'updated_by' => $user->getKey(),
            'lock_version' => $bundle->lock_version + 1,
        ])->save();

        return $bundle->fresh(['group', 'items.event']);
    }
}
