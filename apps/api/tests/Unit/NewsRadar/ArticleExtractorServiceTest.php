<?php

namespace Tests\Unit\NewsRadar;

use App\Modules\NewsRadar\Services\ArticleExtractorService;
use App\Modules\NewsRadar\Services\BoilerplateCleanerService;
use Tests\TestCase;

class ArticleExtractorServiceTest extends TestCase
{
    public function test_extract_uses_default_selectors_for_tijucas_like_markup(): void
    {
        $service = new ArticleExtractorService(new BoilerplateCleanerService());

        $html = <<<'HTML'
<!doctype html>
<html>
    <head>
        <title>Materia - Prefeitura de Tijucas</title>
    </head>
    <body>
        <div class="content">
            <h1>UBS Rodolfo Francisco da Veiga terá atendimento suspenso para mudança de endereço</h1>
            <p class="noticias_data">47 minutos atrás</p>
            <div class="texto">
                <p><img src="https://tijucas.sc.gov.br/conteudo/noticias/5993/dji0951.jpg" width="100%" alt=""></p>
                <p>A Prefeitura Municipal de Tijucas informa a mudança temporária do atendimento.</p>
                <p>Os atendimentos retornam no novo endereço a partir de segunda-feira.</p>
            </div>
        </div>
    </body>
</html>
HTML;

        $result = $service->extract($html);

        $this->assertSame(
            'UBS Rodolfo Francisco da Veiga terá atendimento suspenso para mudança de endereço',
            $result->title
        );
        $this->assertSame('https://tijucas.sc.gov.br/conteudo/noticias/5993/dji0951.jpg', $result->heroImage);
        $this->assertStringContainsString('mudança temporária do atendimento', $result->bodyText ?? '');
        $this->assertStringContainsString('novo endereço', $result->bodyText ?? '');
    }
}
