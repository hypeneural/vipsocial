<?php

namespace App\Modules\VipGallery\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VipGalleryWebhookLog extends Model
{
    public const TYPE_IMAGE = 'image';

    public const TYPE_TEXT_COMMAND = 'text_command';

    public const TYPE_INVALID = 'invalid';

    public const TYPE_UNKNOWN = 'unknown';

    protected $table = 'vip_gallery_webhook_logs';

    protected $fillable = [
        'message_id',
        'phone',
        'detected_type',
        'routing_status',
        'payload_json',
        'vip_gallery_photo_id',
        'error_message',
    ];

    protected $casts = [
        'payload_json' => 'array',
    ];

    public function photo(): BelongsTo
    {
        return $this->belongsTo(VipGalleryPhoto::class, 'vip_gallery_photo_id');
    }
}
