<?php

namespace App\Modules\VipGallery\Events;

class SlideshowMediaUpdated extends AbstractSlideshowBroadcastEvent
{
    public function broadcastAs(): string
    {
        return 'slideshow.media-updated';
    }
}
