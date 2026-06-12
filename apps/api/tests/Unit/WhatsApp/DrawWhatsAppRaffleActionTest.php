<?php

namespace Tests\Unit\WhatsApp;

use App\Modules\WhatsApp\Actions\DrawWhatsAppRaffleAction;
use App\Modules\WhatsApp\Clients\WhatsAppProviderInterface;
use App\Modules\WhatsApp\Exceptions\WhatsAppRaffleException;
use App\Modules\WhatsApp\Models\WhatsAppRaffleDraw;
use App\Modules\WhatsApp\Services\WhatsAppService;
use App\Modules\WhatsApp\Support\WhatsAppTargetNormalizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DrawWhatsAppRaffleActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_filters_owner_admin_excluded_invalid_and_duplicate_participants_before_drawing(): void
    {
        config()->set('whatsapp.raffle.group_id', '120363407637460643-group');
        config()->set('whatsapp.raffle.campaign_key', 'vip-test');
        config()->set('whatsapp.raffle.excluded_phones', ['554898115750']);
        config()->set('whatsapp.raffle.exclude_admins', true);

        $provider = new FakeWhatsAppRaffleProvider(
            metadata: [
                'phone' => '120363407637460643-group',
                'owner' => '554896553954',
                'subject' => 'SORTEIO VIP | Camisa do Brasil',
                'participants' => [
                    ['phone' => '554896553954', 'isAdmin' => false, 'isSuperAdmin' => false],
                    ['phone' => '554884828678', 'isAdmin' => true, 'isSuperAdmin' => false],
                    ['phone' => '554898115750', 'isAdmin' => false, 'isSuperAdmin' => false],
                    ['phone' => 'abc', 'isAdmin' => false, 'isSuperAdmin' => false],
                    ['phone' => '554791568144', 'isAdmin' => false, 'isSuperAdmin' => false],
                    ['phone' => '554791568144', 'isAdmin' => false, 'isSuperAdmin' => false],
                ],
            ],
            profilePicture: ['link' => 'https://pps.whatsapp.net/avatar.jpg']
        );

        $result = (new DrawWhatsAppRaffleAction($this->service($provider)))->execute();

        $this->assertSame(1, $result['eligible_participants_count']);
        $this->assertSame('****68144', $result['phone_masked']);
        $this->assertSame('https://pps.whatsapp.net/avatar.jpg', $result['photo_url']);
        $this->assertSame([
            ['endpoint' => 'light-group-metadata/120363407637460643-group', 'query' => []],
            ['endpoint' => 'profile-picture', 'query' => ['phone' => '554791568144']],
        ], $provider->gets);

        $draw = WhatsAppRaffleDraw::query()->firstOrFail();
        $this->assertSame('554791568144', $draw->winner_phone_encrypted);
        $this->assertStringNotContainsString(
            '554791568144',
            (string) $draw->getRawOriginal('winner_phone_encrypted')
        );
    }

    public function test_not_found_profile_picture_is_stored_as_null(): void
    {
        config()->set('whatsapp.raffle.group_id', '120363407637460643-group');

        $provider = new FakeWhatsAppRaffleProvider(
            metadata: [
                'phone' => '120363407637460643-group',
                'participants' => [
                    ['phone' => '554791568144', 'isAdmin' => false, 'isSuperAdmin' => false],
                ],
            ],
            profilePicture: ['link' => 'null', 'errorMessage' => 'item-not-found']
        );

        $result = (new DrawWhatsAppRaffleAction($this->service($provider)))->execute();

        $this->assertNull($result['photo_url']);
        $this->assertFalse(WhatsAppRaffleDraw::query()->firstOrFail()->winner_had_photo);
    }

    public function test_no_eligible_participants_does_not_call_profile_picture(): void
    {
        config()->set('whatsapp.raffle.group_id', '120363407637460643-group');

        $provider = new FakeWhatsAppRaffleProvider(
            metadata: [
                'phone' => '120363407637460643-group',
                'owner' => '554896553954',
                'participants' => [
                    ['phone' => '554896553954', 'isAdmin' => false, 'isSuperAdmin' => false],
                    ['phone' => '554884828678', 'isAdmin' => true, 'isSuperAdmin' => false],
                ],
            ],
            profilePicture: ['link' => 'https://pps.whatsapp.net/avatar.jpg']
        );

        $this->expectException(WhatsAppRaffleException::class);
        $this->expectExceptionMessage('Nenhum participante elegivel encontrado.');

        try {
            (new DrawWhatsAppRaffleAction($this->service($provider)))->execute();
        } finally {
            $this->assertCount(1, $provider->gets);
            $this->assertSame('light-group-metadata/120363407637460643-group', $provider->gets[0]['endpoint']);
        }
    }

    public function test_profile_picture_rejects_empty_phone_before_provider_call(): void
    {
        $provider = new FakeWhatsAppRaffleProvider([], []);
        $service = $this->service($provider);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Telefone obrigatorio para buscar foto do perfil');

        try {
            $service->profilePicture('');
        } finally {
            $this->assertSame([], $provider->gets);
        }
    }

    private function service(WhatsAppProviderInterface $provider): WhatsAppService
    {
        return new WhatsAppService($provider, $this->app->make(WhatsAppTargetNormalizer::class));
    }
}

class FakeWhatsAppRaffleProvider implements WhatsAppProviderInterface
{
    public array $gets = [];

    public function __construct(
        private readonly array $metadata,
        private readonly array $profilePicture
    ) {
    }

    public function get(string $endpoint, array $query = []): array
    {
        $this->gets[] = compact('endpoint', 'query');

        return match (true) {
            str_starts_with($endpoint, 'light-group-metadata/') => $this->metadata,
            $endpoint === 'profile-picture' => $this->profilePicture,
            default => [],
        };
    }

    public function post(string $endpoint, array $payload = []): array
    {
        return compact('endpoint', 'payload');
    }
}
