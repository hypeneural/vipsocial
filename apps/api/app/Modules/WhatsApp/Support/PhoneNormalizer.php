<?php

namespace App\Modules\WhatsApp\Support;

use InvalidArgumentException;

class PhoneNormalizer
{
    public function normalize(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', trim($phone)) ?? '';

        if ($digits === '') {
            throw new InvalidArgumentException('Telefone invalido: valor vazio');
        }

        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }

        if ($digits === '') {
            throw new InvalidArgumentException('Telefone invalido: sem digitos');
        }

        if (str_starts_with($digits, '0')) {
            $digits = ltrim($digits, '0');
        }

        $defaultCountryCode = preg_replace('/\D+/', '', (string) config('whatsapp.default_country_code', '55')) ?? '55';
        if (!str_starts_with($digits, $defaultCountryCode) && in_array(strlen($digits), [10, 11], true)) {
            $digits = $defaultCountryCode . $digits;
        }

        if (!preg_match('/^\d{12,15}$/', $digits)) {
            throw new InvalidArgumentException('Telefone invalido: formato esperado DDI+DDD+numero');
        }

        return $digits;
    }
}
