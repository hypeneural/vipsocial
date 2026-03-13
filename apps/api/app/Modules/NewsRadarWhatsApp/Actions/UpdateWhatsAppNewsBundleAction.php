<?php

namespace App\Modules\NewsRadarWhatsApp\Actions;

use App\Models\User;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppNewsBundle;

class UpdateWhatsAppNewsBundleAction
{
    public function execute(User $user, WhatsAppNewsBundle $bundle, array $attributes): WhatsAppNewsBundle
    {
        $this->assertLockVersion($bundle, (int) $attributes['lock_version']);

        unset($attributes['lock_version']);

        $bundle->fill($attributes);
        $bundle->forceFill([
            'updated_by' => $user->getKey(),
            'lock_version' => $bundle->lock_version + 1,
        ])->save();

        return $bundle->fresh(['group', 'items.event']);
    }

    public function assertLockVersion(WhatsAppNewsBundle $bundle, int $lockVersion): void
    {
        if ($bundle->lock_version !== $lockVersion) {
            throw new \RuntimeException('Agrupamento editorial desatualizado. Atualize a tela antes de salvar.');
        }
    }
}
