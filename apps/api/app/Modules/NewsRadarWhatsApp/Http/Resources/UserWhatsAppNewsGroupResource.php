<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Resources;

use App\Modules\NewsRadarWhatsApp\Models\UserWhatsAppNewsGroup;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin UserWhatsAppNewsGroup */
class UserWhatsAppNewsGroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $group = $this->group;

        return [
            'id' => $this->id,
            'whatsapp_group_fk' => $this->whatsapp_group_fk,
            'is_active' => (bool) $this->is_active,
            'sort_order' => (int) $this->sort_order,
            'label_override' => $this->label_override,
            'notification_mode' => $this->notification_mode,
            'last_seen_event_id' => $this->last_seen_event_id,
            'last_seen_event_at' => $this->last_seen_event_at?->toIso8601String(),
            'group' => $group ? [
                'id' => $group->id,
                'group_id' => $group->group_id,
                'provider' => $group->provider,
                'provider_group_id' => $group->provider_group_id,
                'name' => $group->name,
                'default_label' => $group->default_label,
                'news_ingest_enabled' => (bool) $group->news_ingest_enabled,
                'allow_media_download' => (bool) $group->allow_media_download,
            ] : null,
            'stats' => [
                'unread_count' => (int) ($this->resource['unread_count'] ?? 0),
                'latest_event_at' => $this->resource['latest_event_at'] ?? null,
                'latest_event_preview' => $this->resource['latest_event_preview'] ?? null,
            ],
        ];
    }
}
