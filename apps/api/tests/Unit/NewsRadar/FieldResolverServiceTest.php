<?php

namespace Tests\Unit\NewsRadar;

use App\Modules\NewsRadar\Services\ArticleExtractedData;
use App\Modules\NewsRadar\Services\DateParserService;
use App\Modules\NewsRadar\Services\FeedItemDto;
use App\Modules\NewsRadar\Services\FieldResolverService;
use Tests\TestCase;

class FieldResolverServiceTest extends TestCase
{
    public function test_resolve_all_falls_back_to_feed_body_when_article_body_is_only_related_link(): void
    {
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
}
