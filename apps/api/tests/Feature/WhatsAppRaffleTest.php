<?php

use App\Models\User;
use App\Modules\WhatsApp\Actions\DrawWhatsAppRaffleAction;
use App\Modules\WhatsApp\Models\WhatsAppRaffleDraw;
use App\Modules\WhatsApp\Services\WhatsAppService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Permission::findOrCreate('whatsapp.raffle.draw', 'web');
    Permission::findOrCreate('whatsapp.raffle.history', 'web');
    Permission::findOrCreate('whatsapp.raffle.reveal-phone', 'web');
    Permission::findOrCreate('whatsapp.raffle.view', 'web');

    config()->set('whatsapp.raffle.group_id', '120363407637460643-group');
    config()->set('whatsapp.raffle.campaign_key', 'vip-test');
    config()->set('whatsapp.raffle.allow_phone_reveal', true);
    config()->set('whatsapp.raffle.exclude_admins', true);
    config()->set('whatsapp.raffle.excluded_phones', []);
    Cache::flush();
});

it('requires authentication to draw', function (): void {
    $this->postJson('/api/v1/whatsapp/raffle/draw')->assertUnauthorized();
});

it('requires draw permission', function (): void {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson('/api/v1/whatsapp/raffle/draw')
        ->assertForbidden()
        ->assertJsonPath('code', 'FORBIDDEN');
});

it('allows admin users to draw even before raffle permissions are synced to the role', function (): void {
    $user = User::factory()->create([
        'role' => 'admin',
    ]);

    app()->instance(DrawWhatsAppRaffleAction::class, new class extends DrawWhatsAppRaffleAction {
        public function __construct()
        {
        }

        public function execute(?User $user = null, array $overrides = []): array
        {
            return [
                'draw_id' => '01HXADMINRAFFLE0000000000',
                'confirmation_code' => 'BR-ADMN',
                'group_id' => '120363407637460643-group',
                'group_name' => 'SORTEIO VIP | Camisa do Brasil',
                'campaign_name' => null,
                'campaign_key' => 'vip-test',
                'phone_masked' => '****68144',
                'phone_last_digits' => '68144',
                'photo_url' => null,
                'eligible_participants_count' => 4,
                'can_reveal_phone' => true,
                'drawn_at' => now()->toJSON(),
            ];
        }
    });

    Sanctum::actingAs($user);

    $this->postJson('/api/v1/whatsapp/raffle/draw')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.confirmation_code', 'BR-ADMN');
});

it('draws a winner from zapi metadata without exposing the full phone', function (): void {
    $user = raffleUser(['whatsapp.raffle.draw']);

    app()->instance(DrawWhatsAppRaffleAction::class, new class extends DrawWhatsAppRaffleAction {
        public function __construct()
        {
        }

        public function execute(?User $user = null, array $overrides = []): array
        {
            return [
                'draw_id' => '01HXRAFFLETEST000000000000',
                'confirmation_code' => 'BR-ABCD',
                'group_id' => $overrides['group_id'] ?? '120363407637460643-group',
                'group_name' => 'SORTEIO VIP | Camisa do Brasil',
                'campaign_name' => $overrides['campaign_name'] ?? null,
                'campaign_key' => $overrides['campaign_key'] ?? 'vip-test',
                'phone_masked' => '****68144',
                'phone_last_digits' => '68144',
                'photo_url' => 'https://pps.whatsapp.net/avatar.jpg',
                'eligible_participants_count' => 4,
                'can_reveal_phone' => true,
                'drawn_at' => now()->toJSON(),
            ];
        }
    });

    Sanctum::actingAs($user);

    $this->postJson('/api/v1/whatsapp/raffle/draw', [
        'group_id' => '120363407637460643-group',
        'campaign_name' => 'SORTEIO VIP | Camisa do Brasil',
        'campaign_key' => 'vip-test',
    ])
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.phone_masked', '****68144')
        ->assertJsonMissingPath('data.phone_full')
        ->assertJsonMissingPath('data.winner_phone_encrypted');
});

it('returns a conflict when another draw is locked', function (): void {
    $user = raffleUser(['whatsapp.raffle.draw']);
    $lock = Cache::lock('whatsapp-raffle:draw:120363407637460643-group:vip-test', 30);
    $lock->get();

    app()->instance(WhatsAppService::class, Mockery::mock(WhatsAppService::class));

    Sanctum::actingAs($user);

    $this->postJson('/api/v1/whatsapp/raffle/draw')
        ->assertStatus(409)
        ->assertJsonPath('code', 'WHATSAPP_RAFFLE_LOCKED');

    $lock->release();
});

it('lists history without exposing full or encrypted phone', function (): void {
    $user = raffleUser(['whatsapp.raffle.history']);
    $draw = raffleDraw(['drawn_by' => $user->id]);

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/v1/whatsapp/raffle/draws?per_page=5')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.0.draw_id', $draw->id)
        ->assertJsonPath('data.0.phone_masked', '****68144')
        ->assertJsonMissingPath('data.0.phone_full')
        ->assertJsonMissingPath('data.0.winner_phone_encrypted');

    expect(json_encode($response->json()))->not->toContain('554791568144');
});

it('requires history permission', function (): void {
    Sanctum::actingAs(User::factory()->create());

    $this->getJson('/api/v1/whatsapp/raffle/draws')->assertForbidden();
});

it('requires reveal permission', function (): void {
    $draw = raffleDraw();
    $user = raffleUser(['whatsapp.raffle.history']);

    Sanctum::actingAs($user);

    $this->postJson("/api/v1/whatsapp/raffle/draws/{$draw->id}/reveal-phone")
        ->assertForbidden();
});

it('reveals the full phone only through the reveal endpoint', function (): void {
    $draw = raffleDraw();
    $user = raffleUser(['whatsapp.raffle.reveal-phone']);

    Sanctum::actingAs($user);

    $this->postJson("/api/v1/whatsapp/raffle/draws/{$draw->id}/reveal-phone")
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.phone_full', '554791568144')
        ->assertJsonPath('data.phone_formatted', '+55 47 9156-8144');

    $this->assertDatabaseHas('whatsapp_raffle_phone_reveals', [
        'draw_id' => $draw->id,
        'revealed_by' => $user->id,
    ]);

    expect($draw->fresh()->reveal_count)->toBe(1);
});

it('returns validation error for invalid group id override', function (): void {
    $user = raffleUser(['whatsapp.raffle.draw']);

    Sanctum::actingAs($user);

    $this->postJson('/api/v1/whatsapp/raffle/draw', [
        'group_id' => 'invalid',
    ])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'VALIDATION_ERROR');
});

function raffleUser(array $permissions): User
{
    $user = User::factory()->create();
    $user->givePermissionTo($permissions);

    return $user;
}

function raffleDraw(array $attributes = []): WhatsAppRaffleDraw
{
    return WhatsAppRaffleDraw::query()->create(array_replace([
        'confirmation_code' => 'BR-ABCD',
        'group_id' => '120363407637460643-group',
        'group_subject' => 'SORTEIO VIP | Camisa do Brasil',
        'campaign_name' => 'SORTEIO VIP | Camisa do Brasil',
        'campaign_key' => 'vip-test',
        'eligible_participants_count' => 4,
        'winner_phone_hash' => hash_hmac('sha256', '554791568144', (string) config('app.key')),
        'winner_phone_encrypted' => '554791568144',
        'phone_last_digits' => '68144',
        'winner_had_photo' => true,
        'photo_url' => 'https://pps.whatsapp.net/avatar.jpg',
        'drawn_at' => now(),
        'provider' => 'zapi',
        'provider_payload_hash' => hash('sha256', 'payload'),
    ], $attributes));
}
