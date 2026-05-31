<?php

namespace App\Modules\FestaDivino\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FaqItem extends FestaDivinoModel
{
    protected $table = 'faq_item';

    protected $primaryKey = 'id';

    protected $fillable = [
        'category_id',
        'question',
        'answer',
        'display_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'category_id' => 'integer',
            'display_order' => 'integer',
            'is_active' => 'boolean',
            'created_at' => 'datetime:Y-m-d\TH:i:s\Z',
            'updated_at' => 'datetime:Y-m-d\TH:i:s\Z',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(FaqCategory::class, 'category_id', 'id');
    }
}
