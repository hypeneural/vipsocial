<?php

namespace App\Modules\WhatsApp\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhatsAppParticipant extends Model
{
    use HasUlids;

    protected $table = 'whatsapp_participants';

    protected $fillable = [
        'lid',
        'phone',
        'first_seen_at',
        'last_seen_at',
    ];

    protected $casts = [
        'first_seen_at' => 'datetime',
        'last_seen_at' => 'datetime',
    ];

    public function memberships(): HasMany
    {
        return $this->hasMany(WhatsAppGroupMembership::class, 'participant_fk');
    }

    public function events(): HasMany
    {
        return $this->hasMany(WhatsAppGroupMemberEvent::class, 'participant_fk');
    }
}
