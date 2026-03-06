<?php

namespace Tests\Unit\Analytics;

use App\Modules\Analytics\Support\TrafficSourceNormalizer;
use PHPUnit\Framework\TestCase;

class TrafficSourceNormalizerTest extends TestCase
{
    private function makeNormalizer(): TrafficSourceNormalizer
    {
        /** @var array{rules?: array<int, array<string, mixed>>} $config */
        $config = require __DIR__ . '/../../../config/analytics_sources.php';

        return new TrafficSourceNormalizer($config['rules'] ?? []);
    }

    public function test_tvvip_social_maps_to_whatsapp(): void
    {
        $normalizer = $this->makeNormalizer();

        $result = $normalizer->normalize(
            channelRaw: 'Organic Social',
            sourceRaw: 'tvvip.social',
            mediumRaw: 'referral',
            sourceMediumRaw: 'tvvip.social / referral'
        );

        $this->assertSame('WhatsApp', $result['source_normalized']);
        $this->assertSame('Messaging', $result['group']);
    }

    public function test_lm_facebook_maps_to_facebook(): void
    {
        $normalizer = $this->makeNormalizer();

        $result = $normalizer->normalize(
            channelRaw: 'Organic Social',
            sourceRaw: 'lm.facebook.com',
            mediumRaw: 'referral',
            sourceMediumRaw: 'lm.facebook.com / referral'
        );

        $this->assertSame('Facebook', $result['source_normalized']);
        $this->assertSame('Social', $result['group']);
    }

    public function test_ig_maps_to_instagram(): void
    {
        $normalizer = $this->makeNormalizer();

        $result = $normalizer->normalize(
            channelRaw: 'Organic Social',
            sourceRaw: 'ig',
            mediumRaw: 'social',
            sourceMediumRaw: 'ig / social'
        );

        $this->assertSame('Instagram', $result['source_normalized']);
    }

    public function test_google_maps_to_google(): void
    {
        $normalizer = $this->makeNormalizer();

        $result = $normalizer->normalize(
            channelRaw: 'Organic Search',
            sourceRaw: 'google',
            mediumRaw: 'organic',
            sourceMediumRaw: 'google / organic'
        );

        $this->assertSame('Google', $result['source_normalized']);
    }

    public function test_direct_none_maps_to_direct(): void
    {
        $normalizer = $this->makeNormalizer();

        $result = $normalizer->normalize(
            channelRaw: 'Direct',
            sourceRaw: '(direct)',
            mediumRaw: '(none)',
            sourceMediumRaw: '(direct) / (none)'
        );

        $this->assertSame('Direct', $result['source_normalized']);
        $this->assertSame('Direct', $result['group']);
    }

    public function test_tco_maps_to_x_twitter(): void
    {
        $normalizer = $this->makeNormalizer();

        $result = $normalizer->normalize(
            channelRaw: 'Organic Social',
            sourceRaw: 'https://t.co/abc123',
            mediumRaw: 'social',
            sourceMediumRaw: 't.co / social'
        );

        $this->assertSame('X/Twitter', $result['source_normalized']);
        $this->assertSame('Social', $result['group']);
    }

    public function test_manual_source_has_precedence_over_session_source(): void
    {
        $normalizer = $this->makeNormalizer();

        $resolved = $normalizer->resolveSourceRaw('tvvip.social', 'lm.facebook.com');

        $this->assertSame('tvvip.social', $resolved);
    }
}
