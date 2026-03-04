<?php

namespace App\Support\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

abstract class BaseController extends Controller
{
    protected function jsonSuccess(mixed $data = null, string $message = '', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
        ], $status);
    }

    protected function jsonCreated(mixed $data = null, string $message = 'Recurso criado com sucesso'): JsonResponse
    {
        return $this->jsonSuccess($data, $message, 201);
    }

    protected function jsonDeleted(string $message = 'Recurso removido com sucesso'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => null,
            'message' => $message,
        ], 200);
    }

    protected function jsonPaginated($paginator, ?string $resourceClass = null): JsonResponse
    {
        $data = $resourceClass
            ? $resourceClass::collection($paginator)
            : $paginator->items();

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ]);
    }

    protected function jsonError(string $message, string $code = 'INTERNAL_SERVER_ERROR', int $status = 500, array $errors = []): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
            'code' => $code,
        ];

        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        if ($traceId = request()->attributes->get('request_id')) {
            $response['trace_id'] = $traceId;
        }

        return response()->json($response, $status);
    }
}
