<?php

namespace App\Modules\NewsRadarWhatsApp\Models;

use App\Modules\NewsRadar\Models\NewsItem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewsItemWhatsAppOrigin extends Model
{
    protected $table = 'news_item_whatsapp_origins';

    protected $fillable = [
        'news_item_id',
        'bundle_id',
        'inbound_event_id',
    ];

    public function newsItem(): BelongsTo
    {
        return $this->belongsTo(NewsItem::class, 'news_item_id');
    }

    public function bundle(): BelongsTo
    {
        return $this->belongsTo(WhatsAppNewsBundle::class, 'bundle_id');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(WhatsAppInboundEvent::class, 'inbound_event_id');
    }
}
