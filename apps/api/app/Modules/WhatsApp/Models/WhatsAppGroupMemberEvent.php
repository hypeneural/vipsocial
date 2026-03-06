<?php

namespace App\Modules\WhatsApp\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppGroupMemberEvent extends Model
{
    use HasUlids;

    public const TYPE_JOIN = 'join';
    public const TYPE_LEAVE = 'leave';
    public const TYPE_PROMOTE_ADMIN = 'promote_admin';
    public const TYPE_DEMOTE_ADMIN = 'demote_admin';

    protected $table = 'whatsapp_group_member_events';

    protected $fillable = [
        'group_fk',
        'participant_fk',
        'event_type',
        'event_at',
        'sync_batch_id',
    ];

    protected $casts = [
        'event_at' => 'datetime',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(WhatsAppGroup::class, 'group_fk');
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(WhatsAppParticipant::class, 'participant_fk');
    }
}
