<?php

namespace App\Modules\VipGallery\Models;

use App\Modules\Externas\Models\ExternalEvent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class VipGallerySlideshow extends Model
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_PAUSED = 'paused';

    public const STATUS_ARCHIVED = 'archived';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_DISABLED = 'disabled';

    public const LAYOUT_AUTO = 'auto';

    public const LAYOUT_POLAROID = 'polaroid';

    public const LAYOUT_FULLSCREEN = 'fullscreen';

    public const LAYOUT_SPLIT = 'split';

    public const LAYOUT_CINEMATIC = 'cinematic';

    protected $table = 'vip_gallery_slideshows';

    protected $fillable = [
        'external_event_id',
        'slideshow_code',
        'is_enabled',
        'status',
        'layout',
        'interval_ms',
        'queue_limit',
        'background_url',
        'partner_logo_path',
        'show_neon',
        'show_sender_credit',
        'neon_text',
        'instructions_text',
        'expires_at',
    ];

    protected $casts = [
        'external_event_id' => 'integer',
        'is_enabled' => 'boolean',
        'interval_ms' => 'integer',
        'queue_limit' => 'integer',
        'show_neon' => 'boolean',
        'show_sender_credit' => 'boolean',
        'expires_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $slideshow): void {
            if (! is_string($slideshow->slideshow_code) || trim($slideshow->slideshow_code) === '') {
                $slideshow->slideshow_code = static::generateUniqueCode();
            }

            if (! is_string($slideshow->status) || trim($slideshow->status) === '') {
                $slideshow->status = self::STATUS_DRAFT;
            }

            if (! is_string($slideshow->layout) || trim($slideshow->layout) === '') {
                $slideshow->layout = (string) config('vip_gallery.slideshow.default_layout', self::LAYOUT_AUTO);
            }

            if ((int) $slideshow->interval_ms <= 0) {
                $slideshow->interval_ms = (int) config('vip_gallery.slideshow.default_interval_ms', 10000);
            }

            if ((int) $slideshow->queue_limit <= 0) {
                $slideshow->queue_limit = (int) config('vip_gallery.slideshow.default_queue_limit', 100);
            }

            if ($slideshow->instructions_text === null) {
                $slideshow->instructions_text = (string) config('vip_gallery.slideshow.default_instructions_text', '');
            }

            if ($slideshow->show_sender_credit === null) {
                $slideshow->show_sender_credit = (bool) config('vip_gallery.slideshow.default_show_sender_credit', false);
            }
        });
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(ExternalEvent::class, 'external_event_id');
    }

    public function isPlayable(): bool
    {
        $event = $this->relationLoaded('event')
            ? $this->getRelation('event')
            : $this->event()->first();

        return $this->is_enabled
            && $this->status === self::STATUS_ACTIVE
            && $event?->isVipGalleryActive() === true;
    }

    public function isAvailable(): bool
    {
        $event = $this->relationLoaded('event')
            ? $this->getRelation('event')
            : $this->event()->first();

        return $this->is_enabled
            && ! in_array($this->status, [self::STATUS_ARCHIVED, self::STATUS_EXPIRED], true)
            && $event?->is_vip_gallery === true;
    }

    public function publicStatus(): string
    {
        $event = $this->relationLoaded('event')
            ? $this->getRelation('event')
            : $this->event()->first();

        if (! $this->is_enabled) {
            return self::STATUS_DISABLED;
        }

        if (($event?->vip_gallery_status ?? null) === ExternalEvent::VIP_GALLERY_STATUS_ARCHIVED) {
            return self::STATUS_ARCHIVED;
        }

        if (($event?->vip_gallery_status ?? null) === ExternalEvent::VIP_GALLERY_STATUS_PAUSED) {
            return self::STATUS_PAUSED;
        }

        if (($event?->vip_gallery_status ?? null) === ExternalEvent::VIP_GALLERY_STATUS_DRAFT) {
            return self::STATUS_DRAFT;
        }

        return $this->status;
    }

    public function publicUrl(): string
    {
        $baseUrl = rtrim((string) config('app.url'), '/');
        $prefix = trim((string) config('vip_gallery.slideshow.public_path_prefix', 'slideshow'), '/');

        return "{$baseUrl}/{$prefix}/{$this->slideshow_code}";
    }

    public static function statuses(): array
    {
        return [
            self::STATUS_DRAFT,
            self::STATUS_ACTIVE,
            self::STATUS_PAUSED,
            self::STATUS_ARCHIVED,
            self::STATUS_EXPIRED,
        ];
    }

    public static function layouts(): array
    {
        return [
            self::LAYOUT_AUTO,
            self::LAYOUT_POLAROID,
            self::LAYOUT_FULLSCREEN,
            self::LAYOUT_SPLIT,
            self::LAYOUT_CINEMATIC,
        ];
    }

    private static function generateUniqueCode(): string
    {
        $length = max(6, (int) config('vip_gallery.slideshow.code_length', 6));

        do {
            $candidate = Str::upper(Str::random($length));
        } while (static::query()->where('slideshow_code', $candidate)->exists());

        return $candidate;
    }
}
