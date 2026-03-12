<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Resources;

use App\Modules\NewsRadarWhatsApp\Models\UserWhatsAppNewsGroup;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin UserWhatsAppNewsGroup */
class WhatsAppGroupSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $group = $this->group;

        return [
            'whatsapp_group_fk' => $this->whatsapp_group_fk,
            'last_seen_event_id' => $this->last_seen_event_id,
            'last_seen_event_at' => $this->last_seen_event_at?->toIso8601String(),
            'group' => $group ? [
                'id' => $group->id,
                'group_id' => $group->group_id,
                'name' => $group->name,
                'label' => $this->label_override ?: $group->default_label ?: $group->name,
                'description' => $group->description,
            ] : null,
            'stats' => [
                'total_events' => (int) ($this->resource['total_events'] ?? 0),
                'unread_count' => (int) ($this->resource['unread_count'] ?? 0),
                'ignored_count' => (int) ($this->resource['ignored_count'] ?? 0),
                'starred_count' => (int) ($this->resource['starred_count'] ?? 0),
                'latest_event_at' => $this->resource['latest_event_at'] ?? null,
            ],
        ];
    }
}
