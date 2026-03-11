<?php

namespace App\Modules\NewsRadar\Exceptions;

use RuntimeException;
use Throwable;

class AiRequestException extends RuntimeException
{
    public function __construct(
        public readonly string $stage,
        public readonly string $model,
        string $message,
        public readonly array $context = [],
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, previous: $previous);
    }

    public static function fromThrowable(string $stage, string $model, Throwable $throwable, array $context = []): self
    {
        $baseContext = [
            'exception_class' => $throwable::class,
            'exception_code' => self::normalizeScalar($throwable->getCode()),
        ];

        return new self(
            stage: $stage,
            model: $model,
            message: self::normalizeMessage($throwable->getMessage()),
            context: array_filter(
                array_merge($baseContext, $context),
                static fn (mixed $value): bool => $value !== null && $value !== ''
            ),
            previous: $throwable,
        );
    }

    private static function normalizeMessage(string $message): string
    {
        $normalized = preg_replace('/\s+/u', ' ', trim($message)) ?? trim($message);

        return $normalized !== '' ? $normalized : 'Falha desconhecida ao chamar a IA.';
    }

    private static function normalizeScalar(mixed $value): int|string|null
    {
        if (is_int($value) || is_string($value)) {
            return $value;
        }

        if (is_float($value)) {
            return (string) $value;
        }

        return null;
    }
}
