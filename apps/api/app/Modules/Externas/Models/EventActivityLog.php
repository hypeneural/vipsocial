<?php

namespace App\Modules\Externas\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class EventActivityLog extends Model
{
    protected $table = 'event_activity_logs';

    protected $fillable = [
        'event_id',
        'user_id',
        'action',
        'description',
        'changes',
    ];

    protected $casts = [
        'changes' => 'array',
    ];

    public function event()
    {
        return $this->belongsTo(ExternalEvent::class, 'event_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ── Factory methods ──────────────────────

    public static function log(int $eventId, string $action, string $description, ?array $changes = null, ?int $userId = null): self
    {
        return static::create([
            'event_id' => $eventId,
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'description' => $description,
            'changes' => $changes,
        ]);
    }
}
