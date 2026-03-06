<?php

namespace App\Modules\WhatsApp\Jobs;

use App\Modules\WhatsApp\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendWhatsAppLinkJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public function __construct(
        public readonly string $phone,
        public readonly string $message,
        public readonly string $image,
        public readonly string $linkUrl,
        public readonly string $title,
        public readonly string $linkDescription,
        public readonly string $linkType = 'LARGE'
    ) {
    }

    public function handle(WhatsAppService $service): void
    {
        $service->sendLink(
            phone: $this->phone,
            message: $this->message,
            image: $this->image,
            linkUrl: $this->linkUrl,
            title: $this->title,
            linkDescription: $this->linkDescription,
            linkType: $this->linkType
        );
    }
}
