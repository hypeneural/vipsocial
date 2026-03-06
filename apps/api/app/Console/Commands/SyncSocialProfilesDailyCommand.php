<?php

namespace App\Console\Commands;

use App\Modules\Social\Jobs\SyncSocialProfileMetricsJob;
use App\Modules\Social\Models\SocialProfile;
use Illuminate\Console\Command;

class SyncSocialProfilesDailyCommand extends Command
{
    protected $signature = 'social:sync-daily
        {--profile=* : Lista de IDs de perfis para sincronizacao manual}';

    protected $description = 'Sincroniza os KPIs diarios dos perfis sociais monitorados via Apify';

    public function handle(): int
    {
        $providedProfiles = collect((array) $this->option('profile'))
            ->map(fn($profileId) => trim((string) $profileId))
            ->filter(fn($profileId) => $profileId !== '')
            ->unique()
            ->values();

        $profileIds = $providedProfiles->isNotEmpty()
            ? $providedProfiles->all()
            : SocialProfile::query()
                ->active()
                ->orderBy('sort_order')
                ->orderBy('network')
                ->orderBy('handle')
                ->pluck('id')
                ->all();

        if (empty($profileIds)) {
            $this->warn('Nenhum perfil social para sincronizar.');

            return self::SUCCESS;
        }

        $queue = (string) config('social.queue', 'default');
        $this->info('Enfileirando sync de ' . count($profileIds) . ' perfil(is) sociais.');

        foreach ($profileIds as $profileId) {
            SyncSocialProfileMetricsJob::dispatch($profileId)->onQueue($queue);
            $this->line(" - enfileirado: {$profileId}");
        }

        $this->info('Sincronizacao social enfileirada com sucesso.');

        return self::SUCCESS;
    }
}
