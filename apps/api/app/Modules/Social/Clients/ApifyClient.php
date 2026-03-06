<?php

namespace App\Modules\Social\Clients;

use App\Modules\Social\Exceptions\ApifyProviderException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;

class ApifyClient implements ApifyClientInterface
{
    public function me(): array
    {
        return $this->wrappedGet('/users/me');
    }

    public function runTask(string $taskId, array $input = [], array $query = []): array
    {
        $response = $this->http()
            ->post($this->pathWithQuery("/actor-tasks/{$taskId}/runs", $query), $input);

        return $this->wrappedResponse($response);
    }

    public function getRun(string $runId, array $query = []): array
    {
        return $this->wrappedGet("/actor-runs/{$runId}", $query);
    }

    public function getRunDatasetItems(string $runId, array $query = []): array
    {
        $response = $this->http()
            ->get($this->pathWithQuery("/actor-runs/{$runId}/dataset/items", $query));

        return $this->rawResponse($response);
    }

    public function getTask(string $taskId): array
    {
        return $this->wrappedGet("/actor-tasks/{$taskId}");
    }

    public function getTaskInput(string $taskId): array
    {
        $response = $this->http()->get("/actor-tasks/{$taskId}/input");

        return $this->rawResponse($response);
    }

    public function updateTaskInput(string $taskId, array $input): array
    {
        $response = $this->http()->put("/actor-tasks/{$taskId}/input", $input);

        return $this->rawResponse($response);
    }

    private function http(): PendingRequest
    {
        $token = (string) config('social.apify.token', '');
        $timeout = max(1, (int) config('social.apify.timeout', 30));
        $retryTimes = max(0, (int) config('social.apify.retry_times', 3));
        $retrySleepMs = max(1, (int) config('social.apify.retry_sleep_ms', 1000));

        return Http::baseUrl((string) config('social.apify.base_url', 'https://api.apify.com/v2'))
            ->withToken($token)
            ->acceptJson()
            ->asJson()
            ->timeout($timeout)
            ->retry($retryTimes, $retrySleepMs, function ($exception): bool {
                if (!$exception instanceof RequestException) {
                    return false;
                }

                $status = $exception->response?->status();

                return in_array($status, [408, 409, 425, 429, 500, 502, 503, 504], true);
            }, throw: false);
    }

    private function wrappedGet(string $path, array $query = []): array
    {
        $response = $this->http()->get($this->pathWithQuery($path, $query));

        return $this->wrappedResponse($response);
    }

    private function wrappedResponse($response): array
    {
        $json = $this->rawResponse($response);

        return isset($json['data']) && is_array($json['data'])
            ? $json['data']
            : $json;
    }

    private function rawResponse($response): array
    {
        if ($response->successful()) {
            $json = $response->json();

            return is_array($json) ? $json : [];
        }

        throw new ApifyProviderException(
            message: 'Apify request failed',
            status: $response->status(),
            responseBody: is_array($response->json()) ? $response->json() : ['raw' => $response->body()]
        );
    }

    private function pathWithQuery(string $path, array $query = []): string
    {
        $normalizedQuery = array_filter($query, fn($value) => $value !== null);
        if ($normalizedQuery === []) {
            return $path;
        }

        return $path . '?' . Arr::query($normalizedQuery);
    }
}
