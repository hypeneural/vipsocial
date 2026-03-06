<?php

namespace Tests\Unit\WhatsApp;

use App\Modules\WhatsApp\Clients\ZApiClient;
use App\Modules\WhatsApp\Exceptions\WhatsAppProviderException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ZApiClientTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'whatsapp.zapi.base_url' => 'https://api.z-api.io',
            'whatsapp.zapi.instance' => 'instance-test',
            'whatsapp.zapi.token' => 'token-test',
            'whatsapp.zapi.client_token' => 'client-token-test',
            'whatsapp.zapi.timeout' => 10,
            'whatsapp.zapi.retry_times' => 2,
            'whatsapp.zapi.retry_sleep_ms' => 1,
        ]);
    }

    public function test_post_uses_expected_url_and_header(): void
    {
        Http::fake([
            '*' => Http::response([
                'zaapId' => 'abc',
                'messageId' => 'def',
            ], 200),
        ]);

        $client = new ZApiClient();
        $response = $client->post('send-text', [
            'phone' => '5511999999999',
            'message' => 'Oi',
        ]);

        $this->assertSame('abc', $response['zaapId']);

        Http::assertSent(function (Request $request): bool {
            return $request->method() === 'POST'
                && $request->url() === 'https://api.z-api.io/instances/instance-test/token/token-test/send-text'
                && $request->hasHeader('Client-Token', 'client-token-test')
                && $request['phone'] === '5511999999999';
        });
    }

    public function test_get_throws_provider_exception_with_status_and_body(): void
    {
        Http::fake([
            '*' => Http::response([
                'error' => 'upstream-failure',
            ], 500),
        ]);

        $client = new ZApiClient();

        try {
            $client->get('status');
            $this->fail('Expected WhatsAppProviderException was not thrown');
        } catch (WhatsAppProviderException $e) {
            $this->assertSame(500, $e->status());
            $this->assertSame('upstream-failure', $e->responseBody()['error'] ?? null);
        }
    }
}
