<?php

namespace App\Modules\VipGallery\Models;

use App\Modules\Externas\Models\ExternalEvent;
use App\Modules\VipGallery\Support\VipGalleryMediaManager;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VipGalleryBanner extends Model
{
    protected $table = 'vip_gallery_banners';

    protected $appends = [
        'image_url',
    ];

    protected $fillable = [
        'external_event_id',
        'image_path',
        'link_url',
        'alt_text',
        'width',
        'height',
        'sort_order',
        'is_active',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'width' => 'integer',
        'height' => 'integer',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(ExternalEvent::class, 'external_event_id');
    }

    public function scopeActiveWindow($query)
    {
        return $query
            ->where('is_active', true)
            ->where(function ($inner) {
                $inner->whereNull('start_date')
                    ->orWhere('start_date', '<=', now());
            })
            ->where(function ($inner) {
                $inner->whereNull('end_date')
                    ->orWhere('end_date', '>=', now());
            });
    }

    public function imageUrl(): string
    {
        return (string) app(VipGalleryMediaManager::class)->publicUrl($this->image_path);
    }

    public function getImageUrlAttribute(): string
    {
        return $this->imageUrl();
    }
}
