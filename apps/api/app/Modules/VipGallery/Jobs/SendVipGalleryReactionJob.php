<?php

namespace App\Modules\VipGallery\Jobs;

use App\Modules\WhatsApp\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class SendVipGalleryReactionJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 2;

    public array $backoff = [5, 15];

    public function __construct(
        public readonly string $phone,
        public readonly string $messageId,
        public readonly string $reaction
    ) {}

    public function handle(WhatsAppService $service): void
    {
        if (! (bool) config('vip_gallery.reactions.enabled', true)) {
            return;
        }

        $service->sendReaction($this->phone, $this->messageId, $this->reaction);
    }

    public function failed(Throwable $e): void
    {
        // Fire-and-forget: reaction failures should not block the pipeline.
        report($e);
    }
}
