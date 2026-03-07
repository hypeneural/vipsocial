<?php

namespace App\Modules\Enquetes\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PollEvent extends Model
{
    use HasUlids;

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $table = 'poll_events';

    protected $fillable = [
        'poll_id',
        'poll_placement_id',
        'poll_session_id',
        'event_type',
        'option_id',
        'meta',
        'created_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'created_at' => 'datetime',
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

    public function option(): BelongsTo
    {
        return $this->belongsTo(PollOption::class, 'option_id');
    }
}
