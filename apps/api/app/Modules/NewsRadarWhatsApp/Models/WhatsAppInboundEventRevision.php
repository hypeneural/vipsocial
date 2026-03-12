<?php

namespace App\Modules\NewsRadarWhatsApp\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppInboundEventRevision extends Model
{
    protected $table = 'whatsapp_inbound_event_revisions';

    protected $fillable = [
        'inbound_event_id',
        'revision_number',
        'payload_json',
        'text_message',
        'text_title',
        'text_description',
        'link_url',
        'edited_at',
    ];

    protected $casts = [
        'payload_json' => 'array',
        'edited_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(WhatsAppInboundEvent::class, 'inbound_event_id');
    }
}
