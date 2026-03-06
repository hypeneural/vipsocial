<?php

namespace App\Console\Commands;

use App\Modules\WhatsApp\Services\GroupSnapshotService;
use Illuminate\Console\Command;

class CaptureWhatsAppGroupsOverviewDailySnapshotCommand extends Command
{
    protected $signature = 'whatsapp:groups-snapshot-daily';

    protected $description = 'Captura o snapshot diario agregado dos grupos WhatsApp monitorados';

    public function handle(GroupSnapshotService $snapshotService): int
    {
        $snapshot = $snapshotService->captureOverviewDailySnapshot();

        $this->info('Snapshot diario capturado com sucesso.');
        $this->line('Data: ' . $snapshot['snapshot_date']);
        $this->line('Grupos: ' . $snapshot['groups_count']);
        $this->line('Memberships: ' . $snapshot['total_memberships_current']);
        $this->line('Unicos: ' . $snapshot['unique_members_current']);

        return self::SUCCESS;
    }
}
