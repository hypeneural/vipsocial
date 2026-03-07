<?php

namespace App\Modules\Enquetes\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PollSession extends Model
{
    use HasUlids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'poll_sessions';

    protected $fillable = [
        'poll_id',
        'poll_placement_id',
        'session_token_hash',
        'fingerprint_hash',
        'external_user_hash',
        'ip_hash',
        'user_agent_hash',
        'referrer_url',
        'referrer_domain',
        'origin_domain',
        'first_seen_at',
        'last_seen_at',
        'meta',
    ];

    protected $casts = [
        'first_seen_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'meta' => 'array',
    ];

    public function poll(): BelongsTo
    {
        return $this->belongsTo(Poll::class);
    }

    public function placement(): BelongsTo
    {
        return $this->belongsTo(PollPlacement::class, 'poll_placement_id');
    }

    public function voteAttempts(): HasMany
    {
        return $this->hasMany(PollVoteAttempt::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(PollVote::class);
    }
}
