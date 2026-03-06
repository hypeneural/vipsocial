<?php

namespace App\Modules\WhatsApp\Clients;

use App\Modules\WhatsApp\Exceptions\WhatsAppProviderException;

class NullWhatsAppClient implements WhatsAppProviderInterface
{
    public function get(string $endpoint, array $query = []): array
    {
        throw new WhatsAppProviderException(
            message: 'Z-API nao configurada no ambiente',
            status: 503,
            responseBody: [
                'endpoint' => $endpoint,
                'query' => $query,
            ]
        );
    }

    public function post(string $endpoint, array $payload = []): array
    {
        throw new WhatsAppProviderException(
            message: 'Z-API nao configurada no ambiente',
            status: 503,
            responseBody: [
                'endpoint' => $endpoint,
                'payload' => $payload,
            ]
        );
    }
}
