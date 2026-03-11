<?php

namespace App\Modules\NewsRadar\Console;

use App\Modules\NewsRadar\Jobs\FetchNewsSourceJob;
use App\Modules\NewsRadar\Models\NewsSource;
use Illuminate\Console\Command;

class DispatchNewsSourcesCommand extends Command
{
    protected $signature = 'news-radar:dispatch-sources
                            {--source= : Specific source ID to dispatch}
                            {--force : Ignore next_sync_at and dispatch immediately}';

    protected $description = 'Dispatch FetchNewsSourceJob for sources due for sync';

    public function handle(): int
    {
        $sourceId = $this->option('source');
        $force = $this->option('force');

        if ($sourceId) {
            $source = NewsSource::find($sourceId);
            if (!$source) {
                $this->error("Source #{$sourceId} not found.");
                return 1;
            }

            if (!$source->active) {
                $this->warn("Source #{$sourceId} is not active.");
                return 1;
            }

            FetchNewsSourceJob::dispatch($source->id);
            $this->info("Dispatched job for source #{$source->id} ({$source->name})");
            return 0;
        }

        // Get all sources due for sync
        $query = NewsSource::active()->healthy();

        if (!$force) {
            $query->dueForSync();
        }

        $sources = $query->get();

        if ($sources->isEmpty()) {
            $this->info('No sources due for sync.');
            return 0;
        }

        $dispatched = 0;
        foreach ($sources as $source) {
            if ($source->isLocked()) {
                $this->line("  ⏳ Skipped #{$source->id} ({$source->name}) — locked");
                continue;
            }

            FetchNewsSourceJob::dispatch($source->id);
            $this->line("  ✅ Dispatched #{$source->id} ({$source->name})");
            $dispatched++;
        }

        $this->info("Dispatched {$dispatched} source jobs.");
        return 0;
    }
}
