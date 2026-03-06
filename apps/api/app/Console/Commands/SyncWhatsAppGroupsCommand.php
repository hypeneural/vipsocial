<?php

namespace App\Console\Commands;

use App\Modules\WhatsApp\Jobs\SyncGroupMetadataJob;
use App\Modules\WhatsApp\Models\WhatsAppGroup;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class SyncWhatsAppGroupsCommand extends Command
{
    protected $signature = 'whatsapp:groups-sync
        {--group=* : Lista de group_id para sincronizacao manual}
        {--force : Ignora guard rails de consistencia}';

    protected $description = 'Sincroniza metadados de grupos WhatsApp monitorados e gera eventos de membership';

    public function handle(): int
    {
        $force = (bool) $this->option('force');
        $batchId = 'wpp_sync_' . str_replace('-', '', (string) Str::ulid());
        $providedGroups = collect((array) $this->option('group'))
            ->map(fn($group) => trim((string) $group))
            ->filter(fn($group) => $group !== '')
            ->unique()
            ->values();

        if ($providedGroups->isNotEmpty()) {
            $this->dispatchGroups($providedGroups->all(), $batchId, $force);

            return self::SUCCESS;
        }

        $activeGroups = WhatsAppGroup::query()
            ->active()
            ->orderBy('group_id')
            ->pluck('group_id')
            ->all();

        if (empty($activeGroups)) {
            $fallbackGroups = $this->configuredFallbackGroups();
            if (!empty($fallbackGroups)) {
                $this->warn('Nenhum grupo ativo encontrado no banco. Usando WHATSAPP_GROUP_IDS como fallback.');
                $activeGroups = $fallbackGroups;
            }
        }

        if (empty($activeGroups)) {
            $this->warn('Nenhum grupo para sincronizar.');

            return self::SUCCESS;
        }

        $this->dispatchGroups($activeGroups, $batchId, $force);

        return self::SUCCESS;
    }

    /**
     * @param array<int, string> $groups
     */
    private function dispatchGroups(array $groups, string $batchId, bool $force): void
    {
        $this->info("Iniciando sync de " . count($groups) . " grupo(s). Batch: {$batchId}");

        foreach ($groups as $groupId) {
            SyncGroupMetadataJob::dispatch($groupId, $batchId, $force)->onQueue('whatsapp');
            $this->line(" - enfileirado: {$groupId}");
        }

        $this->info('Sincronizacao enfileirada com sucesso.');
    }

    /**
     * @return array<int, string>
     */
    private function configuredFallbackGroups(): array
    {
        $groups = config('whatsapp.sync.groups', []);
        if (!is_array($groups)) {
            return [];
        }

        return collect($groups)
            ->map(fn($group) => trim((string) $group))
            ->filter(fn($group) => $group !== '')
            ->unique()
            ->values()
            ->all();
    }
}
