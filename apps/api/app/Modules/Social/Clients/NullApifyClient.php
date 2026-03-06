<?php

namespace App\Modules\Social\Clients;

use App\Modules\Social\Exceptions\ApifyProviderException;

class NullApifyClient implements ApifyClientInterface
{
    public function me(): array
    {
        throw new ApifyProviderException(
            message: 'Apify nao configurado no ambiente',
            status: 503
        );
    }

    public function runTask(string $taskId, array $input = [], array $query = []): array
    {
        throw new ApifyProviderException(
            message: 'Apify nao configurado no ambiente',
            status: 503,
            responseBody: [
                'task_id' => $taskId,
                'input' => $input,
                'query' => $query,
            ]
        );
    }

    public function getRun(string $runId, array $query = []): array
    {
        throw new ApifyProviderException(
            message: 'Apify nao configurado no ambiente',
            status: 503,
            responseBody: [
                'run_id' => $runId,
                'query' => $query,
            ]
        );
    }

    public function getRunDatasetItems(string $runId, array $query = []): array
    {
        throw new ApifyProviderException(
            message: 'Apify nao configurado no ambiente',
            status: 503,
            responseBody: [
                'run_id' => $runId,
                'query' => $query,
            ]
        );
    }

    public function getTask(string $taskId): array
    {
        throw new ApifyProviderException(
            message: 'Apify nao configurado no ambiente',
            status: 503,
            responseBody: [
                'task_id' => $taskId,
            ]
        );
    }

    public function getTaskInput(string $taskId): array
    {
        throw new ApifyProviderException(
            message: 'Apify nao configurado no ambiente',
            status: 503,
            responseBody: [
                'task_id' => $taskId,
            ]
        );
    }

    public function updateTaskInput(string $taskId, array $input): array
    {
        throw new ApifyProviderException(
            message: 'Apify nao configurado no ambiente',
            status: 503,
            responseBody: [
                'task_id' => $taskId,
                'input' => $input,
            ]
        );
    }
}
