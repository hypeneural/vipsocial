<?php

namespace Tests\Unit\WhatsApp;

use App\Modules\WhatsApp\Support\PhoneNormalizer;
use InvalidArgumentException;
use Tests\TestCase;

class PhoneNormalizerTest extends TestCase
{
    public function test_normalize_removes_mask_and_adds_default_country_code(): void
    {
        config(['whatsapp.default_country_code' => '55']);

        $normalizer = new PhoneNormalizer();

        $result = $normalizer->normalize('(11) 99999-8888');

        $this->assertSame('5511999998888', $result);
    }

    public function test_normalize_keeps_phone_with_country_code(): void
    {
        config(['whatsapp.default_country_code' => '55']);

        $normalizer = new PhoneNormalizer();

        $result = $normalizer->normalize('+55 (11) 99999-8888');

        $this->assertSame('5511999998888', $result);
    }

    public function test_normalize_throws_for_invalid_phone(): void
    {
        $normalizer = new PhoneNormalizer();

        $this->expectException(InvalidArgumentException::class);
        $normalizer->normalize('abc');
    }
}
