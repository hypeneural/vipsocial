<?php

namespace App\Modules\Externas\Jobs;

use App\Modules\Externas\Services\ExternalEventWhatsAppNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendExternalEventWhatsAppNotificationJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public function __construct(public readonly string $notificationId) {}

    public function handle(ExternalEventWhatsAppNotificationService $service): void
    {
        $service->sendNotification($this->notificationId);
    }
}
