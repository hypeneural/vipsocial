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
            <h1>UBS Rodolfo Francisco da Veiga tera atendimento suspenso para mudanca de endereco</h1>
            <p class="noticias_data">47 minutos atras</p>
            <div class="texto">
                <p><img src="https://tijucas.sc.gov.br/conteudo/noticias/5993/dji0951.jpg" width="100%" alt=""></p>
                <p>A Prefeitura Municipal de Tijucas informa a mudanca temporaria do atendimento.</p>
                <p>Os atendimentos retornam no novo endereco a partir de segunda-feira.</p>
            </div>
        </div>
    </body>
</html>
HTML;

        $result = $service->extract($html);

        $this->assertSame(
            'UBS Rodolfo Francisco da Veiga tera atendimento suspenso para mudanca de endereco',
            $result->title
        );
        $this->assertSame('https://tijucas.sc.gov.br/conteudo/noticias/5993/dji0951.jpg', $result->heroImage);
        $this->assertStringContainsString('mudanca temporaria do atendimento', $result->bodyText ?? '');
        $this->assertStringContainsString('novo endereco', $result->bodyText ?? '');
    }

    public function test_extract_prefers_full_article_body_over_nested_related_content_blocks(): void
    {
        $service = new ArticleExtractorService(new BoilerplateCleanerService());

        $html = <<<'HTML'
<!doctype html>
<html>
    <head>
        <meta property="og:title" content="Whatsapp anuncia controle parental para contas de menores de 13 anos">
        <meta property="article:published_time" content="2026-03-11T23:15:59+00:00">
    </head>
    <body>
        <section id="single">
            <div class="container">
                <div class="row">
                    <div class="col-md-9">
                        <article>
                            <p>O aplicativo de troca de mensagens WhatsApp anunciou nova funcionalidade para pais e responsaveis.</p>
                            <div class="code-block"><div id="gam_intext_1" class="ads"></div></div>
                            <p>Segundo a Meta, a nova funcionalidade permitira controlar contatos e grupos da conta do menor.</p>
                            <div class="line-news-detailed">
                                <div class="content">
                                    <a href="https://ocp.news/politica/zanin-sera-novo-relator">Zanin sera novo relator</a>
                                </div>
                            </div>
                            <p>Alem disso, sera possivel revisar pedidos de contato desconhecido e configuracoes de privacidade.</p>
                        </article>
                    </div>
                </div>
            </div>
        </section>
    </body>
</html>
HTML;

        $result = $service->extract($html);

        $this->assertSame('Whatsapp anuncia controle parental para contas de menores de 13 anos', $result->title);
        $this->assertStringContainsString('nova funcionalidade para pais e responsaveis', $result->bodyText ?? '');
        $this->assertStringContainsString('revisar pedidos de contato desconhecido', $result->bodyText ?? '');
        $this->assertStringNotContainsString('Zanin sera novo relator', $result->bodyText ?? '');
    }
}
