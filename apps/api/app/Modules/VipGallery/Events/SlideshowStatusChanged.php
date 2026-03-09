<?php

namespace App\Modules\VipGallery\Events;

class SlideshowStatusChanged extends AbstractSlideshowBroadcastEvent
{
    public function broadcastAs(): string
    {
        return 'slideshow.status-changed';
    }
}
