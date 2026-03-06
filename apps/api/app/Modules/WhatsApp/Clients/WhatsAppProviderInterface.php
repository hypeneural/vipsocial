<?php

namespace App\Modules\WhatsApp\Clients;

interface WhatsAppProviderInterface
{
    public function get(string $endpoint, array $query = []): array;

    public function post(string $endpoint, array $payload = []): array;
}
