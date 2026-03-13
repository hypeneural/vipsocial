<?php

namespace App\Modules\NewsRadarWhatsApp\Actions;

use App\Models\User;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppNewsBundle;
use Illuminate\Support\Facades\DB;

class DuplicateWhatsAppNewsBundleAction
{
    public function __construct(
        private readonly SyncWhatsAppNewsBundleMetricsAction $syncMetrics,
    ) {
    }

    public function execute(User $user, WhatsAppNewsBundle $bundle): WhatsAppNewsBundle
    {
        return DB::transaction(function () use ($user, $bundle): WhatsAppNewsBundle {
            $bundle->loadMissing('items');

            $copy = WhatsAppNewsBundle::query()->create([
                'whatsapp_group_fk' => $bundle->whatsapp_group_fk,
                'status' => WhatsAppNewsBundle::STATUS_OPEN,
                'creation_mode' => $bundle->creation_mode,
                'assigned_to' => null,
                'title' => $bundle->title ? "{$bundle->title} (Copia)" : 'Agrupamento editorial (Copia)',
                'slug_hint' => $bundle->slug_hint,
                'headline_draft' => $bundle->headline_draft,
                'subheadline_draft' => $bundle->subheadline_draft,
                'lead_draft' => $bundle->lead_draft,
                'summary' => $bundle->summary,
                'origin_summary' => $bundle->origin_summary,
                'notes' => $bundle->notes,
                'editorial_notes' => $bundle->editorial_notes,
                'promotion_notes' => $bundle->promotion_notes,
                'city' => $bundle->city,
                'urgency' => $bundle->urgency,
                'category' => $bundle->category,
                'categories_json' => $bundle->categories_json,
                'is_starred' => false,
                'cover_media_id' => null,
                'lock_version' => 1,
                'created_by' => $user->getKey(),
                'updated_by' => $user->getKey(),
                'has_updated_source_messages' => false,
            ]);

            foreach ($bundle->items as $item) {
                $copy->items()->create([
                    'inbound_event_id' => $item->inbound_event_id,
                    'sort_order' => $item->sort_order,
                    'is_cover' => false,
                    'added_by' => $user->getKey(),
                ]);
            }

            return $this->syncMetrics->execute($copy);
        });
    }
}
