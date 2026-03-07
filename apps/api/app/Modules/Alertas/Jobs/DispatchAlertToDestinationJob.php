<?php

namespace App\Modules\Alertas\Jobs;

use App\Modules\Alertas\Services\AlertDispatchService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DispatchAlertToDestinationJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $dispatchRunId,
        public readonly int $destinationId
    ) {
    }

    public function handle(AlertDispatchService $dispatchService): void
    {
        $dispatchService->dispatchRunToDestination($this->dispatchRunId, $this->destinationId);
    }
}
