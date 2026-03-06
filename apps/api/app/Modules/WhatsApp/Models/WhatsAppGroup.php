<?php

namespace App\Modules\WhatsApp\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhatsAppGroup extends Model
{
    use HasUlids;

    protected $table = 'whatsapp_groups';

    protected $fillable = [
        'group_id',
        'name',
        'subject',
        'description',
        'owner_phone',
        'creation_ts',
        'admin_only_message',
        'admin_only_settings',
        'require_admin_approval',
        'is_group_announcement',
        'admin_only_add_member',
        'last_synced_at',
        'last_member_count',
        'is_active',
    ];

    protected $casts = [
        'admin_only_message' => 'boolean',
        'admin_only_settings' => 'boolean',
        'require_admin_approval' => 'boolean',
        'is_group_announcement' => 'boolean',
        'admin_only_add_member' => 'boolean',
        'is_active' => 'boolean',
        'last_synced_at' => 'datetime',
    ];

    public function memberships(): HasMany
    {
        return $this->hasMany(WhatsAppGroupMembership::class, 'group_fk');
    }

    public function events(): HasMany
    {
        return $this->hasMany(WhatsAppGroupMemberEvent::class, 'group_fk');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
