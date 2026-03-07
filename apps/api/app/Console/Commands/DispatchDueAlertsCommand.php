<?php

namespace App\Console\Commands;

use App\Modules\Alertas\Services\AlertDispatchService;
use Illuminate\Console\Command;

class DispatchDueAlertsCommand extends Command
{
    protected $signature = 'alertas:dispatch-due';

    protected $description = 'Dispara alertas de WhatsApp devidos no minuto atual';

    public function handle(AlertDispatchService $dispatchService): int
    {
        $createdRuns = $dispatchService->dispatchDue();

        $this->info(sprintf('Execucoes criadas: %d', $createdRuns));

        return self::SUCCESS;
    }
}
