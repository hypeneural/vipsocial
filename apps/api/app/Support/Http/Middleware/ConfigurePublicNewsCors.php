<?php

namespace App\Support\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ConfigurePublicNewsCors
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('api/v1/public/news/*/markdown')) {
            config([
                'cors.allowed_origins' => ['*'],
                'cors.allowed_origins_patterns' => [],
                'cors.allowed_methods' => ['GET', 'HEAD', 'OPTIONS'],
                'cors.allowed_headers' => ['*'],
                'cors.exposed_headers' => [
                    'Content-Type',
                    'Cache-Control',
                    'ETag',
                    'Last-Modified',
                    'X-Request-Id',
                    'X-Trace-Id',
                ],
                'cors.max_age' => 86400,
                'cors.supports_credentials' => false,
            ]);
        }

        return $next($request);
    }
}
