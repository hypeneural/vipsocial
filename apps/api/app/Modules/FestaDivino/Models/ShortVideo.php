<?php

namespace App\Modules\FestaDivino\Models;

class ShortVideo extends FestaDivinoModel
{
    protected $table = 'shorts_videos';

    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'title',
        'thumb_url',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime:Y-m-d\TH:i:s\Z',
            'updated_at' => 'datetime:Y-m-d\TH:i:s\Z',
        ];
    }
}
