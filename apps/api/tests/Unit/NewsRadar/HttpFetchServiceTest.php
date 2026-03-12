<?php

namespace Tests\Unit\NewsRadar;

use App\Modules\NewsRadar\Services\HttpFetchService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class HttpFetchServiceTest extends TestCase
{
    public function test_fetch_normalizes_iso_8859_1_html_to_utf8(): void
    {
        $html = '<html><body><a class="caller black">Meio Ambiente - Educação em Balneário Camboriú</a></body></html>';
        $encodedHtml = mb_convert_encoding($html, 'ISO-8859-1', 'UTF-8');

        Http::fake([
            'https://www.bc.sc.gov.br/imprensa.cfm' => Http::response(
                $encodedHtml,
                200,
                ['Content-Type' => 'text/html; charset=ISO-8859-1']
            ),
        ]);

        $service = new HttpFetchService();
        $result = $service->fetch('https://www.bc.sc.gov.br/imprensa.cfm');

        $this->assertTrue($result->success);
        $this->assertStringContainsString('Educação', $result->body);
        $this->assertStringContainsString('Balneário Camboriú', $result->body);
    }
    public function test_fetch_retries_javascript_cookie_challenge_pages(): void
    {
        Http::fake([
            'https://novatrento.sc.gov.br/feed/' => Http::sequence()
                ->push(
                    '<html><meta charset="utf-8" /><title></title><div></div></html><script> window.location.href ="/feed/"; </script>',
                    403,
                    [
                        'Content-Type' => 'text/html; charset=utf-8',
                        'Set-Cookie' => 'challenge=1; Path=/; HttpOnly',
                    ]
                )
                ->push(
                    '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Feed</title></channel></rss>',
                    200,
                    ['Content-Type' => 'application/rss+xml; charset=UTF-8']
                ),
        ]);

        $service = new HttpFetchService();
        $result = $service->fetch('https://novatrento.sc.gov.br/feed/');

        $this->assertTrue($result->success);
        $this->assertSame(200, $result->statusCode);
        $this->assertStringContainsString('<rss version="2.0">', $result->body);
        Http::assertSentCount(2);
    }

    public function test_fetch_xml_overrides_accept_header_for_feed_requests(): void
    {
        Http::fake([
            'https://novatrento.sc.gov.br/feed/' => Http::response(
                '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Feed</title></channel></rss>',
                200,
                ['Content-Type' => 'application/rss+xml; charset=UTF-8']
            ),
        ]);

        $service = new HttpFetchService();
        $result = $service->fetchXml('https://novatrento.sc.gov.br/feed/');

        $this->assertTrue($result->success);
        Http::assertSent(function ($request) {
            return $request->url() === 'https://novatrento.sc.gov.br/feed/'
                && str_contains($request->header('Accept')[0] ?? '', 'application/rss+xml');
        });
    }
}
