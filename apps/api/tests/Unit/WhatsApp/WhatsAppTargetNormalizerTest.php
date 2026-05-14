<?php

namespace Tests\Unit\WhatsApp;

use App\Modules\WhatsApp\Support\PhoneNormalizer;
use App\Modules\WhatsApp\Support\WhatsAppTargetNormalizer;
use Tests\TestCase;

class WhatsAppTargetNormalizerTest extends TestCase
{
    public function test_preserves_legacy_group_id_target(): void
    {
        $normalizer = new WhatsAppTargetNormalizer(new PhoneNormalizer);

        $result = $normalizer->normalizeWithKind('554896318744-1499088823');

        $this->assertSame('554896318744-1499088823', $result['target_value']);
        $this->assertSame(WhatsAppTargetNormalizer::KIND_GROUP, $result['target_kind']);
    }

    public function test_preserves_new_group_id_target(): void
    {
        $normalizer = new WhatsAppTargetNormalizer(new PhoneNormalizer);

        $result = $normalizer->normalizeWithKind('120363027326371817-group');

        $this->assertSame('120363027326371817-group', $result['target_value']);
        $this->assertSame(WhatsAppTargetNormalizer::KIND_GROUP, $result['target_kind']);
    }

    public function test_normalizes_phone_target(): void
    {
        config(['whatsapp.default_country_code' => '55']);

        $normalizer = new WhatsAppTargetNormalizer(new PhoneNormalizer);

        $result = $normalizer->normalizeWithKind('(48) 99631-8744');

        $this->assertSame('5548996318744', $result['target_value']);
        $this->assertSame(WhatsAppTargetNormalizer::KIND_PHONE, $result['target_kind']);
    }
}
