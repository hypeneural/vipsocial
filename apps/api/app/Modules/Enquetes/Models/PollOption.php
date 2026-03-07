<?php

namespace App\Modules\Enquetes\Models;

use App\Modules\Enquetes\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class PollOption extends Model implements HasMedia
{
    use HasPublicId;
    use InteractsWithMedia;

    protected $table = 'poll_options';

    protected $fillable = [
        'poll_id',
        'public_id',
        'label',
        'description',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function poll(): BelongsTo
    {
        return $this->belongsTo(Poll::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('option_image')
            ->useDisk((string) config('enquetes.media.disk', 'public'))
            ->singleFile();
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->fit(Fit::Crop, 320, 320)
            ->performOnCollections('option_image')
            ->nonQueued();

        $this->addMediaConversion('web')
            ->fit(Fit::Contain, 1280, 1280)
            ->performOnCollections('option_image')
            ->nonQueued();
    }
}
