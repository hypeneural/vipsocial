<?php

namespace App\Modules\WhatsApp\Jobs;

use App\Modules\WhatsApp\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendWhatsAppImageJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public function __construct(
        public readonly string $phone,
        public readonly string $image,
        public readonly ?string $caption = null,
        public readonly array $options = []
    ) {
    }

    public function handle(WhatsAppService $service): void
    {
        $service->sendImage($this->phone, $this->image, $this->caption, $this->options);
    }
}
