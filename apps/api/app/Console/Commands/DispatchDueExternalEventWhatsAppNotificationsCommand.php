<?php

namespace App\Console\Commands;

use App\Modules\Externas\Services\ExternalEventWhatsAppNotificationService;
use Illuminate\Console\Command;

class DispatchDueExternalEventWhatsAppNotificationsCommand extends Command
{
    protected $signature = 'externas:dispatch-due-whatsapp-reminders {--limit=}';

    protected $description = 'Dispara notificacoes WhatsApp de Externas devidas ate o minuto atual';

    public function handle(ExternalEventWhatsAppNotificationService $service): int
    {
        $limit = $this->option('limit');
        $dispatched = $service->dispatchDue(limit: is_numeric($limit) ? (int) $limit : null);

        $this->info(sprintf('Notificacoes despachadas: %d', $dispatched));

        return self::SUCCESS;
    }
}
