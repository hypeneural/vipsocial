<?php

namespace App\Modules\WhatsApp\Exceptions;

use RuntimeException;
use Throwable;

class WhatsAppProviderException extends RuntimeException
{
    public function __construct(
        string $message = 'Falha ao comunicar com o provedor de WhatsApp',
        private readonly int $status = 500,
        private readonly array $responseBody = [],
        ?Throwable $previous = null
    ) {
        parent::__construct($message, 0, $previous);
    }

    public function status(): int
    {
        return $this->status;
    }

    public function responseBody(): array
    {
        return $this->responseBody;
    }
}
