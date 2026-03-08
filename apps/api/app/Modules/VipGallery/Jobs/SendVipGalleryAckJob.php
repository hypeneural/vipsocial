<?php

namespace App\Modules\VipGallery\Jobs;

use App\Modules\WhatsApp\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendVipGalleryAckJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public array $backoff = [10, 30, 60];

    public function __construct(
        public readonly string $phone
    ) {}

    public function handle(WhatsAppService $service): void
    {
        $message = trim((string) config('vip_gallery.ack.message', 'Publicada!'));

        if ($message === '') {
            return;
        }

        $service->sendText($this->phone, $message);
    }
}
