<?php

namespace App\Modules\UserAiPrompts\Support;

use App\Modules\UserAiPrompts\Enums\PromptProviderTarget;

class PromptTemplateCatalog
{
    public static function variables(): array
    {
        $markdownExample = rtrim((string) config('app.url'), '/') . '/news/{public_token}.md';

        return [
            [
                'key' => '{{md_url}}',
                'label' => 'Link do Markdown publico',
                'description' => 'URL publica da noticia em markdown.',
                'example' => $markdownExample,
                'required_recommended' => true,
            ],
            [
                'key' => '{{item_title}}',
                'label' => 'Titulo da noticia',
                'description' => 'Titulo original capturado no feed.',
                'example' => 'Prefeitura anuncia novo pacote de obras',
                'required_recommended' => false,
            ],
            [
                'key' => '{{item_source}}',
                'label' => 'Fonte',
                'description' => 'Nome da fonte ou provedor RSS.',
                'example' => 'UOL',
                'required_recommended' => false,
            ],
            [
                'key' => '{{item_date}}',
                'label' => 'Data editorial',
                'description' => 'Data da noticia na timezone editorial.',
                'example' => '12/03/2026 12:30',
                'required_recommended' => false,
            ],
            [
                'key' => '{{item_excerpt}}',
                'label' => 'Resumo',
                'description' => 'Lead sintetico da noticia.',
                'example' => 'A administracao publicou o cronograma das obras e os bairros afetados.',
                'required_recommended' => false,
            ],
            [
                'key' => '{{item_city}}',
                'label' => 'Cidade',
                'description' => 'Municipio inferido pela camada de IA.',
                'example' => 'Tijucas',
                'required_recommended' => false,
            ],
            [
                'key' => '{{item_urgency}}',
                'label' => 'Urgencia',
                'description' => 'Urgencia inferida pela camada de IA.',
                'example' => 'Alta',
                'required_recommended' => false,
            ],
            [
                'key' => '{{item_category}}',
                'label' => 'Categoria principal',
                'description' => 'Primeira categoria prioritaria da noticia.',
                'example' => 'Politica',
                'required_recommended' => false,
            ],
            [
                'key' => '{{item_categories}}',
                'label' => 'Categorias',
                'description' => 'Lista de categorias unidas por virgula.',
                'example' => 'Politica, Brasil, Congresso',
                'required_recommended' => false,
            ],
            [
                'key' => '{{item_original_url}}',
                'label' => 'URL original',
                'description' => 'URL nativa capturada na origem.',
                'example' => 'https://fonte.test/noticia?id=123&utm_source=rss',
                'required_recommended' => false,
            ],
        ];
    }

    public static function starterTemplate(): array
    {
        return [
            'name' => 'Reescrita Jornalistica Padrao',
            'description' => 'Starter oficial para reescrita jornalistica com markdown publico.',
            'provider_target' => PromptProviderTarget::Generic,
            'content' => implode("\n", [
                'Reescreva a noticia abaixo em portugues do Brasil, com estilo jornalistico profissional, claro e original.',
                '',
                'Use como base o conteudo deste arquivo:',
                '{{md_url}}',
                '',
                'Contexto adicional da noticia:',
                '- Titulo original: {{item_title}}',
                '- Fonte: {{item_source}}',
                '- Data: {{item_date}}',
                '- Resumo: {{item_excerpt}}',
                '- Cidade: {{item_city}}',
                '- Urgencia: {{item_urgency}}',
                '- Categoria principal: {{item_category}}',
                '- Categorias: {{item_categories}}',
                '- URL original: {{item_original_url}}',
                '',
                'Objetivo:',
                '- criar uma versao original',
                '- manter fidelidade factual',
                '- preservar nomes, datas, locais, cargos e numeros',
                '- evitar copiar frases literalmente',
                '- evitar sensacionalismo',
                '- manter tom informativo',
                '',
                'Retorne em:',
                '1. Titulo',
                '2. Subtitulo',
                '3. Lead',
                '4. Corpo da materia',
                '5. 3 chamadas curtas para redes',
            ]),
        ];
    }
}
