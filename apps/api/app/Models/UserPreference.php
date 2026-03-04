<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPreference extends Model
{
    protected $primaryKey = 'user_id';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'theme',
        'language',
        'notifications_email',
        'notifications_push',
        'notifications_whatsapp',
        'sidebar_collapsed',
        'dashboard_widgets',
    ];

    protected function casts(): array
    {
        return [
            'notifications_email' => 'boolean',
            'notifications_push' => 'boolean',
            'notifications_whatsapp' => 'boolean',
            'sidebar_collapsed' => 'boolean',
            'dashboard_widgets' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
