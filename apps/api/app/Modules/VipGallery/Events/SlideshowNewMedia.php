<?php

namespace App\Modules\VipGallery\Events;

class SlideshowNewMedia extends AbstractSlideshowBroadcastEvent
{
    public function broadcastAs(): string
    {
        return 'slideshow.new-media';
    }
}
