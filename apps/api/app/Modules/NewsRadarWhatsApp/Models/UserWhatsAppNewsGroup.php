<?php

namespace App\Modules\NewsRadarWhatsApp\Models;

use App\Models\User;
use App\Modules\WhatsApp\Models\WhatsAppGroup;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserWhatsAppNewsGroup extends Model
{
    protected $table = 'user_whatsapp_news_groups';

    protected $fillable = [
        'user_id',
        'whatsapp_group_fk',
        'is_active',
        'sort_order',
        'label_override',
        'last_seen_event_id',
        'last_seen_event_at',
        'notification_mode',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_seen_event_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(WhatsAppGroup::class, 'whatsapp_group_fk');
    }

    public function lastSeenEvent(): BelongsTo
    {
        return $this->belongsTo(WhatsAppInboundEvent::class, 'last_seen_event_id');
    }
}
