<?php

namespace App\Support\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class IdempotencyKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $idempotencyKey = $request->header('Idempotency-Key');

        if (!$idempotencyKey) {
            return $next($request);
        }

        $cacheKey = 'idempotency:' . $idempotencyKey;
        $cached = Cache::get($cacheKey);

        if ($cached) {
            return response()->json(
                array_merge($cached['body'], ['code' => 'IDEMPOTENCY_REPLAY']),
                $cached['status']
            );
        }

        $response = $next($request);

        if ($response->isSuccessful() || $response->isClientError()) {
            Cache::put($cacheKey, [
                'body' => json_decode($response->getContent(), true),
                'status' => $response->getStatusCode(),
            ], now()->addHours(24));
        }

        return $response;
    }
}
