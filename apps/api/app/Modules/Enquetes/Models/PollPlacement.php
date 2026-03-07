<?php

namespace App\Modules\Enquetes\Models;

use App\Modules\Enquetes\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PollPlacement extends Model
{
    use HasPublicId;

    protected $table = 'poll_placements';

    protected $fillable = [
        'poll_id',
        'poll_site_id',
        'public_id',
        'placement_name',
        'article_external_id',
        'article_title',
        'canonical_url',
        'page_path',
        'embed_token_hash',
        'is_active',
        'last_seen_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_seen_at' => 'datetime',
    ];

    public function poll(): BelongsTo
    {
        return $this->belongsTo(Poll::class);
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(PollSite::class, 'poll_site_id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(PollSession::class);
    }
}
