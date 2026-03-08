<?php

namespace App\Modules\Externas\Models;

use App\Models\User;
use App\Modules\Config\Models\Equipment;
use App\Modules\VipGallery\Models\VipGalleryBanner;
use App\Modules\VipGallery\Models\VipGalleryPhoto;
use App\Support\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;

class ExternalEvent extends Model
{
    use Auditable;

    public const VIP_GALLERY_STATUS_DRAFT = 'draft';

    public const VIP_GALLERY_STATUS_ACTIVE = 'active';

    public const VIP_GALLERY_STATUS_PAUSED = 'paused';

    public const VIP_GALLERY_STATUS_ARCHIVED = 'archived';

    protected $table = 'external_events';

    protected $fillable = [
        'titulo',
        'category_id',
        'status_id',
        'briefing',
        'data_hora',
        'data_hora_fim',
        'local',
        'endereco_completo',
        'contato_nome',
        'contato_whatsapp',
        'observacao_interna',
        'is_vip_gallery',
        'vip_gallery_status',
        'whatsapp_group_id',
        'gallery_slug',
        'custom_logo_path',
        'logo_size_percent',
        'allow_delete_command',
        'delete_command_keyword',
    ];

    protected $casts = [
        'data_hora' => 'datetime',
        'data_hora_fim' => 'datetime',
        'is_vip_gallery' => 'boolean',
        'logo_size_percent' => 'integer',
        'views_count' => 'integer',
        'allow_delete_command' => 'boolean',
    ];

    // ── Relationships ────────────────────────────

    public function category()
    {
        return $this->belongsTo(EventCategory::class, 'category_id');
    }

    public function status()
    {
        return $this->belongsTo(EventStatus::class, 'status_id');
    }

    public function collaborators()
    {
        return $this->belongsToMany(User::class, 'event_collaborators', 'event_id', 'user_id')
            ->withPivot('funcao')
            ->withTimestamps();
    }

    public function equipment()
    {
        return $this->belongsToMany(Equipment::class, 'event_equipment', 'event_id', 'equipment_id')
            ->withPivot('checked')
            ->withTimestamps();
    }

    public function activityLogs()
    {
        return $this->hasMany(EventActivityLog::class, 'event_id')->orderBy('created_at', 'desc');
    }

    public function vipGalleryPhotos()
    {
        return $this->hasMany(VipGalleryPhoto::class, 'external_event_id');
    }

    public function vipGalleryBanners()
    {
        return $this->hasMany(VipGalleryBanner::class, 'external_event_id');
    }

    public function isVipGalleryActive(): bool
    {
        return $this->is_vip_gallery && $this->vip_gallery_status === self::VIP_GALLERY_STATUS_ACTIVE;
    }

    public static function vipGalleryStatuses(): array
    {
        return [
            self::VIP_GALLERY_STATUS_DRAFT,
            self::VIP_GALLERY_STATUS_ACTIVE,
            self::VIP_GALLERY_STATUS_PAUSED,
            self::VIP_GALLERY_STATUS_ARCHIVED,
        ];
    }

    public static function getAuditModule(): string
    {
        return 'externas';
    }

    public function getAuditResourceName(): string
    {
        return $this->titulo;
    }
}
