<?php

namespace App\Modules\NewsRadarWhatsApp\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppInboundEventMedia extends Model
{
    protected $table = 'whatsapp_inbound_event_media';

    protected $fillable = [
        'inbound_event_id',
        'kind',
        'source_url',
        'thumbnail_source_url',
        'storage_disk',
        'storage_path',
        'storage_visibility',
        'thumbnail_storage_path',
        'file_name',
        'mime_type',
        'file_size',
        'sha256',
        'width',
        'height',
        'duration_ms',
        'page_count',
        'download_status',
        'download_attempts',
        'preview_ready_at',
        'last_error',
    ];

    protected $casts = [
        'preview_ready_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(WhatsAppInboundEvent::class, 'inbound_event_id');
    }
}
