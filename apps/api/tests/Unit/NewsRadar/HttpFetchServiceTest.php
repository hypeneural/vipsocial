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
}
