<?php

namespace App\Modules\WhatsApp\Models;

use App\Modules\NewsRadarWhatsApp\Models\UserWhatsAppNewsGroup;
use App\Modules\NewsRadarWhatsApp\Models\WhatsAppInboundEvent;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhatsAppGroup extends Model
{
    use HasUlids;

    protected $table = 'whatsapp_groups';

    protected $fillable = [
        'provider',
        'group_id',
        'provider_group_id',
        'name',
        'subject',
        'description',
        'owner_phone',
        'connected_phone',
        'creation_ts',
        'admin_only_message',
        'admin_only_settings',
        'require_admin_approval',
        'is_group_announcement',
        'admin_only_add_member',
        'last_synced_at',
        'last_member_count',
        'is_active',
        'news_ingest_enabled',
        'vip_gallery_enabled',
        'allow_media_download',
        'allow_ai_export',
        'default_label',
        'default_city',
        'default_category',
        'news_source_id',
    ];

    protected $casts = [
        'admin_only_message' => 'boolean',
        'admin_only_settings' => 'boolean',
        'require_admin_approval' => 'boolean',
        'is_group_announcement' => 'boolean',
        'admin_only_add_member' => 'boolean',
        'is_active' => 'boolean',
        'news_ingest_enabled' => 'boolean',
        'vip_gallery_enabled' => 'boolean',
        'allow_media_download' => 'boolean',
        'allow_ai_export' => 'boolean',
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

    public function inboundEvents(): HasMany
    {
        return $this->hasMany(WhatsAppInboundEvent::class, 'whatsapp_group_fk');
    }

    public function newsUserPreferences(): HasMany
    {
        return $this->hasMany(UserWhatsAppNewsGroup::class, 'whatsapp_group_fk');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
