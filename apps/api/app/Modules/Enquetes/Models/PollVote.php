<?php

namespace App\Modules\Enquetes\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PollVote extends Model
{
    use HasUlids;

    public const STATUS_VALID = 'valid';
    public const STATUS_INVALIDATED = 'invalidated';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'poll_votes';

    protected $fillable = [
        'poll_id',
        'option_id',
        'poll_placement_id',
        'poll_session_id',
        'vote_attempt_id',
        'status',
        'ip_hash',
        'fingerprint_hash',
        'external_user_hash',
        'accepted_at',
        'invalidated_at',
        'invalidated_reason',
        'geo_snapshot',
        'device_snapshot',
    ];

    protected $casts = [
        'accepted_at' => 'datetime',
        'invalidated_at' => 'datetime',
        'geo_snapshot' => 'array',
        'device_snapshot' => 'array',
    ];

    public function poll(): BelongsTo
    {
        return $this->belongsTo(Poll::class);
    }

    public function option(): BelongsTo
    {
        return $this->belongsTo(PollOption::class, 'option_id');
    }

    public function placement(): BelongsTo
    {
        return $this->belongsTo(PollPlacement::class, 'poll_placement_id');
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(PollSession::class, 'poll_session_id');
    }

    public function voteAttempt(): BelongsTo
    {
        return $this->belongsTo(PollVoteAttempt::class, 'vote_attempt_id');
    }

    public function scopeValid($query)
    {
        return $query->where('status', self::STATUS_VALID);
    }
}
