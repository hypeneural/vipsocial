<?php

namespace App\Modules\UserAiPrompts\Models;

use App\Models\User;
use App\Modules\UserAiPrompts\Enums\PromptProviderTarget;
use App\Support\Traits\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserAiPromptTemplate extends Model
{
    use SoftDeletes, Auditable;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'content',
        'provider_target',
        'is_favorite',
        'sort_order',
        'usage_count',
        'last_used_at',
    ];

    protected $casts = [
        'provider_target' => PromptProviderTarget::class,
        'is_favorite' => 'boolean',
        'sort_order' => 'integer',
        'usage_count' => 'integer',
        'last_used_at' => 'datetime:Y-m-d\TH:i:s\Z',
        'created_at' => 'datetime:Y-m-d\TH:i:s\Z',
        'updated_at' => 'datetime:Y-m-d\TH:i:s\Z',
        'deleted_at' => 'datetime:Y-m-d\TH:i:s\Z',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeOwnedBy(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query
            ->orderByDesc('is_favorite')
            ->orderBy('sort_order')
            ->orderBy('name');
    }

    public static function getAuditModule(): string
    {
        return 'ai_prompts';
    }

    public function getAuditResourceName(): string
    {
        return $this->name;
    }
}
