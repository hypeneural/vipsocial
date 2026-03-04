<?php

namespace App\Support\Exceptions;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Throwable;

class ApiExceptionHandler extends ExceptionHandler
{
    protected function shouldReturnJson($request, Throwable $e): bool
    {
        return $request->is('api/*') || $request->expectsJson();
    }

    protected function prepareJsonResponse($request, Throwable $e): JsonResponse
    {
        $traceId = $request->attributes?->get('request_id', '');

        return match (true) {
            $e instanceof ValidationException => response()->json([
                'success' => false,
                'message' => 'Erro de validação',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
            ], 422),

            $e instanceof AuthenticationException => response()->json([
                'success' => false,
                'message' => 'Não autenticado',
                'code' => 'UNAUTHENTICATED',
            ], 401),

            $e instanceof AuthorizationException => response()->json([
                'success' => false,
                'message' => 'Sem permissão para esta ação',
                'code' => 'FORBIDDEN',
            ], 403),

            $e instanceof ModelNotFoundException,
            $e instanceof NotFoundHttpException => response()->json([
                'success' => false,
                'message' => 'Recurso não encontrado',
                'code' => 'RESOURCE_NOT_FOUND',
            ], 404),

            $e instanceof TooManyRequestsHttpException => response()->json([
                'success' => false,
                'message' => 'Limite de requisições excedido',
                'code' => 'RATE_LIMITED',
            ], 429),

            default => response()->json([
                'success' => false,
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor',
                'code' => 'INTERNAL_SERVER_ERROR',
                'trace_id' => $traceId,
            ], 500),
        };
    }
}
