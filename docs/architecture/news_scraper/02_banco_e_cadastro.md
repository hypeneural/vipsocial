# 2. Banco de Dados e Cadastro da Fonte

A arquitetura exige uma abordagem "Data-Driven" para o scraping. Em vez de hardcodar regras por site, as regras residem no banco de dados.

## 2.1. Estrutura de Tabelas (News Sources)

A tabela principal de fontes (`news_sources`) deve armazenar não apenas os metadados básicos gerenciais, mas as configurações refinadas de coleta e um histórico de telemetria da fonte.

**Exemplo Prático (Schema):**

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `uuid`/`bigint` | Chave primária |
| `name` | `string` | Nome do Portal (ex: Prefeitura de Tijucas) |
| `active` | `boolean` | Controla as rotinas ativas / filas da fonte |
| `discovery_mode` | `enum` | `auto`, `feed`, `sitemap`, `html_listing` |
| `crawling_config` | `json` | (JSON Detalhado abaixo) Configuração dos seletores HTML, extratores e limpadores de boilerplate. |
| `feed_quality_profile`| `enum` | Perfil inferido pelo sistema: `full`, `partial` ou `teaser_only`. Define se o Crawler precisará acessar a matéria completa. |
| `throttle_config` | `json` | Configurações de periodicidade adaptativa (intervalo mín/máx). |
| `timezone_default`| `string` | Exemplo: `America/Sao_Paulo` |
| `date_formats` | `json` | Array de formatos de datas customizados em ordem de prioridade. Muito eficiente caso a home page misture formatos. |
| `render_js_required`| `boolean`| Flag que define se a fonte precisa do Panther (Browser JS). Default `false`. Usa-se como exceção de fallback controlada. |
| `last_sync_at` | `timestamp` | Data do último _fetch_ (sucesso ou falha). |
| `consecutive_failures`|`integer` | Para pausar coletas fúteis (Circuit Breaker). |
| `success_rate` | `float` | Histórico gerencial de saúde do Crawl. |

### Destaque: Campo JSON (`crawling_config`)

O coração do extrator adaptável encontra-se neste campo JSON persistido na `news_sources`. O Spider lê o JSON e sabe onde encontrar os dados.

```json
{
  "homepage_url": "https://portal.com.br",
  "feed_url": null,
  "sitemap_url": null,
  "listing_urls": [],
  "article_url_patterns": [
    "/noticias/",
    "/[0-9]{4}/[0-9]{2}/"
  ],
  "extractors": {
    "title": [ ... ],
    "published_at": [ ... ],
    "image": [ ... ],
    "body": [ ... ]
  },
  "boilerplate_rules": {
     "remove_selectors": [
       "style", 
       "script",
       ".whatsapp-cta", 
       ".post-footer"
     ],
     "remove_text_patterns": [
       "O post .* apareceu primeiro em",
       "Clique aqui e faça parte do nosso grupo"
     ]
  },
  "date_formats": [ ... ],
    "c",
    "Y-m-d H:i:s",
    "d/m/Y H:i",
    "d/m/Y \\à\\s H:i"
  ],
  "ignore_url_patterns": [
    "/tag/",
    "/autor/",
    "/categoria/",
    "/videos/"
  ],
  "fetch_article_when_feed_incomplete": true
}
```

## 2.2 Tratamento de Datas (Tabela de Notícias)

As datas são problemáticas por natureza. É vital separar o dado cru do processado (Carbon/Timezone). A tabela final de itens (ex: `news_items` ou `noticias`) requer cautela:

*   `published_at_raw` (String, o texto como veio da página, ex: "Hoje às 14h")
*   `published_at_parsed` (Timestamp, interpretado pelo plugin de locale/fallback)
*   `published_at_utc` (Timestamp, convertido estritamente em GMT 0, para garantir _time-range_ no BD globalmente)
*   `published_at_timezone` (String, o offset ou _named timezone_ que estava vigente na hora da conversão, ex: `-03:00` ou `America/Sao_Paulo`)
*   `published_at_source` (String, a flag informando quem originou o dado: ex: `rss`, `jsonld`, `og_tag`, `text_pattern`, `manual`)
*   `modified_at_raw` / `modified_at_utc` (Garante controle de atualização da notícia original).

Este modelo assegura que, em caso de conversões equivocadas de fusos, ou scripts de data rodando fora de hora, o valor "raw" continua íntegro para um _replay_ ou migração futura de dados.

## 2.3. Configuração Guiada CSS (Painel SPA / React)

A arquitetura do painel de administração é invertida em relação a antigos sistemas (`n8n` manual). A UX é guiada pelo AutoDiscovery, escondendo complexidade técnica:

1.  **URL Base:** O operador fornece "prefeitura.sc.gov.br", e o backend reage em `background`.
2.  **AutoDiscovery (Bot SpatieCrawler em Ação):** Usando `spatie/crawler`, o Laravel viaja pela home. Tenta detectar `<link rel="alternate" type="application/rss+xml">` e requisitar `/sitemap.xml`.
3.  **Avaliação Inteligente do Feed (Score de Completude):** O sistema não se limita a achar o RSS; ele lê 3 a 5 itens e calcula um *score*:
    *   Tem `title` e `link` normalizado (sem UTM)?
    *   Tem `pubDate`/`isoDate`? (+15 pts)
    *   Tem `content:encoded` rico (> 600 caracteres)? (+20 pts)
    *   Com base nisso, classifica a fonte automaticamente em **PERFIL:** `wordpress_full_content` (Usa o feed quase como matéria final), `wordpress_full_but_noisy` (Aplica limpadores de boilerplate nativos) ou `wordpress_teaser_only` (Obriga o sistema a visitar a URL HTML da matéria).
4.  **Apresentação do Preview:** A tela retorna três (3) _Cards_ de _Preview_. O formulário preenche automaticamente os campos que encontrou "magicamente" pelas marcações padronizadas. Mostra o "Diagnóstico Automático da Fonte" (Ex: _"Conteúdo Completo via RSS: Sim | Precisa visitar a matéria: Não | Boilerplates detectados: CTA WhatsApp"_).
5.  **Ajuste Fino Manual (Seletores CSS & Limpadores):** O Operador só interfere se o portal não obedecer padrões. Utilizando a biblioteca `symfony/css-selector` acoplada internamente, o operador não fornece um XPath complexo, e sim parâmetros web convencionais como `.minha-lista-noticias h2 a`. Pode também adicionar exclusões de *Boilerplate* (ex: "Remover parágrafo que diz: *Siga no instagram*").
6.  **Periodicidade Recomendada (Throttle):** O próprio Wizard pode avaliar a atividade do _Sitemap_ (caso a tag `<lastmod>` esteja disponível), sugerindo o perfil de Scan ("A cada 1 hora", "Lento: 1 a 6 horas", "Adaptativo").

Este fluxo preserva a integridade de "receitas" validadas no banco de dados e tira a dependência constante do time de desenvolvimento via deploys de novos seletores para _sites teimosos_.
