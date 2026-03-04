<?php

namespace App\Support\Exceptions;

use Exception;

class ConflictException extends Exception
{
    public function render($request)
    {
        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => $this->getMessage() ?: 'Conflito de estado',
                'code' => 'CONFLICT',
            ], 409);
        }
    }
}
