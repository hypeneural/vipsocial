<?php

namespace App\Modules\VipGallery\Models;

use App\Modules\Externas\Models\ExternalEvent;
use App\Modules\VipGallery\Support\VipGalleryMediaManager;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class VipGalleryPhoto extends Model
{
    use SoftDeletes;

    public const MEDIA_TYPE_IMAGE = 'image';

    public const MEDIA_TYPE_VIDEO = 'video';

    public const STATUS_RECEIVED = 'received';

    public const STATUS_PUBLISHED_ORIGINAL = 'published_original';

    public const STATUS_PROCESSED = 'processed';

    public const STATUS_FAILED = 'failed';

    public const STATUS_DELETED = 'deleted';

    protected $table = 'vip_gallery_photos';

    protected $fillable = [
        'external_event_id',
        'zapi_message_id',
        'participant_phone',
        'sender_name',
        'caption',
        'short_text',
        'original_image_url',
        'original_image_path',
        'processed_image_path',
        'media_type',
        'highlight_score',
        'width',
        'height',
        'processing_status',
        'processing_attempts',
        'last_processing_attempt_at',
        'processing_error',
        'sort_order',
        'downloads_count',
        'is_approved',
        'received_at',
        'published_at',
        'slideshow_visible_at',
    ];

    protected $casts = [
        'highlight_score' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'processing_attempts' => 'integer',
        'sort_order' => 'integer',
        'downloads_count' => 'integer',
        'is_approved' => 'boolean',
        'received_at' => 'datetime',
        'published_at' => 'datetime',
        'slideshow_visible_at' => 'datetime',
        'last_processing_attempt_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(ExternalEvent::class, 'external_event_id');
    }

    public function scopePubliclyVisible($query)
    {
        return $query
            ->where('is_approved', true)
            ->whereIn('processing_status', [
                self::STATUS_PUBLISHED_ORIGINAL,
                self::STATUS_PROCESSED,
            ]);
    }

    public function scopeSlideshowVisible($query)
    {
        return $query
            ->publiclyVisible()
            ->whereIn('media_type', [
                self::MEDIA_TYPE_IMAGE,
                self::MEDIA_TYPE_VIDEO,
            ]);
    }

    public function publicImagePath(): ?string
    {
        if ($this->processing_status === self::STATUS_PROCESSED && $this->processed_image_path) {
            return $this->processed_image_path;
        }

        return $this->original_image_path;
    }

    public function publicImageUrl(): ?string
    {
        return app(VipGalleryMediaManager::class)->publicUrl($this->publicImagePath());
    }

    public function slideshowIdentifier(): string
    {
        return 'photo_'.$this->id;
    }

    public function slideshowText(): string
    {
        return trim((string) ($this->short_text ?: $this->caption ?: ''));
    }

    public function slideshowType(): string
    {
        $type = trim((string) ($this->media_type ?: self::MEDIA_TYPE_IMAGE));

        return in_array($type, [self::MEDIA_TYPE_IMAGE, self::MEDIA_TYPE_VIDEO], true)
            ? $type
            : self::MEDIA_TYPE_IMAGE;
    }

    public function slideshowCreatedAt()
    {
        return $this->received_at ?: $this->published_at ?: $this->created_at;
    }

    public function isProcessed(): bool
    {
        return $this->processing_status === self::STATUS_PROCESSED
            && is_string($this->processed_image_path)
            && $this->processed_image_path !== '';
    }
}
