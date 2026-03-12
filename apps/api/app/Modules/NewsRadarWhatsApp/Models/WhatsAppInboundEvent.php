<?php

namespace App\Modules\NewsRadarWhatsApp\Models;

use App\Modules\WhatsApp\Models\WhatsAppGroup;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhatsAppInboundEvent extends Model
{
    public const STATUS_RECEIVED = 'received';
    public const STATUS_NORMALIZED = 'normalized';
    public const STATUS_GROUP_RESOLVED = 'group_resolved';
    public const STATUS_MEDIA_PENDING = 'media_pending';
    public const STATUS_READY = 'ready';
    public const STATUS_IGNORED = 'ignored';
    public const STATUS_FAILED = 'failed';

    public const IGNORED_GROUP_NOT_ENABLED = 'group_not_enabled';
    public const IGNORED_NOT_GROUP_MESSAGE = 'not_group_message';
    public const IGNORED_FROM_ME = 'from_me';
    public const IGNORED_UNSUPPORTED_KIND = 'unsupported_kind';
    public const IGNORED_NEWSLETTER_NOT_ALLOWED = 'newsletter_not_allowed';

    public const DOWNLOAD_PENDING = 'pending';
    public const DOWNLOAD_DOWNLOADED = 'downloaded';
    public const DOWNLOAD_FAILED = 'failed';
    public const DOWNLOAD_EXPIRED = 'expired';
    public const DOWNLOAD_SKIPPED = 'skipped';

    protected $table = 'whatsapp_inbound_events';

    protected $fillable = [
        'provider',
        'instance_id',
        'message_id',
        'provider_message_id',
        'normalized_version',
        'payload_hash',
        'ingested_via_receipt_id',
        'whatsapp_group_fk',
        'group_id_raw',
        'chat_name',
        'is_group',
        'is_newsletter',
        'from_me',
        'is_edit',
        'provider_event_type',
        'status',
        'message_kind',
        'participant_phone',
        'participant_lid',
        'participant_display_name',
        'sender_name',
        'sender_photo',
        'sender_snapshot_json',
        'reference_message_id',
        'reply_to_message_id',
        'reply_to_inbound_event_id',
        'text_message',
        'text_title',
        'text_description',
        'link_url',
        'processing_status',
        'ignored_reason',
        'provider_error_code',
        'provider_error_message',
        'is_deleted',
        'deleted_at',
        'download_status',
        'group_resolved_at',
        'ready_at',
        'has_media',
        'has_caption',
        'is_forwarded',
        'forwarded_score',
        'news_signal_score',
        'relevance_score',
        'suggested_bundle_key',
        'detected_city',
        'detected_category',
        'has_external_link',
        'contains_release_pattern',
        'sent_at',
        'received_at',
        'edited_at',
    ];

    protected $casts = [
        'sender_snapshot_json' => 'array',
        'is_group' => 'boolean',
        'is_newsletter' => 'boolean',
        'from_me' => 'boolean',
        'is_edit' => 'boolean',
        'is_deleted' => 'boolean',
        'has_media' => 'boolean',
        'has_caption' => 'boolean',
        'is_forwarded' => 'boolean',
        'has_external_link' => 'boolean',
        'contains_release_pattern' => 'boolean',
        'forwarded_score' => 'float',
        'news_signal_score' => 'float',
        'relevance_score' => 'float',
        'deleted_at' => 'datetime',
        'group_resolved_at' => 'datetime',
        'ready_at' => 'datetime',
        'sent_at' => 'datetime',
        'received_at' => 'datetime',
        'edited_at' => 'datetime',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(WhatsAppGroup::class, 'whatsapp_group_fk');
    }

    public function media(): HasMany
    {
        return $this->hasMany(WhatsAppInboundEventMedia::class, 'inbound_event_id');
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(WhatsAppInboundEventRevision::class, 'inbound_event_id');
    }

    public function userStates(): HasMany
    {
        return $this->hasMany(UserWhatsAppEventState::class, 'inbound_event_id');
    }

    public function bundleItems(): HasMany
    {
        return $this->hasMany(WhatsAppNewsBundleItem::class, 'inbound_event_id');
    }
}
