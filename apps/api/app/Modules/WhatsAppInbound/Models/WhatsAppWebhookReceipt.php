<?php

namespace App\Modules\WhatsAppInbound\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsAppWebhookReceipt extends Model
{
    public const PROVIDER_ZAPI = 'zapi';

    public const STATUS_RECEIVED = 'received';

    public const STATUS_DISPATCHED = 'dispatched';

    public const STATUS_NORMALIZED = 'normalized';

    public const STATUS_FAILED = 'failed';

    protected $table = 'whatsapp_webhook_receipts';

    protected $fillable = [
        'provider',
        'instance_id',
        'headers_json',
        'payload_json',
        'payload_hash',
        'received_at',
        'processing_status',
        'processing_attempts',
        'last_error',
        'normalized_event_id',
    ];

    protected $casts = [
        'headers_json' => 'array',
        'payload_json' => 'array',
        'received_at' => 'datetime',
    ];
}
