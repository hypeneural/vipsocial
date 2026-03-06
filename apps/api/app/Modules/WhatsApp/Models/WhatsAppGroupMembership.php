<?php

namespace App\Modules\WhatsApp\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppGroupMembership extends Model
{
    use HasUlids;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_LEFT = 'left';

    protected $table = 'whatsapp_group_memberships';

    protected $fillable = [
        'group_fk',
        'participant_fk',
        'status',
        'is_admin',
        'is_super_admin',
        'joined_at',
        'left_at',
        'last_seen_at',
        'times_joined',
    ];

    protected $casts = [
        'is_admin' => 'boolean',
        'is_super_admin' => 'boolean',
        'joined_at' => 'datetime',
        'left_at' => 'datetime',
        'last_seen_at' => 'datetime',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(WhatsAppGroup::class, 'group_fk');
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(WhatsAppParticipant::class, 'participant_fk');
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }
}
