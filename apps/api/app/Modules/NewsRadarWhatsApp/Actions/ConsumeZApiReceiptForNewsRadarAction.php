<?php

namespace App\Modules\NewsRadarWhatsApp\Actions;

use App\Modules\NewsRadarWhatsApp\Models\WhatsAppInboundEvent;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppInboundEventMedia;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppInboundEventRevision;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppNewsBundle;
use App\Modules\WhatsApp\Models\WhatsAppGroup;
use App\Modules\WhatsAppInbound\Models\WhatsAppWebhookReceipt;
use App\Modules\WhatsAppInbound\Support\ZApiInboundPayload;
use Illuminate\Support\Facades\DB;

class ConsumeZApiReceiptForNewsRadarAction
{
    public function execute(WhatsAppWebhookReceipt $receipt): WhatsAppInboundEvent
    {
        $payload = is_array($receipt->payload_json) ? $receipt->payload_json : [];
        $messageId = ZApiInboundPayload::messageId($payload);

        if (! is_string($messageId) || trim($messageId) === '') {
            throw new \RuntimeException('Payload sem messageId nao pode ser normalizado em evento canonico.');
        }

        return DB::transaction(function () use ($receipt, $payload, $messageId): WhatsAppInboundEvent {
            $instanceId = ZApiInboundPayload::instanceId($payload) ?? '';
            $groupIdRaw = ZApiInboundPayload::groupId($payload);
            $group = $this->resolveGroup($groupIdRaw);
            $mediaItems = ZApiInboundPayload::mediaItems($payload);
            $textMessage = ZApiInboundPayload::textMessage($payload);

            $event = WhatsAppInboundEvent::query()
                ->where('provider', $receipt->provider)
                ->where('instance_id', $instanceId)
                ->where('message_id', $messageId)
                ->lockForUpdate()
                ->first();

            if ($event && ZApiInboundPayload::isEdit($payload)) {
                $this->createRevision($event, $payload);
            }

            $status = $this->resolveProcessingStatus($payload, $group, $mediaItems);
            $downloadStatus = $this->resolveAggregateDownloadStatus($group, $mediaItems);

            $event ??= new WhatsAppInboundEvent([
                'provider' => $receipt->provider,
                'instance_id' => $instanceId,
                'message_id' => $messageId,
            ]);

            $event->fill([
                'provider_message_id' => $messageId,
                'normalized_version' => 1,
                'payload_hash' => $receipt->payload_hash,
                'ingested_via_receipt_id' => $receipt->id,
                'whatsapp_group_fk' => $group?->getKey(),
                'group_id_raw' => $groupIdRaw,
                'chat_name' => ZApiInboundPayload::chatName($payload),
                'is_group' => ZApiInboundPayload::isGroup($payload),
                'is_newsletter' => ZApiInboundPayload::isNewsletter($payload),
                'from_me' => ZApiInboundPayload::fromMe($payload),
                'is_edit' => ZApiInboundPayload::isEdit($payload),
                'provider_event_type' => ZApiInboundPayload::providerEventType($payload),
                'status' => ZApiInboundPayload::status($payload),
                'message_kind' => ZApiInboundPayload::messageKind($payload),
                'participant_phone' => ZApiInboundPayload::participantPhone($payload),
                'participant_lid' => ZApiInboundPayload::participantLid($payload),
                'sender_name' => ZApiInboundPayload::senderName($payload),
                'sender_photo' => ZApiInboundPayload::senderPhoto($payload),
                'sender_snapshot_json' => [
                    'sender_name' => ZApiInboundPayload::senderName($payload),
                    'sender_photo' => ZApiInboundPayload::senderPhoto($payload),
                ],
                'reference_message_id' => ZApiInboundPayload::referenceMessageId($payload),
                'reply_to_message_id' => ZApiInboundPayload::referenceMessageId($payload),
                'text_message' => $textMessage,
                'text_title' => ZApiInboundPayload::textTitle($payload),
                'text_description' => ZApiInboundPayload::textDescription($payload),
                'link_url' => ZApiInboundPayload::linkUrl($payload),
                'processing_status' => $status,
                'ignored_reason' => $this->resolveIgnoredReason($payload, $group),
                'provider_error_code' => null,
                'provider_error_message' => null,
                'is_deleted' => false,
                'deleted_at' => null,
                'download_status' => $downloadStatus,
                'group_resolved_at' => $group ? now() : null,
                'ready_at' => in_array($status, [WhatsAppInboundEvent::STATUS_READY, WhatsAppInboundEvent::STATUS_IGNORED], true) ? now() : null,
                'has_media' => $mediaItems !== [],
                'has_caption' => is_string($textMessage) && trim($textMessage) !== '' && $mediaItems !== [],
                'is_forwarded' => ZApiInboundPayload::isForwarded($payload),
                'has_external_link' => ZApiInboundPayload::linkUrl($payload) !== null,
                'contains_release_pattern' => false,
                'sent_at' => ZApiInboundPayload::sentAt($payload) ?? $receipt->received_at,
                'received_at' => $receipt->received_at,
                'edited_at' => ZApiInboundPayload::isEdit($payload) ? now() : $event->edited_at,
            ]);

            $event->save();

            $event->media()->delete();

            foreach ($mediaItems as $mediaItem) {
                $event->media()->create([
                    'kind' => $mediaItem['kind'],
                    'source_url' => $mediaItem['source_url'],
                    'thumbnail_source_url' => $mediaItem['thumbnail_source_url'],
                    'file_name' => $mediaItem['file_name'],
                    'mime_type' => $mediaItem['mime_type'],
                    'width' => $mediaItem['width'],
                    'height' => $mediaItem['height'],
                    'duration_ms' => $mediaItem['duration_ms'],
                    'page_count' => $mediaItem['page_count'],
                    'download_status' => $downloadStatus === WhatsAppInboundEvent::DOWNLOAD_SKIPPED
                        ? WhatsAppInboundEvent::DOWNLOAD_SKIPPED
                        : WhatsAppInboundEvent::DOWNLOAD_PENDING,
                    'download_attempts' => 0,
                ]);
            }

            if (ZApiInboundPayload::isEdit($payload)) {
                WhatsAppNewsBundle::query()
                    ->whereHas('items', fn ($query) => $query->where('inbound_event_id', $event->id))
                    ->update([
                        'has_updated_source_messages' => true,
                    ]);
            }

            $receipt->forceFill([
                'processing_status' => WhatsAppWebhookReceipt::STATUS_NORMALIZED,
                'normalized_event_id' => $event->id,
                'last_error' => null,
            ])->save();

            return $event->fresh(['media']);
        });
    }

    private function resolveGroup(?string $groupIdRaw): ?WhatsAppGroup
    {
        if (! is_string($groupIdRaw) || trim($groupIdRaw) === '') {
            return null;
        }

        return WhatsAppGroup::query()
            ->where(function ($query) use ($groupIdRaw) {
                $query->where('provider_group_id', $groupIdRaw)
                    ->orWhere('group_id', $groupIdRaw);
            })
            ->first();
    }

    /**
     * @param  array<int, array<string, mixed>>  $mediaItems
     */
    private function resolveProcessingStatus(array $payload, ?WhatsAppGroup $group, array $mediaItems): string
    {
        if (! ZApiInboundPayload::isGroup($payload)) {
            return WhatsAppInboundEvent::STATUS_IGNORED;
        }

        if (ZApiInboundPayload::isNewsletter($payload)) {
            return WhatsAppInboundEvent::STATUS_IGNORED;
        }

        if (ZApiInboundPayload::fromMe($payload)) {
            return WhatsAppInboundEvent::STATUS_IGNORED;
        }

        if (! $group || ! $group->is_active || ! $group->news_ingest_enabled) {
            return WhatsAppInboundEvent::STATUS_IGNORED;
        }

        if ($mediaItems !== [] && $group->allow_media_download) {
            return WhatsAppInboundEvent::STATUS_MEDIA_PENDING;
        }

        return WhatsAppInboundEvent::STATUS_READY;
    }

    private function resolveIgnoredReason(array $payload, ?WhatsAppGroup $group): ?string
    {
        if (! ZApiInboundPayload::isGroup($payload)) {
            return WhatsAppInboundEvent::IGNORED_NOT_GROUP_MESSAGE;
        }

        if (ZApiInboundPayload::isNewsletter($payload)) {
            return WhatsAppInboundEvent::IGNORED_NEWSLETTER_NOT_ALLOWED;
        }

        if (ZApiInboundPayload::fromMe($payload)) {
            return WhatsAppInboundEvent::IGNORED_FROM_ME;
        }

        if (! $group || ! $group->is_active || ! $group->news_ingest_enabled) {
            return WhatsAppInboundEvent::IGNORED_GROUP_NOT_ENABLED;
        }

        return null;
    }

    /**
     * @param  array<int, array<string, mixed>>  $mediaItems
     */
    private function resolveAggregateDownloadStatus(?WhatsAppGroup $group, array $mediaItems): string
    {
        if ($mediaItems === []) {
            return WhatsAppInboundEvent::DOWNLOAD_SKIPPED;
        }

        if (! $group || ! $group->allow_media_download) {
            return WhatsAppInboundEvent::DOWNLOAD_SKIPPED;
        }

        return WhatsAppInboundEvent::DOWNLOAD_PENDING;
    }

    private function createRevision(WhatsAppInboundEvent $event, array $payload): void
    {
        $revisionNumber = (int) $event->revisions()->max('revision_number') + 1;

        WhatsAppInboundEventRevision::query()->create([
            'inbound_event_id' => $event->id,
            'revision_number' => $revisionNumber,
            'payload_json' => $payload,
            'text_message' => $event->text_message,
            'text_title' => $event->text_title,
            'text_description' => $event->text_description,
            'link_url' => $event->link_url,
            'edited_at' => now(),
        ]);
    }
}
