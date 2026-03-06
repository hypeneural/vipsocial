<?php

namespace App\Modules\WhatsApp\Jobs;

use App\Modules\WhatsApp\Services\GroupSyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncGroupMetadataJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;

    public function __construct(
        public readonly string $groupId,
        public readonly string $syncBatchId,
        public readonly bool $force = false
    ) {
    }

    public function handle(GroupSyncService $syncService): void
    {
        $syncService->syncGroupById(
            groupId: $this->groupId,
            syncBatchId: $this->syncBatchId,
            force: $this->force
        );
    }
}
