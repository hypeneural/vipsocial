<?php

namespace App\Modules\WhatsApp\Clients;

use App\Modules\WhatsApp\Exceptions\WhatsAppProviderException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Throwable;

class ZApiClient implements WhatsAppProviderInterface
{
    public function get(string $endpoint, array $query = []): array
    {
        try {
            $response = $this->http()->get($this->normalizeEndpoint($endpoint), $query);
        } catch (ConnectionException $e) {
            throw new WhatsAppProviderException(
                message: 'Nao foi possivel conectar na Z-API',
                status: 503,
                responseBody: ['error' => $e->getMessage()],
                previous: $e
            );
        }

        return $this->parseResponse($response);
    }

    public function post(string $endpoint, array $payload = []): array
    {
        try {
            $response = $this->http()->post($this->normalizeEndpoint($endpoint), $payload);
        } catch (ConnectionException $e) {
            throw new WhatsAppProviderException(
                message: 'Nao foi possivel conectar na Z-API',
                status: 503,
                responseBody: ['error' => $e->getMessage()],
                previous: $e
            );
        }

        return $this->parseResponse($response);
    }

    private function http(): PendingRequest
    {
        $retryTimes = max(0, (int) config('whatsapp.zapi.retry_times', 3));
        $retrySleepMs = max(0, (int) config('whatsapp.zapi.retry_sleep_ms', 300));
        $timeoutSec = max(1, (int) config('whatsapp.zapi.timeout', 30));

        return Http::baseUrl($this->baseUrl())
            ->acceptJson()
            ->asJson()
            ->withHeaders([
                'Client-Token' => (string) config('whatsapp.zapi.client_token', ''),
            ])
            ->timeout($timeoutSec)
            ->retry(
                $retryTimes,
                $retrySleepMs,
                function (Throwable $exception, PendingRequest $request): bool {
                    if ($exception instanceof ConnectionException) {
                        return true;
                    }

                    if ($exception instanceof RequestException) {
                        $status = $exception->response?->status();

                        return in_array($status, [408, 409, 425, 429, 500, 502, 503, 504], true);
                    }

                    return false;
                },
                throw: false
            );
    }

    private function parseResponse(Response $response): array
    {
        if ($response->successful()) {
            return $response->json() ?? ['raw' => $response->body()];
        }

        throw new WhatsAppProviderException(
            message: 'Falha na requisicao para Z-API',
            status: $response->status(),
            responseBody: $response->json() ?? ['raw' => $response->body()]
        );
    }

    private function baseUrl(): string
    {
        $baseUrl = rtrim((string) config('whatsapp.zapi.base_url', ''), '/');
        $instance = trim((string) config('whatsapp.zapi.instance', ''));
        $token = trim((string) config('whatsapp.zapi.token', ''));

        return "{$baseUrl}/instances/{$instance}/token/{$token}/";
    }

    private function normalizeEndpoint(string $endpoint): string
    {
        return ltrim($endpoint, '/');
    }
}
