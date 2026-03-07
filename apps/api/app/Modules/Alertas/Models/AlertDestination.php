<?php

namespace App\Modules\Alertas\Models;

use App\Modules\WhatsApp\Models\WhatsAppGroup;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AlertDestination extends Model
{
    public const KIND_PHONE = 'whatsapp_phone';
    public const KIND_GROUP = 'whatsapp_group';

    protected $table = 'alert_destinations';

    protected $fillable = [
        'name',
        'target_kind',
        'target_value',
        'tags',
        'active',
        'archived_at',
        'last_sent_at',
        'created_by',
        'updated_by',
        'whatsapp_group_fk',
    ];

    protected $casts = [
        'tags' => 'array',
        'active' => 'boolean',
        'archived_at' => 'datetime',
        'last_sent_at' => 'datetime',
    ];

    public function alerts(): BelongsToMany
    {
        return $this->belongsToMany(
            Alert::class,
            'alert_destination_links',
            'destination_id',
            'alert_id'
        )->withTimestamps();
    }

    public function whatsappGroup(): BelongsTo
    {
        return $this->belongsTo(WhatsAppGroup::class, 'whatsapp_group_fk');
    }

    public function dispatchLogs(): HasMany
    {
        return $this->hasMany(AlertDispatchLog::class, 'destination_id');
    }

    public function scopeNotArchived($query)
    {
        return $query->whereNull('archived_at');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true)->whereNull('archived_at');
    }
}
