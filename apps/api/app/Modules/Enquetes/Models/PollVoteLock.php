<?php

namespace App\Modules\Enquetes\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PollVoteLock extends Model
{
    protected $table = 'poll_vote_locks';

    protected $fillable = [
        'poll_id',
        'lock_scope',
        'lock_key',
        'vote_id',
        'locked_until',
    ];

    protected $casts = [
        'locked_until' => 'datetime',
    ];

    public function poll(): BelongsTo
    {
        return $this->belongsTo(Poll::class);
    }

    public function vote(): BelongsTo
    {
        return $this->belongsTo(PollVote::class, 'vote_id');
    }
}
