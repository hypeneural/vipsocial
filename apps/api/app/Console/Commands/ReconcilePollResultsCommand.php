<?php

namespace App\Console\Commands;

use App\Modules\Enquetes\Services\PollResultService;
use Illuminate\Console\Command;

class ReconcilePollResultsCommand extends Command
{
    protected $signature = 'enquetes:reconcile-results';

    protected $description = 'Reconcilia snapshots e agregados de resultados das enquetes';

    public function handle(PollResultService $service): int
    {
        $reconciled = $service->reconcileAll();

        $this->info("Enquetes reconciliadas: {$reconciled}");

        return self::SUCCESS;
    }
}
