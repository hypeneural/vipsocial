<?php

namespace App\Modules\WhatsApp\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class WhatsAppGroupsOverviewDailySnapshot extends Model
{
    use HasUlids;

    protected $table = 'whatsapp_groups_overview_daily_snapshots';

    protected $fillable = [
        'snapshot_date',
        'groups_count',
        'total_memberships_current',
        'unique_members_current',
        'multi_group_members_current',
        'multi_group_ratio',
        'captured_at',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'multi_group_ratio' => 'float',
        'captured_at' => 'datetime',
    ];
}
