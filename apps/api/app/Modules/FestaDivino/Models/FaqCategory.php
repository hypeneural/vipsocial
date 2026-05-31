<?php

namespace App\Modules\FestaDivino\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class FaqCategory extends FestaDivinoModel
{
    protected $table = 'faq_category';

    protected $primaryKey = 'id';

    protected $fillable = [
        'name',
        'icon',
        'display_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'display_order' => 'integer',
            'is_active' => 'boolean',
            'created_at' => 'datetime:Y-m-d\TH:i:s\Z',
            'updated_at' => 'datetime:Y-m-d\TH:i:s\Z',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(FaqItem::class, 'category_id', 'id')
            ->orderBy('display_order');
    }
}
