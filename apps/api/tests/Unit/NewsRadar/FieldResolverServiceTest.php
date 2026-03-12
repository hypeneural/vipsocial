<?php

namespace Tests\Unit\NewsRadar;

use App\Modules\NewsRadar\Services\ArticleExtractedData;
use App\Modules\NewsRadar\Services\ArticleExtractorService;
use App\Modules\NewsRadar\Services\DateParserService;
use App\Modules\NewsRadar\Services\FeedItemDto;
use App\Modules\NewsRadar\Services\FieldResolverService;
use App\Modules\NewsRadar\Services\ListingItem;
use Tests\TestCase;

class FieldResolverServiceTest extends TestCase
{
    public function test_resolve_all_falls_back_to_feed_body_when_article_body_is_only_related_link(): void
    {
        class_exists(ArticleExtractorService::class);

        $service = new FieldResolverService(new DateParserService());

        $feed = new FeedItemDto(
            title: 'Whatsapp anuncia controle parental para contas de menores de 13 anos',
            rawUrl: 'https://ocp.news/economia/whatsapp-anuncia-controle-parental',
            normalizedUrl: 'https://ocp.news/economia/whatsapp-anuncia-controle-parental',
            urlHash: hash('sha256', 'https://ocp.news/economia/whatsapp-anuncia-controle-parental'),
            guid: 'ocp-whatsapp',
            authorRaw: 'Pedro Leal',
            publishedAtRaw: '2026-03-11T23:15:59+00:00',
            bodyHtml: '<p>O aplicativo de troca de mensagens WhatsApp anunciou nova funcionalidade para pais e responsaveis.</p>'
                . '<p>Segundo a Meta, o recurso permitira controlar contatos e grupos da conta do menor.</p>'
                . '<p>Alem disso, sera possivel revisar pedidos de contato desconhecido e configuracoes de privacidade.</p>',
            excerpt: 'O aplicativo de troca de mensagens WhatsApp anunciou nova funcionalidade.',
            categoriesRaw: ['economia'],
            heroImageUrl: 'https://ocp.news/wp-content/uploads/2021/06/logo-whatsapp-aplicativo.jpg',
            rawPayload: [],
        );

        $article = new ArticleExtractedData(
            title: 'Whatsapp anuncia controle parental para contas de menores de 13 anos',
            subtitle: null,
            author: 'Pedro Leal',
            publishedAt: '2026-03-11T23:15:59+00:00',
            modifiedAt: null,
            heroImage: 'https://ocp.news/wp-content/uploads/2021/06/logo-whatsapp-aplicativo.jpg',
            bodyHtml: '<a href="https://ocp.news/politica/zanin-sera-novo-relator">Zanin sera novo relator</a>',
            bodyText: 'Zanin sera novo relator',
            categories: ['economia'],
            jsonLdRaw: [],
            ogRaw: [],
        );

        $resolved = $service->resolveAll(null, $feed, $article, [
            'timezone_default' => 'America/Sao_Paulo',
            'date_formats' => [],
            'date_preprocessors' => [],
            'image_extraction_strategy' => 'og_first_then_body',
        ]);

        $this->assertSame('feed_content_encoded', $resolved->fieldAudit['body_html']);
        $this->assertStringContainsString('nova funcionalidade para pais e responsaveis', $resolved->bodyText ?? '');
        $this->assertStringNotContainsString('Zanin sera novo relator', $resolved->bodyText ?? '');
    }

    public function test_resolve_all_prefers_article_or_listing_fields_before_generic_og_metadata(): void
    {
        class_exists(ArticleExtractorService::class);

        $service = new FieldResolverService(new DateParserService());

        $listing = new ListingItem(
            rawUrl: 'https://www.bc.sc.gov.br/imprensa_detalhe.cfm?codigo=41832',
            normalizedUrl: 'https://www.bc.sc.gov.br/imprensa_detalhe.cfm?codigo=41832',
            urlHash: hash('sha256', 'https://www.bc.sc.gov.br/imprensa_detalhe.cfm?codigo=41832'),
            title: 'Meio Ambiente - Atividade de educacao ambiental e adiada',
            imageUrl: null,
            excerpt: null,
        );

        $article = new ArticleExtractedData(
            title: null,
            subtitle: 'A atividade de educacao ambiental prevista para a tarde desta quinta-feira foi adiada em razao das condicoes climaticas.',
            author: null,
            publishedAt: '11.03.2026 - 18:00h',
            modifiedAt: null,
            heroImage: null,
            bodyHtml: '<p>A atividade de educacao ambiental prevista para a tarde desta quinta-feira foi adiada.</p>',
            bodyText: 'A atividade de educacao ambiental prevista para a tarde desta quinta-feira foi adiada.',
            categories: [],
            jsonLdRaw: [],
            ogRaw: [
                'og:title' => 'Prefeitura de Balneario Camboriu',
                'og:description' => 'Portal Oficial da Prefeitura Municipal de Balneario Camboriu',
            ],
        );

        $resolved = $service->resolveAll($listing, null, $article, [
            'timezone_default' => 'America/Sao_Paulo',
            'date_formats' => ['d.m.Y - H:i'],
            'date_preprocessors' => [
                ['type' => 'replace', 'search' => 'h', 'replace' => ''],
                ['type' => 'trim'],
            ],
            'image_extraction_strategy' => 'body_only',
        ]);

        $this->assertSame('Meio Ambiente - Atividade de educacao ambiental e adiada', $resolved->title);
        $this->assertSame(
            'A atividade de educacao ambiental prevista para a tarde desta quinta-feira foi adiada em razao das condicoes climaticas.',
            $resolved->subtitle
        );
        $this->assertSame('listing', $resolved->fieldAudit['title']);
        $this->assertSame('article_html', $resolved->fieldAudit['subtitle']);
        $this->assertSame('2026-03-11T18:00:00-03:00', $resolved->publishedAtParsed);
    }
}
