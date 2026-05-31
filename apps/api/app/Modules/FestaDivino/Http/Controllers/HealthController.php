<?php

namespace App\Modules\FestaDivino\Http\Controllers;

use App\Modules\FestaDivino\Http\Controllers\Concerns\AuthorizesFestaDivino;
use App\Support\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class HealthController extends BaseController
{
    use AuthorizesFestaDivino;

    public function __invoke(Request $request): JsonResponse
    {
        $this->authorizeFestaDivino($request, 'festa-divino.health');

        $readConnection = config('festa-divino.read_connection', 'festa_divino_read');
        $read = $this->checkConnection($readConnection);
        $tables = $this->checkTables($readConnection);

        $missingRequired = collect($tables)
            ->reject(fn (array $table, string $name) => $name === 'fotos')
            ->contains(fn (array $table) => $table['exists'] === false);

        return $this->jsonSuccess([
            'status' => $read['ok'] && ! $missingRequired ? 'ok' : 'degraded',
            'mode' => config('festa-divino.write_enabled') ? 'write_enabled' : 'read_only',
            'connections' => [
                'read' => $read,
            ],
            'tables' => $tables,
        ]);
    }

    private function checkConnection(string $connection): array
    {
        $startedAt = microtime(true);

        try {
            $database = DB::connection($connection);
            $driver = $database->getDriverName();
            $version = $driver === 'sqlite'
                ? $database->selectOne('select sqlite_version() as version')->version
                : $database->selectOne('select version() as version')->version;

            return [
                'ok' => true,
                'driver' => $driver,
                'version' => $version,
                'latency_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            ];
        } catch (\Throwable $exception) {
            return [
                'ok' => false,
                'driver' => config("database.connections.$connection.driver"),
                'version' => null,
                'latency_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                'error' => $exception->getMessage(),
            ];
        }
    }

    private function checkTables(string $connection): array
    {
        $tables = [];

        foreach (config('festa-divino.expected_tables', []) as $table) {
            $exists = false;
            $count = null;

            try {
                $exists = Schema::connection($connection)->hasTable($table);
                $count = $exists ? DB::connection($connection)->table($table)->count() : null;
            } catch (\Throwable) {
                $exists = false;
            }

            $tables[$table] = [
                'exists' => $exists,
                'count' => $count,
            ];
        }

        return $tables;
    }
}
