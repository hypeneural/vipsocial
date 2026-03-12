<?php

namespace App\Modules\NewsRadarWhatsApp\Http\Resources;

use App\Modules\NewsRadarWhatsApp\Models\WhatsAppInboundEvent;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin WhatsAppInboundEvent */
class WhatsAppTimelineEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $userState = $this->userStates->first();

        return [
            'id' => $this->id,
            'provider' => $this->provider,
            'instance_id' => $this->instance_id,
            'message_id' => $this->message_id,
            'group_id_raw' => $this->group_id_raw,
            'chat_name' => $this->chat_name,
            'message_kind' => $this->message_kind,
            'processing_status' => $this->processing_status,
            'ignored_reason' => $this->ignored_reason,
            'download_status' => $this->download_status,
            'participant_phone' => $this->participant_phone,
            'participant_lid' => $this->participant_lid,
            'sender_name' => $this->sender_name,
            'sender_photo' => $this->sender_photo,
            'reference_message_id' => $this->reference_message_id,
            'reply_to_message_id' => $this->reply_to_message_id,
            'text_message' => $this->text_message,
            'text_title' => $this->text_title,
            'text_description' => $this->text_description,
            'link_url' => $this->link_url,
            'has_media' => (bool) $this->has_media,
            'has_caption' => (bool) $this->has_caption,
            'is_deleted' => (bool) $this->is_deleted,
            'is_forwarded' => (bool) $this->is_forwarded,
            'sent_at' => $this->sent_at?->toIso8601String(),
            'received_at' => $this->received_at?->toIso8601String(),
            'edited_at' => $this->edited_at?->toIso8601String(),
            'editorial_state' => $this->resolveEditorialState($userState),
            'user_state' => [
                'is_ignored' => (bool) ($userState?->is_ignored ?? false),
                'is_starred' => (bool) ($userState?->is_starred ?? false),
                'reviewed_at' => $userState?->reviewed_at?->toIso8601String(),
                'last_seen_at' => $userState?->last_seen_at?->toIso8601String(),
            ],
            'media' => $this->media->map(fn ($media) => [
                'id' => $media->id,
                'kind' => $media->kind,
                'source_url' => $media->source_url,
                'thumbnail_source_url' => $media->thumbnail_source_url,
                'mime_type' => $media->mime_type,
                'file_name' => $media->file_name,
                'width' => $media->width,
                'height' => $media->height,
                'page_count' => $media->page_count,
                'download_status' => $media->download_status,
            ])->values()->all(),
        ];
    }

    private function resolveEditorialState($userState): string
    {
        if ($userState?->is_ignored) {
            return 'ignored';
        }

        if ($userState?->reviewed_at) {
            return 'reviewed';
        }

        return 'new';
    }
}
