<?php

namespace App\Modules\NewsRadarWhatsApp\Models;

use App\Models\User;
use App\Modules\NewsRadar\Models\NewsItem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppBundlePromotionSnapshot extends Model
{
    protected $table = 'whatsapp_bundle_promotion_snapshots';

    protected $fillable = [
        'bundle_id',
        'news_item_id',
        'bundle_lock_version',
        'snapshot_json',
        'created_by',
    ];

    protected $casts = [
        'snapshot_json' => 'array',
    ];

    public function bundle(): BelongsTo
    {
        return $this->belongsTo(WhatsAppNewsBundle::class, 'bundle_id');
    }

    public function newsItem(): BelongsTo
    {
        return $this->belongsTo(NewsItem::class, 'news_item_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
