<?php

namespace App\Modules\NewsRadarWhatsApp\Models;

use App\Models\User;
use App\Modules\NewsRadar\Models\NewsItem;
use App\Modules\WhatsApp\Models\WhatsAppGroup;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class WhatsAppNewsBundle extends Model
{
    use SoftDeletes;

    public const STATUS_OPEN = 'open';
    public const STATUS_REVIEWING = 'reviewing';
    public const STATUS_READY = 'ready';
    public const STATUS_PROMOTED = 'promoted';
    public const STATUS_ARCHIVED = 'archived';

    public const CREATION_MODE_MANUAL = 'manual_selection';
    public const CREATION_MODE_SUGGESTED = 'manual_plus_suggestions';

    protected $table = 'whatsapp_news_bundles';

    protected $fillable = [
        'whatsapp_group_fk',
        'status',
        'creation_mode',
        'assigned_to',
        'title',
        'slug_hint',
        'headline_draft',
        'subheadline_draft',
        'lead_draft',
        'summary',
        'origin_summary',
        'notes',
        'editorial_notes',
        'promotion_notes',
        'city',
        'urgency',
        'category',
        'categories_json',
        'is_starred',
        'cover_media_id',
        'lock_version',
        'last_opened_by',
        'last_opened_at',
        'review_started_at',
        'promoted_at',
        'archived_at',
        'created_by',
        'updated_by',
        'first_message_at',
        'last_message_at',
        'message_count',
        'media_count',
        'primary_sender_name',
        'has_updated_source_messages',
        'promoted_news_item_id',
    ];

    protected $casts = [
        'categories_json' => 'array',
        'is_starred' => 'boolean',
        'has_updated_source_messages' => 'boolean',
        'last_opened_at' => 'datetime',
        'review_started_at' => 'datetime',
        'promoted_at' => 'datetime',
        'archived_at' => 'datetime',
        'first_message_at' => 'datetime',
        'last_message_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(WhatsAppGroup::class, 'whatsapp_group_fk');
    }

    public function items(): HasMany
    {
        return $this->hasMany(WhatsAppNewsBundleItem::class, 'bundle_id')->orderBy('sort_order');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function promotedNewsItem(): BelongsTo
    {
        return $this->belongsTo(NewsItem::class, 'promoted_news_item_id');
    }
}
