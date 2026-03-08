<?php

namespace App\Modules\VipGallery\Jobs;

use App\Modules\Externas\Models\EventActivityLog;
use App\Modules\Externas\Models\ExternalEvent;
use App\Modules\VipGallery\Models\VipGalleryWebhookLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class PauseVipGalleryEventJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(
        public readonly int $logId,
        public readonly int $eventId
    ) {
    }

    public function handle(): void
    {
        $log = VipGalleryWebhookLog::query()->find($this->logId);
        $event = ExternalEvent::query()->find($this->eventId);

        if (! $log || ! $event) {
            return;
        }

        if ($event->vip_gallery_status !== ExternalEvent::VIP_GALLERY_STATUS_ACTIVE) {
            $log->update([
                'routing_status' => 'ignored_pause_not_active',
                'error_message' => 'A galeria nao estava ativa no momento do comando de pausa',
            ]);

            return;
        }

        try {
            $event->forceFill([
                'vip_gallery_status' => ExternalEvent::VIP_GALLERY_STATUS_PAUSED,
            ])->save();

            EventActivityLog::log(
                $event->id,
                'vip_gallery_paused',
                'Galeria VIP pausada por comando do WhatsApp',
                [
                    'Status da galeria VIP' => [
                        'de' => ExternalEvent::VIP_GALLERY_STATUS_ACTIVE,
                        'para' => ExternalEvent::VIP_GALLERY_STATUS_PAUSED,
                    ],
                ]
            );

            $log->update([
                'routing_status' => 'paused',
                'error_message' => null,
            ]);
        } catch (Throwable $e) {
            $log->update([
                'routing_status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function failed(Throwable $e): void
    {
        $log = VipGalleryWebhookLog::query()->find($this->logId);

        if (! $log) {
            return;
        }

        $log->update([
            'routing_status' => 'failed',
            'error_message' => $e->getMessage(),
        ]);
    }
}
