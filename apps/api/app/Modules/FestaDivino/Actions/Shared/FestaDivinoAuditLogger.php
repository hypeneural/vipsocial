<?php

namespace App\Modules\FestaDivino\Actions\Shared;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class FestaDivinoAuditLogger
{
    public function log(
        Request $request,
        string $action,
        string $entityType,
        string|int|null $entityId,
        ?array $oldValues,
        ?array $newValues,
    ): void {
        DB::table('festa_divino_audit_logs')->insert([
            'user_id' => $request->user()?->id,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId === null ? null : (string) $entityId,
            'old_values' => $oldValues === null ? null : json_encode($oldValues),
            'new_values' => $newValues === null ? null : json_encode($newValues),
            'remote_connection' => config('festa-divino.write_connection', 'festa_divino_write'),
            'request_id' => $request->attributes->get('request_id'),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);
    }
}
