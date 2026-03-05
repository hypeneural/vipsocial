<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use App\Support\Http\Middleware\InjectRequestContext;
use App\Support\Http\Middleware\IdempotencyKey;

return Application::configure(basePath: dirname(__DIR__))
    ->withProviders([
        App\Providers\ModuleServiceProvider::class,
    ])
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
            InjectRequestContext::class,
        ]);

        // Prevent API auth middleware from trying to resolve a missing named route('login').
        $middleware->redirectGuestsTo(function (Request $request): ?string {
            if ($request->is('api/*') || $request->expectsJson()) {
                return null;
            }

            return '/auth/login';
        });

        $middleware->alias([
            'idempotent' => IdempotencyKey::class,
        ]);

        // Note: statefulApi() removed — we use Bearer token auth, not cookie/session.
        // statefulApi() adds CSRF verification which causes 419 errors when SPA + API
        // share the same domain.
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->renderable(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erro de validação',
                    'code' => 'VALIDATION_ERROR',
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        $exceptions->renderable(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Não autenticado',
                    'code' => 'UNAUTHENTICATED',
                ], 401);
            }
        });

        $exceptions->renderable(function (\Illuminate\Auth\Access\AuthorizationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sem permissão para esta ação',
                    'code' => 'FORBIDDEN',
                ], 403);
            }
        });

        $exceptions->renderable(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Recurso não encontrado',
                    'code' => 'RESOURCE_NOT_FOUND',
                ], 404);
            }
        });

        $exceptions->renderable(function (\Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Limite de requisições excedido',
                    'code' => 'RATE_LIMITED',
                ], 429);
            }
        });
    })->create();
