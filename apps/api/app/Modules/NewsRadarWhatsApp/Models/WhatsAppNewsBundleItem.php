<?php

namespace App\Modules\NewsRadarWhatsApp\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppNewsBundleItem extends Model
{
    protected $table = 'whatsapp_news_bundle_items';

    protected $fillable = [
        'bundle_id',
        'inbound_event_id',
        'sort_order',
        'is_cover',
        'added_by',
    ];

    protected $casts = [
        'is_cover' => 'boolean',
    ];

    public function bundle(): BelongsTo
    {
        return $this->belongsTo(WhatsAppNewsBundle::class, 'bundle_id');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(WhatsAppInboundEvent::class, 'inbound_event_id');
    }

    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by');
    }
}
