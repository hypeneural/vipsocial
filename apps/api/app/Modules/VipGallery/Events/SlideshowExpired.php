<?php

namespace App\Modules\VipGallery\Events;

class SlideshowExpired extends AbstractSlideshowBroadcastEvent
{
    public function broadcastAs(): string
    {
        return 'slideshow.event-expired';
    }
}
