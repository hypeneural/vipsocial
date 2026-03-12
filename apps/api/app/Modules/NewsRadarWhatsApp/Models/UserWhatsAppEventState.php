<?php

namespace App\Modules\NewsRadarWhatsApp\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserWhatsAppEventState extends Model
{
    protected $table = 'user_whatsapp_event_states';

    protected $fillable = [
        'user_id',
        'inbound_event_id',
        'is_ignored',
        'is_starred',
        'reviewed_at',
        'last_seen_at',
    ];

    protected $casts = [
        'is_ignored' => 'boolean',
        'is_starred' => 'boolean',
        'reviewed_at' => 'datetime',
        'last_seen_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(WhatsAppInboundEvent::class, 'inbound_event_id');
    }
}
