<?php

namespace Tests\Unit\WhatsApp;

use Tests\TestCase;

class ZApiRafflePayloadShapeTest extends TestCase
{
    public function test_light_group_metadata_fixture_matches_zapi_raffle_shape(): void
    {
        $payload = $this->fixture('light-group-metadata.real-shape.json');

        $this->assertIsString($payload['phone'] ?? null);
        $this->assertStringEndsWith('-group', $payload['phone']);
        $this->assertIsArray($payload['participants'] ?? null);
        $this->assertNotEmpty($payload['participants']);

        foreach ($payload['participants'] as $participant) {
            $this->assertIsArray($participant);
            $this->assertArrayHasKey('phone', $participant);
            $this->assertIsString($participant['phone']);
            $this->assertMatchesRegularExpression('/^\d{12,15}$/', $participant['phone']);

            if (array_key_exists('lid', $participant)) {
                $this->assertIsString($participant['lid']);
            }

            $this->assertIsBool($participant['isAdmin'] ?? null);
            $this->assertIsBool($participant['isSuperAdmin'] ?? null);
        }

        $this->assertIsString($payload['owner'] ?? null);
        $this->assertIsString($payload['subject'] ?? null);
        $this->assertTrue(
            ! array_key_exists('invitationLink', $payload) || $payload['invitationLink'] === null,
            'light-group-metadata must not depend on invitation link.'
        );
    }

    public function test_profile_picture_fixtures_accept_success_and_not_found_shapes(): void
    {
        $success = $this->fixture('profile-picture.success.json');
        $notFound = $this->fixture('profile-picture.not-found.json');

        $this->assertIsString($success['link'] ?? null);
        $this->assertStringStartsWith('https://', $success['link']);

        $this->assertSame('null', $notFound['link'] ?? null);
        $this->assertSame('item-not-found', $notFound['errorMessage'] ?? null);
    }

    private function fixture(string $name): array
    {
        $path = base_path("tests/Fixtures/zapi/{$name}");

        $this->assertFileExists($path);

        $payload = json_decode((string) file_get_contents($path), true);

        $this->assertIsArray($payload);

        return $payload;
    }
}
