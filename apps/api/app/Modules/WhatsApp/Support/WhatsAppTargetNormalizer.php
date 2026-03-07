<?php

namespace App\Modules\WhatsApp\Support;

use InvalidArgumentException;

class WhatsAppTargetNormalizer
{
    public const KIND_PHONE = 'whatsapp_phone';
    public const KIND_GROUP = 'whatsapp_group';

    public function __construct(private readonly PhoneNormalizer $phoneNormalizer)
    {
    }

    public function normalize(string $target): string
    {
        $trimmed = trim($target);

        if ($trimmed === '') {
            throw new InvalidArgumentException('Destino WhatsApp invalido: valor vazio');
        }

        if ($this->isGroupTarget($trimmed)) {
            return $trimmed;
        }

        return $this->phoneNormalizer->normalize($trimmed);
    }

    public function detectKind(string $target): string
    {
        return $this->isGroupTarget(trim($target))
            ? self::KIND_GROUP
            : self::KIND_PHONE;
    }

    public function normalizeWithKind(string $target): array
    {
        $normalized = $this->normalize($target);

        return [
            'target_value' => $normalized,
            'target_kind' => $this->detectKind($normalized),
        ];
    }

    private function isGroupTarget(string $target): bool
    {
        if ($target === '') {
            return false;
        }

        return preg_match('/^\d+-group$/', $target) === 1
            || preg_match('/^\d+-\d+$/', $target) === 1;
    }
}
