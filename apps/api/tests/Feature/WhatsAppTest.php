<?php

use App\Models\User;
use App\Modules\WhatsApp\Jobs\SendWhatsAppTextJob;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    config([
        'whatsapp.zapi.base_url' => 'https://api.z-api.io',
        'whatsapp.zapi.instance' => 'instance-test',
        'whatsapp.zapi.token' => 'token-test',
        'whatsapp.zapi.client_token' => 'client-token-test',
        'whatsapp.zapi.timeout' => 10,
        'whatsapp.zapi.retry_times' => 1,
        'whatsapp.zapi.retry_sleep_ms' => 1,
        'whatsapp.cache.status_ttl_sec' => 30,
    ]);
});

function makeAuthenticatedUser(): User
{
    return User::factory()->make([
        'id' => 1,
        'active' => true,
        'role' => 'admin',
    ]);
}

test('whatsapp endpoints require authentication', function () {
    $this->getJson('/api/v1/whatsapp/status')
        ->assertStatus(401);
});

test('send text sync returns zapi response', function () {
    Http::fake([
        '*' => Http::response([
            'zaapId' => 'abc',
            'messageId' => 'def',
        ], 200),
    ]);

    $user = makeAuthenticatedUser();
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/whatsapp/send-text', [
            'phone' => '(11) 99999-8888',
            'message' => 'Ola',
            'options' => [
                'delayMessage' => 2,
            ],
        ])
        ->assertOk()
        ->assertJsonPath('data.zaapId', 'abc');

    Http::assertSent(function (Request $request): bool {
        return $request->url() === 'https://api.z-api.io/instances/instance-test/token/token-test/send-text'
            && $request->hasHeader('Client-Token', 'client-token-test')
            && $request['phone'] === '5511999998888';
    });
});

test('send text async queues job', function () {
    Queue::fake();

    $user = makeAuthenticatedUser();
    Sanctum::actingAs($user);

    $this->postJson('/api/v1/whatsapp/send-text', [
            'phone' => '5511999999999',
            'message' => 'Mensagem async',
            'async' => true,
            'queue' => 'whatsapp',
        ])
        ->assertStatus(202)
        ->assertJsonPath('data.queued', true);

    Queue::assertPushed(SendWhatsAppTextJob::class, function (SendWhatsAppTextJob $job): bool {
        return $job->phone === '5511999999999'
            && $job->message === 'Mensagem async';
    });
});

test('status uses short cache', function () {
    Cache::flush();

    Http::fake([
        '*' => Http::response([
            'connected' => true,
        ], 200),
    ]);

    $user = makeAuthenticatedUser();
    Sanctum::actingAs($user);
    $request = fn() => $this->getJson('/api/v1/whatsapp/status');

    $request()->assertOk()->assertJsonPath('data.connected', true);
    $request()->assertOk()->assertJsonPath('data.connected', true);

    Http::assertSentCount(1);
});

test('status fresh query bypasses cache', function () {
    Cache::flush();

    Http::fakeSequence()
        ->push([
            'connected' => true,
        ], 200)
        ->push([
            'connected' => false,
        ], 200);

    $user = makeAuthenticatedUser();
    Sanctum::actingAs($user);

    $this->getJson('/api/v1/whatsapp/status')
        ->assertOk()
        ->assertJsonPath('data.connected', true);

    $this->getJson('/api/v1/whatsapp/status')
        ->assertOk()
        ->assertJsonPath('data.connected', true);

    $this->getJson('/api/v1/whatsapp/status?fresh=1')
        ->assertOk()
        ->assertJsonPath('data.connected', false);

    Http::assertSentCount(2);
});

test('connection state returns device details when connected', function () {
    Cache::flush();

    Http::fake([
        'https://api.z-api.io/instances/instance-test/token/token-test/status' => Http::response([
            'connected' => true,
            'smartphoneConnected' => true,
        ], 200),
        'https://api.z-api.io/instances/instance-test/token/token-test/device' => Http::response([
            'phone' => '554896727305',
            'lid' => '178898423832679@lid',
            'imgUrl' => 'https://example.com/device.jpg',
            'about' => 'Jornalismo',
            'name' => 'Jornalismo VipSocial',
            'device' => [
                'sessionName' => 'Z-API',
                'device_model' => 'Z-API',
            ],
            'originalDevice' => 'iphone',
            'sessionId' => 164,
            'isBusiness' => false,
        ], 200),
    ]);

    $user = makeAuthenticatedUser();
    Sanctum::actingAs($user);

    $this->getJson('/api/v1/whatsapp/connection-state')
        ->assertOk()
        ->assertJsonPath('data.connected', true)
        ->assertJsonPath('data.connection_source', 'status+device')
        ->assertJsonPath('data.phone', '554896727305')
        ->assertJsonPath('data.formatted_phone', '(48) 9672-7305')
        ->assertJsonPath('data.profile.name', 'Jornalismo VipSocial')
        ->assertJsonPath('data.profile.img_url', 'https://example.com/device.jpg')
        ->assertJsonPath('data.device.original_device', 'iphone')
        ->assertJsonPath('data.qr_code', null);

    Http::assertSentCount(2);
});

test('connection state returns qr code when disconnected', function () {
    Cache::flush();

    Http::fake([
        'https://api.z-api.io/instances/instance-test/token/token-test/status' => Http::response([
            'connected' => false,
            'smartphoneConnected' => false,
            'error' => 'You are not connected.',
        ], 200),
        'https://api.z-api.io/instances/instance-test/token/token-test/qr-code/image' => Http::response([
            'value' => 'data:image/png;base64,abc123',
        ], 200),
    ]);

    $user = makeAuthenticatedUser();
    Sanctum::actingAs($user);

    $this->getJson('/api/v1/whatsapp/connection-state')
        ->assertOk()
        ->assertJsonPath('data.connected', false)
        ->assertJsonPath('data.connection_source', 'status+qr')
        ->assertJsonPath('data.qr_available', true)
        ->assertJsonPath('data.qr_code', 'data:image/png;base64,abc123')
        ->assertJsonPath('data.qr_expires_in_sec', 20)
        ->assertJsonPath('data.status_message', 'You are not connected.')
        ->assertJsonPath('data.profile.name', null);

    Http::assertSentCount(2);
});

test('provider error is returned with status and body details', function () {
    Http::fake([
        '*' => Http::response([
            'error' => 'upstream-error',
        ], 503),
    ]);

    $user = makeAuthenticatedUser();
    Sanctum::actingAs($user);

    $this->getJson('/api/v1/whatsapp/status')
        ->assertStatus(503)
        ->assertJsonPath('code', 'WHATSAPP_PROVIDER_ERROR')
        ->assertJsonPath('errors.provider_status', 503)
        ->assertJsonPath('errors.provider_body.error', 'upstream-error');
});
