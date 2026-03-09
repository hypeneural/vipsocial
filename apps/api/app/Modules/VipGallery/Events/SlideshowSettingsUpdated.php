<?php

namespace App\Modules\VipGallery\Events;

class SlideshowSettingsUpdated extends AbstractSlideshowBroadcastEvent
{
    public function broadcastAs(): string
    {
        return 'slideshow.settings-updated';
    }
}
