<?php

namespace App\Modules\NewsRadar\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class NewsCluster extends Model
{
    protected $fillable = [
        'label',
    ];

    public function items(): BelongsToMany
    {
        return $this->belongsToMany(NewsItem::class, 'news_cluster_items')
            ->withPivot('similarity_score');
    }
}
