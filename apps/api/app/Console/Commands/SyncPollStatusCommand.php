<?php

namespace App\Console\Commands;

use App\Modules\Enquetes\Models\Poll;
use App\Modules\Enquetes\Support\PollStateResolver;
use Illuminate\Console\Command;

class SyncPollStatusCommand extends Command
{
    protected $signature = 'enquetes:sync-status';

    protected $description = 'Sincroniza o status persistido das enquetes com base na janela de agendamento';

    public function handle(PollStateResolver $resolver): int
    {
        $synced = 0;

        Poll::query()
            ->orderBy('id')
            ->chunkById(100, function ($polls) use (&$synced, $resolver): void {
                foreach ($polls as $poll) {
                    $before = $poll->status;
                    $after = $resolver->syncPersistedStatus($poll)->status;

                    if ($before !== $after) {
                        $synced++;
                    }
                }
            });

        $this->info("Enquetes sincronizadas: {$synced}");

        return self::SUCCESS;
    }
}
