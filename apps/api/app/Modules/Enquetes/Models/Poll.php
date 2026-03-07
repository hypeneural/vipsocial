<?php

namespace App\Modules\Enquetes\Models;

use App\Modules\Enquetes\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Poll extends Model
{
    use HasPublicId;
    use SoftDeletes;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_LIVE = 'live';
    public const STATUS_PAUSED = 'paused';
    public const STATUS_CLOSED = 'closed';
    public const STATUS_ARCHIVED = 'archived';

    public const SELECTION_SINGLE = 'single';
    public const SELECTION_MULTIPLE = 'multiple';

    public const LIMIT_ONCE_EVER = 'once_ever';
    public const LIMIT_ONCE_PER_DAY = 'once_per_day';
    public const LIMIT_ONCE_PER_WINDOW = 'once_per_window';

    public const RESULTS_LIVE = 'live';
    public const RESULTS_AFTER_VOTE = 'after_vote';
    public const RESULTS_AFTER_END = 'after_end';
    public const RESULTS_NEVER = 'never';

    public const END_HIDE_WIDGET = 'hide_widget';
    public const END_SHOW_CLOSED_MESSAGE = 'show_closed_message';
    public const END_SHOW_RESULTS_ONLY = 'show_results_only';

    protected $table = 'polls';

    protected $fillable = [
        'public_id',
        'title',
        'question',
        'slug',
        'status',
        'selection_type',
        'max_choices',
        'vote_limit_mode',
        'vote_cooldown_minutes',
        'results_visibility',
        'after_end_behavior',
        'starts_at',
        'ends_at',
        'timezone',
        'settings',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'max_choices' => 'integer',
        'vote_cooldown_minutes' => 'integer',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'settings' => 'array',
        'created_by' => 'integer',
        'updated_by' => 'integer',
        'deleted_at' => 'datetime',
    ];

    public function options(): HasMany
    {
        return $this->hasMany(PollOption::class)->orderBy('sort_order');
    }

    public function placements(): HasMany
    {
        return $this->hasMany(PollPlacement::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(PollSession::class);
    }

    public function voteAttempts(): HasMany
    {
        return $this->hasMany(PollVoteAttempt::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(PollVote::class);
    }

    public function voteLocks(): HasMany
    {
        return $this->hasMany(PollVoteLock::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(PollEvent::class);
    }

    public function resultSnapshots(): HasMany
    {
        return $this->hasMany(PollResultSnapshot::class);
    }

    public function scopeVisible($query)
    {
        return $query->where('status', '!=', self::STATUS_ARCHIVED);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', [self::STATUS_SCHEDULED, self::STATUS_LIVE, self::STATUS_PAUSED]);
    }

    public function scopeLive($query)
    {
        return $query->where('status', self::STATUS_LIVE);
    }
}
