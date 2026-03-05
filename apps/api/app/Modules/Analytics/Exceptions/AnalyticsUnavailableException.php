<?php

namespace App\Modules\Analytics\Exceptions;

use RuntimeException;
use Throwable;

class AnalyticsUnavailableException extends RuntimeException
{
    public function __construct(string $message = 'Analytics temporariamente indisponivel', ?Throwable $previous = null)
    {
        parent::__construct($message, 0, $previous);
    }
}

