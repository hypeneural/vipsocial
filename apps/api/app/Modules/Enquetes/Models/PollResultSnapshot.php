<?php

namespace App\Modules\Enquetes\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PollResultSnapshot extends Model
{
    protected $table = 'poll_result_snapshots';

    protected $fillable = [
        'poll_id',
        'bucket_type',
        'bucket_at',
        'impressions',
        'unique_sessions',
        'votes_accepted',
        'votes_blocked',
        'conversion_rate',
        'payload',
    ];

    protected $casts = [
        'bucket_at' => 'datetime',
        'impressions' => 'integer',
        'unique_sessions' => 'integer',
        'votes_accepted' => 'integer',
        'votes_blocked' => 'integer',
        'conversion_rate' => 'decimal:4',
        'payload' => 'array',
    ];

    public function poll(): BelongsTo
    {
        return $this->belongsTo(Poll::class);
    }
}
