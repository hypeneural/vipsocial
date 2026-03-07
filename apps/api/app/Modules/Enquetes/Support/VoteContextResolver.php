<?php

namespace App\Modules\Enquetes\Support;

use Illuminate\Http\Request;

class VoteContextResolver
{
    public function resolve(Request $request, array $payload = []): array
    {
        $ip = $this->resolveIp($request);
        $userAgent = trim((string) $request->userAgent());
        $origin = trim((string) $request->headers->get('Origin', ''));
        $referrer = trim((string) $request->headers->get('Referer', ''));

        return [
            'ip' => $ip,
            'ip_hash' => $this->hashValue($ip),
            'user_agent' => $userAgent !== '' ? $userAgent : null,
            'user_agent_hash' => $this->hashValue($userAgent),
            'origin' => $origin !== '' ? $origin : null,
            'origin_domain' => $this->extractDomain($origin),
            'referrer_url' => $referrer !== '' ? $referrer : null,
            'referrer_domain' => $this->extractDomain($referrer),
            'fingerprint_hash' => $this->hashValue((string) ($payload['fingerprint'] ?? '')),
            'external_user_hash' => $this->hashValue((string) ($payload['external_user_id'] ?? '')),
        ];
    }

    public function hashValue(?string $value): ?string
    {
        $normalized = trim((string) $value);

        if ($normalized === '') {
            return null;
        }

        return hash_hmac('sha256', $normalized, $this->secret());
    }

    private function resolveIp(Request $request): string
    {
        $ip = $request->ip();

        if (is_string($ip) && $ip !== '') {
            return $ip;
        }

        return $request->server('REMOTE_ADDR', '0.0.0.0');
    }

    private function extractDomain(?string $url): ?string
    {
        $value = trim((string) $url);

        if ($value === '') {
            return null;
        }

        $host = parse_url($value, PHP_URL_HOST);

        return is_string($host) && $host !== '' ? mb_strtolower($host) : null;
    }

    private function secret(): string
    {
        $key = (string) config('app.key', '');

        return $key !== '' ? $key : 'enquetes-secret-fallback';
    }
}
