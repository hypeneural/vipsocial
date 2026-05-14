<?php

namespace App\Modules\Externas\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExternalEventWhatsAppNotification extends Model
{
    use HasUlids;

    public const TRIGGER_CREATED = 'created';

    public const TRIGGER_DATE_CHANGED = 'date_changed';

    public const TRIGGER_TWO_HOURS_BEFORE = 'two_hours_before';

    public const RECIPIENT_COLLABORATOR = 'collaborator';

    public const RECIPIENT_DEFAULT_TARGET = 'default_target';

    public const RECIPIENT_EVENT_TARGET = 'event_target';

    public const STATUS_PENDING = 'pending';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_SUCCESS = 'success';

    public const STATUS_FAILED = 'failed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_SKIPPED = 'skipped';

    protected $table = 'external_event_whatsapp_notifications';

    protected $fillable = [
        'external_event_id',
        'trigger_type',
        'recipient_type',
        'recipient_user_id',
        'recipient_name_snapshot',
        'recipient_role_snapshot',
        'target_kind',
        'target_value',
        'message_snapshot',
        'event_title_snapshot',
        'event_start_snapshot',
        'scheduled_for',
        'status',
        'idempotency_key',
        'provider',
        'provider_zaap_id',
        'provider_message_id',
        'provider_response_id',
        'provider_status_code',
        'provider_response',
        'error_message',
        'sent_at',
    ];

    protected $casts = [
        'event_start_snapshot' => 'datetime',
        'scheduled_for' => 'datetime',
        'provider_response' => 'array',
        'sent_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(ExternalEvent::class, 'external_event_id');
    }

    public function recipientUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_user_id');
    }
}
