<?php

namespace App\Modules\WhatsApp\Jobs;

use App\Modules\WhatsApp\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendWhatsAppTextJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public function __construct(
        public readonly string $phone,
        public readonly string $message,
        public readonly array $options = []
    ) {
    }

    public function handle(WhatsAppService $service): void
    {
        $service->sendText($this->phone, $this->message, $this->options);
    }
}
