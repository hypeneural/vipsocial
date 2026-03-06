<?php

namespace App\Modules\Social\Clients;

interface ApifyClientInterface
{
    public function me(): array;

    public function runTask(string $taskId, array $input = [], array $query = []): array;

    public function getRun(string $runId, array $query = []): array;

    public function getRunDatasetItems(string $runId, array $query = []): array;

    public function getTask(string $taskId): array;

    public function getTaskInput(string $taskId): array;

    public function updateTaskInput(string $taskId, array $input): array;
}
