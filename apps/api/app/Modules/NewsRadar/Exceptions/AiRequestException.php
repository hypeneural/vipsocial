<?php

namespace App\Modules\NewsRadar\Exceptions;

use OpenAI\Exceptions\ErrorException as OpenAiErrorException;
use OpenAI\Exceptions\TransporterException as OpenAiTransporterException;
use RuntimeException;
use Throwable;

class AiRequestException extends RuntimeException
{
    public function __construct(
        public readonly string $stage,
        public readonly string $model,
        string $message,
        public readonly array $context = [],
        public readonly string $category = 'unknown',
        public readonly bool $fallbackable = true,
        public readonly bool $queueRetryable = false,
        public readonly ?int $statusCode = null,
        public readonly ?string $strategy = null,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, previous: $previous);
    }

    public static function fromThrowable(
        string $stage,
        string $model,
        Throwable $throwable,
        array $context = [],
    ): self {
        $statusCode = null;
        $providerErrorCode = null;
        $providerErrorType = null;
        $rawErrorBody = null;
        $responseHeaders = null;

        if ($throwable instanceof OpenAiErrorException) {
            $statusCode = $throwable->getStatusCode();
            $providerErrorCode = self::normalizeScalar($throwable->getErrorCode());
            $providerErrorType = $throwable->getErrorType();
            $responseHeaders = $throwable->response->getHeaders();
            $rawErrorBody = self::extractResponseBody($throwable);
        }

        [$category, $fallbackable, $queueRetryable] = self::resolveHandling(
            message: $throwable->getMessage(),
            statusCode: $statusCode,
            throwable: $throwable,
        );

        $baseContext = array_filter([
            'exception_class' => $throwable::class,
            'exception_code' => self::normalizeScalar($throwable->getCode()),
            'provider_status' => $statusCode,
            'provider_error_code' => $providerErrorCode,
            'provider_error_type' => $providerErrorType,
            'raw_error_body' => $rawErrorBody,
            'raw_error_payload' => self::decodeJsonBody($rawErrorBody),
            'raw_error_excerpt' => $rawErrorBody !== null ? mb_substr($rawErrorBody, 0, 1500) : null,
            'response_headers' => self::normalizeHeaders($responseHeaders),
        ], static fn (mixed $value): bool => $value !== null && $value !== []);

        return new self(
            stage: $stage,
            model: $model,
            message: self::normalizeMessage($throwable->getMessage()),
            context: array_filter(
                array_merge($baseContext, $context),
                static fn (mixed $value): bool => $value !== null && $value !== ''
            ),
            category: $category,
            fallbackable: $fallbackable,
            queueRetryable: $queueRetryable,
            statusCode: $statusCode,
            strategy: is_string($context['strategy'] ?? null) ? $context['strategy'] : null,
            previous: $throwable,
        );
    }

    /**
     * @return array{string, bool, bool}
     */
    private static function resolveHandling(
        string $message,
        ?int $statusCode,
        Throwable $throwable,
    ): array {
        $normalizedMessage = mb_strtolower(self::normalizeMessage($message));

        if ($throwable instanceof OpenAiTransporterException) {
            return ['transport', true, true];
        }

        if (str_contains($normalizedMessage, 'resposta vazia')) {
            return ['empty_response', true, false];
        }

        if (str_contains($normalizedMessage, 'json invalida') || str_contains($normalizedMessage, 'json valida')) {
            return ['invalid_json', true, false];
        }

        if (str_contains($normalizedMessage, 'schema') && str_contains($normalizedMessage, 'compativel')) {
            return ['invalid_response_shape', true, false];
        }

        if ($statusCode === 401 || $statusCode === 403) {
            return ['auth', false, false];
        }

        if ($statusCode === 429) {
            return ['rate_limited', true, true];
        }

        if ($statusCode !== null && $statusCode >= 500) {
            return ['provider_unavailable', true, true];
        }

        if ($statusCode === 400 || $statusCode === 404) {
            if (
                str_contains($normalizedMessage, 'requested parameters')
                || str_contains($normalizedMessage, 'provider routing')
                || str_contains($normalizedMessage, 'reasoning is mandatory')
                || str_contains($normalizedMessage, 'structured output')
                || str_contains($normalizedMessage, 'response_format')
            ) {
                return ['unsupported_parameters', true, false];
            }

            if (
                str_contains($normalizedMessage, 'no endpoints available')
                || str_contains($normalizedMessage, 'guardrail restrictions')
                || str_contains($normalizedMessage, 'data policy')
            ) {
                return ['model_unavailable', true, true];
            }
        }

        if ($statusCode === 400) {
            return ['request_invalid', false, false];
        }

        if (str_contains($normalizedMessage, 'timed out') || str_contains($normalizedMessage, 'timeout')) {
            return ['timeout', true, true];
        }

        return ['unknown', true, true];
    }

    private static function extractResponseBody(OpenAiErrorException $throwable): ?string
    {
        $body = $throwable->response->getBody();

        if ($body->isSeekable()) {
            $body->rewind();
        }

        $contents = trim((string) $body);

        if ($body->isSeekable()) {
            $body->rewind();
        }

        return $contents !== '' ? $contents : null;
    }

    private static function normalizeHeaders(?array $headers): ?array
    {
        if (! is_array($headers) || $headers === []) {
            return null;
        }

        $normalized = [];
        foreach ($headers as $name => $values) {
            $normalized[$name] = is_array($values) ? implode(', ', $values) : (string) $values;
        }

        return $normalized;
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

    private static function decodeJsonBody(?string $body): mixed
    {
        if (! is_string($body) || trim($body) === '') {
            return null;
        }

        $decoded = json_decode($body, true);

        return json_last_error() === JSON_ERROR_NONE ? $decoded : null;
    }
}
