<?php

namespace App\Modules\WhatsAppInbound\Support;

use Illuminate\Http\Request;

class InboundWebhookRequestNormalizer
{
    public static function payload(Request $request): array
    {
        $payload = $request->json()->all();

        if (is_array($payload) && $payload !== []) {
            return $payload;
        }

        $decoded = json_decode((string) $request->getContent(), true);

        if (is_array($decoded)) {
            return $decoded;
        }

        return [
            '_raw' => (string) $request->getContent(),
        ];
    }

    public static function headers(Request $request, array $maskedHeaders = []): array
    {
        $headers = collect($request->headers->all())
            ->map(fn (array $values) => count($values) === 1 ? ($values[0] ?? null) : array_values($values))
            ->all();

        foreach ($maskedHeaders as $headerName) {
            foreach (array_keys($headers) as $key) {
                if (strcasecmp($key, $headerName) === 0) {
                    $headers[$key] = '[REDACTED]';
                }
            }
        }

        return $headers;
    }
}
