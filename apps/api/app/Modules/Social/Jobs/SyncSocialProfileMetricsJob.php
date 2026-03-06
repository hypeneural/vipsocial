<?php

namespace App\Modules\Social\Jobs;

use App\Modules\Social\Services\SocialSyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncSocialProfileMetricsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;
    public int $timeout = 180;

    public function __construct(
        public readonly string $profileId
    ) {
    }

    public function handle(SocialSyncService $syncService): void
    {
        $syncService->syncProfileById($this->profileId);
    }
}
