<?php

namespace App\Modules\Enquetes\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PollVoteAttempt extends Model
{
    use HasUlids;

    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_BLOCKED = 'blocked';
    public const STATUS_INVALID = 'invalid';
    public const STATUS_ERROR = 'error';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'poll_vote_attempts';

    protected $fillable = [
        'poll_id',
        'poll_placement_id',
        'poll_session_id',
        'status',
        'block_reason',
        'risk_score',
        'ip_hash',
        'fingerprint_hash',
        'external_user_hash',
        'user_agent',
        'browser_family',
        'os_family',
        'device_type',
        'country',
        'region',
        'city',
        'asn',
        'provider',
        'meta',
    ];

    protected $casts = [
        'risk_score' => 'decimal:2',
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

    public function session(): BelongsTo
    {
        return $this->belongsTo(PollSession::class, 'poll_session_id');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(PollVote::class, 'vote_attempt_id');
    }
}
