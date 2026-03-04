<?php

namespace App\Support\Exceptions;

use Exception;

class BusinessException extends Exception
{
    protected string $errorCode;

    public function __construct(string $message, string $errorCode = 'BUSINESS_ERROR', int $httpCode = 422)
    {
        parent::__construct($message, $httpCode);
        $this->errorCode = $errorCode;
    }

    public function render($request)
    {
        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => $this->getMessage(),
                'code' => $this->errorCode,
            ], $this->getCode());
        }
    }
}
