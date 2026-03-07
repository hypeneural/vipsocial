<?php

namespace App\Modules\Enquetes\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PollSiteDomain extends Model
{
    protected $table = 'poll_site_domains';

    protected $fillable = [
        'poll_site_id',
        'domain_pattern',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(PollSite::class, 'poll_site_id');
    }
}
