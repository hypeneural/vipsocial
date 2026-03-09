<?php

namespace App\Modules\VipGallery\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

abstract class AbstractSlideshowBroadcastEvent implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public string $slideshowCode;

    public array $payload;

    public function __construct(
        string $slideshowCode,
        array $payload
    ) {
        $this->slideshowCode = $slideshowCode;
        $this->payload = $payload;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel("slideshow.{$this->slideshowCode}"),
        ];
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }

}
