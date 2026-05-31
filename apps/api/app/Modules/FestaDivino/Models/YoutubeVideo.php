<?php

namespace App\Modules\FestaDivino\Models;

class YoutubeVideo extends FestaDivinoModel
{
    protected $table = 'youtube_videos';

    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $incrementing = false;

    public const CREATED_AT = 'create_at';

    public const UPDATED_AT = 'update_at';

    protected $fillable = [
        'id',
        'title',
        'description',
        'thumb_url',
    ];

    protected function casts(): array
    {
        return [
            'create_at' => 'datetime:Y-m-d\TH:i:s\Z',
            'update_at' => 'datetime:Y-m-d\TH:i:s\Z',
        ];
    }
}
