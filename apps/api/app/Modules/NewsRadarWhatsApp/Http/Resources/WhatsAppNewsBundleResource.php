<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Resources;

use App\Modules\NewsRadarWhatsApp\Models\WhatsAppNewsBundle;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin WhatsAppNewsBundle */
class WhatsAppNewsBundleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'whatsapp_group_fk' => $this->whatsapp_group_fk,
            'status' => $this->status,
            'creation_mode' => $this->creation_mode,
            'assigned_to' => $this->assigned_to,
            'title' => $this->title,
            'headline_draft' => $this->headline_draft,
            'subheadline_draft' => $this->subheadline_draft,
            'lead_draft' => $this->lead_draft,
            'summary' => $this->summary,
            'origin_summary' => $this->origin_summary,
            'notes' => $this->notes,
            'editorial_notes' => $this->editorial_notes,
            'promotion_notes' => $this->promotion_notes,
            'city' => $this->city,
            'urgency' => $this->urgency,
            'category' => $this->category,
            'categories_json' => $this->categories_json,
            'is_starred' => (bool) $this->is_starred,
            'cover_media_id' => $this->cover_media_id,
            'lock_version' => (int) $this->lock_version,
            'message_count' => (int) $this->message_count,
            'media_count' => (int) $this->media_count,
            'primary_sender_name' => $this->primary_sender_name,
            'has_updated_source_messages' => (bool) $this->has_updated_source_messages,
            'first_message_at' => $this->first_message_at?->toIso8601String(),
            'last_message_at' => $this->last_message_at?->toIso8601String(),
            'review_started_at' => $this->review_started_at?->toIso8601String(),
            'promoted_at' => $this->promoted_at?->toIso8601String(),
            'archived_at' => $this->archived_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'group' => $this->whenLoaded('group', fn () => [
                'id' => $this->group?->id,
                'name' => $this->group?->name,
                'group_id' => $this->group?->group_id,
            ]),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'sort_order' => $item->sort_order,
                'is_cover' => (bool) $item->is_cover,
                'event' => $item->relationLoaded('event') && $item->event ? [
                    'id' => $item->event->id,
                    'message_id' => $item->event->message_id,
                    'message_kind' => $item->event->message_kind,
                    'text_message' => $item->event->text_message,
                    'link_url' => $item->event->link_url,
                    'sender_name' => $item->event->sender_name,
                    'sent_at' => $item->event->sent_at?->toIso8601String(),
                    'has_media' => (bool) $item->event->has_media,
                ] : null,
            ])->values()->all()),
        ];
    }
}
