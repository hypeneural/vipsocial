<?php

namespace App\Modules\Enquetes\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PollSite extends Model
{
    protected $table = 'poll_sites';

    protected $fillable = [
        'name',
        'public_key',
        'secret_key_hash',
        'is_active',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'array',
    ];

    public function domains(): HasMany
    {
        return $this->hasMany(PollSiteDomain::class);
    }

    public function placements(): HasMany
    {
        return $this->hasMany(PollPlacement::class);
    }
}
