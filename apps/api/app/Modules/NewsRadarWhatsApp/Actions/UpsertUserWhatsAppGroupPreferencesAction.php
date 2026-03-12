<?php

namespace App\Modules\NewsRadarWhatsApp\Actions;

use App\Models\User;
use App\Modules\NewsRadarWhatsApp\Models\UserWhatsAppNewsGroup;
use App\Modules\WhatsApp\Models\WhatsAppGroup;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class UpsertUserWhatsAppGroupPreferencesAction
{
    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return Collection<int, UserWhatsAppNewsGroup>
     */
    public function execute(User $user, array $items): Collection
    {
        return DB::transaction(function () use ($user, $items): Collection {
            $result = collect();

            foreach ($items as $index => $item) {
                $group = WhatsAppGroup::query()->findOrFail($item['whatsapp_group_fk']);

                $preference = UserWhatsAppNewsGroup::query()->firstOrNew([
                    'user_id' => $user->getKey(),
                    'whatsapp_group_fk' => $group->getKey(),
                ]);

                $preference->fill([
                    'is_active' => (bool) ($item['is_active'] ?? true),
                    'sort_order' => isset($item['sort_order']) ? (int) $item['sort_order'] : $index,
                    'label_override' => $item['label_override'] ?? $preference->label_override,
                    'notification_mode' => $item['notification_mode'] ?? $preference->notification_mode,
                ]);

                $preference->save();
                $result->push($preference->fresh('group'));
            }

            return $result;
        });
    }
}
