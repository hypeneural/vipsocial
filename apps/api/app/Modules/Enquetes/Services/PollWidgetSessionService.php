<?php

namespace App\Modules\Enquetes\Services;

use App\Modules\Enquetes\Models\PollPlacement;
use App\Modules\Enquetes\Models\PollSession;
use App\Modules\Enquetes\Support\VoteContextResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PollWidgetSessionService
{
    public function __construct(private readonly VoteContextResolver $contextResolver)
    {
    }

    public function start(PollPlacement $placement, array $payload, Request $request): array
    {
        $rawToken = (string) ($payload['session_token'] ?? '');
        $sessionToken = $rawToken !== '' ? $rawToken : Str::random(64);
        $context = $this->contextResolver->resolve($request, $payload);
        $sessionTokenHash = $this->contextResolver->hashValue($sessionToken);

        $session = PollSession::query()->firstOrNew([
            'session_token_hash' => $sessionTokenHash,
        ]);

        $session->poll_id = $placement->poll_id;
        $session->poll_placement_id = $placement->id;
        $session->fingerprint_hash = $context['fingerprint_hash'];
        $session->external_user_hash = $context['external_user_hash'];
        $session->ip_hash = $context['ip_hash'];
        $session->user_agent_hash = $context['user_agent_hash'];
        $session->referrer_url = $context['referrer_url'];
        $session->referrer_domain = $context['referrer_domain'];
        $session->origin_domain = $context['origin_domain'];
        $session->first_seen_at ??= now();
        $session->last_seen_at = now();
        $session->meta = $payload['meta'] ?? $session->meta ?? [];
        $session->save();

        return $this->serialize($session->fresh(), $sessionToken);
    }

    public function findByToken(?string $sessionToken): ?PollSession
    {
        $token = trim((string) $sessionToken);

        if ($token === '') {
            return null;
        }

        return PollSession::query()
            ->where('session_token_hash', $this->contextResolver->hashValue($token))
            ->first();
    }

    public function serialize(PollSession $session, string $sessionToken): array
    {
        return [
            'id' => $session->id,
            'poll_id' => $session->poll_id,
            'poll_placement_id' => $session->poll_placement_id,
            'session_token' => $sessionToken,
            'first_seen_at' => optional($session->first_seen_at)?->toIso8601String(),
            'last_seen_at' => optional($session->last_seen_at)?->toIso8601String(),
        ];
    }
}
