<?php

namespace App\Modules\VipGallery\Events;

class SlideshowMediaDeleted extends AbstractSlideshowBroadcastEvent
{
    public function broadcastAs(): string
    {
        return 'slideshow.media-deleted';
    }
}
