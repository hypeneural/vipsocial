<?php

namespace Tests\Unit\NewsRadar;

use App\Modules\NewsRadar\Services\BoilerplateCleanerService;
use Tests\TestCase;

class BoilerplateCleanerServiceTest extends TestCase
{
    public function test_clean_removes_global_and_source_specific_boilerplate(): void
    {
        $service = new BoilerplateCleanerService();

        $html = <<<'HTML'
<div class="article-body">
    <style>.hidden { display: none; }</style>
    <script>console.log('x');</script>
    <p>Primeiro paragrafo da noticia.</p>
    <div class="cta-box">Assine agora</div>
    <img src="https://s.w.org/images/core/emoji/15.0.3/svg/1f525.svg" alt="emoji" />
    <p>Clique aqui e faca parte do nosso grupo</p>
    <p>Segundo paragrafo da noticia.</p>
    <p>Para mais noticias acompanhe o portal.</p>
    <p>Trecho que deve ser descartado.</p>
</div>
HTML;

        $cleaned = $service->clean(
            $html,
            boilerplateRules: [
                'remove_selectors' => ['.cta-box'],
            ],
            bodyStopPatterns: ['Para mais noticias']
        );

        $this->assertStringContainsString('Primeiro paragrafo da noticia.', $cleaned);
        $this->assertStringContainsString('Segundo paragrafo da noticia.', $cleaned);
        $this->assertStringNotContainsString('Assine agora', $cleaned);
        $this->assertStringNotContainsString('console.log', $cleaned);
        $this->assertStringNotContainsString('emoji', $cleaned);
        $this->assertStringNotContainsString('Clique aqui e faca parte do nosso grupo', $cleaned);
        $this->assertStringNotContainsString('Trecho que deve ser descartado.', $cleaned);
    }

    public function test_to_plain_text_normalizes_entities_and_whitespace(): void
    {
        $service = new BoilerplateCleanerService();

        $text = $service->toPlainText("<p>Ola&nbsp;&nbsp;mundo</p>\n<p>Teste</p>");

        $this->assertSame('Ola mundo Teste', $text);
    }
}
