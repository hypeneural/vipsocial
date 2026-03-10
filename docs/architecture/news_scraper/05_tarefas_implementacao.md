# 5. Tarefas de Implementação — Módulo Radar de Notícias

Roadmap completo de implementação do módulo `NewsRadar`, organizado em **8 fases sequenciais**. Cada fase contém tarefas e subtarefas com dependências claras. A estrutura segue o padrão modular existente do projeto (`app/Modules/NewsRadar/`).

> **Notas Arquiteturais Importantes:**
> - `openai-php/laravel` é um cliente **community-maintained**. Deve ser tratado como adaptador. O contrato técnico (endpoints, parâmetros, JSON Schema) segue a **documentação oficial da OpenAI** como fonte de verdade.
> - O parser de feeds usa **SimplePie** (não SimpleXML manual), pois RSS/Atom com namespaces (`dc:creator`, `content:encoded`, Atom) é complexo demais para parsing genérico.
> - `symfony/css-selector` **não é opcional**. É peça fundamental do editor visual de seletores no painel.
> - A camada HTTP é **unificada**: o Roach já expõe downloader middleware para interceptar requests/responses. Não criar duas pilhas paralelas de retry/throttle. Uma única configuração HTTP reaproveitada tanto no onboarding quanto nos spiders.
> - Para `theme` (taxonomia editorial), usar **string validada** ou **FK para tabela `news_themes`** no banco (não enum rígido). O enum PHP continua válido para validação do output de IA, mas o banco precisa ser flexível para novos temas sem migração.
> - **Descoberta por listagem HTML é caso de primeira classe**, não fallback menor. Legados (Diarinho, VIPSocial) confirmam que muitos portais não possuem RSS.
> - Cada campo da notícia pode vir de **fontes diferentes** (título do card, imagem do listing, autor do detalhe, data do `<time>`). O `FieldResolverService` centraliza essa resolução.

### Perfis de Captura Confirmados pelos Legados

| Perfil | Exemplo Real | Descoberta | Detalhe | `fetch_detail_mode` |
|:---|:---|:---|:---|:---|
| **HTML Listing + Detalhe** | Diarinho, VIPSocial | Listagem HTML | Sempre buscar artigo | `always` |
| **RSS Full (falta imagem)** | Itapema, Correio Catarin. | Feed RSS | Só quando faltar campo | `when_incomplete` |
| **RSS Teaser + Detalhe** | SCC10 | Feed RSS | Sempre buscar artigo | `always` |
| **RSS Full Limpo** | Prefeituras | Feed RSS | Nunca | `never` |
| **RSS Full + Boilerplate** | Léo Nunes, Mesorregional | Feed RSS | Só limpeza | `when_incomplete` |

---

## Fase 1 — Fundação (Infraestrutura, Banco de Dados e Dependências)

> **Objetivo:** Criar a estrutura de diretórios, instalar dependências e rodar as migrations. Nenhuma lógica de negócio ainda — apenas o "esqueleto" do módulo.

### 1.1 Instalação de Dependências Composer

- [ ] `roach-php/laravel` — Motor de crawling/spiders (já inclui `symfony/dom-crawler`)
- [ ] `symfony/css-selector` — **Obrigatório.** Habilitar seletores CSS no DomCrawler e no editor visual do painel
- [ ] `simplepie/simplepie` — Parser dedicado de RSS/Atom com suporte nativo a namespaces (`dc:creator`, `content:encoded`)
- [ ] `spatie/crawler` — Descoberta de links (onboarding wizard)
- [ ] `league/uri` — Normalização/canonicalização de URLs
- [ ] `openai-php/laravel` — Adaptador para a API OpenAI (Structured Outputs via Responses API)
- [ ] Verificar se `guzzlehttp/guzzle`, `nesbot/carbon` já estão no `composer.json` (normalmente sim no Laravel)

### 1.2 Estrutura de Diretórios do Módulo

Criar a árvore dentro de `app/Modules/NewsRadar/`:

```
NewsRadar/
├── Http/
│   ├── Controllers/
│   │   ├── NewsSourceController.php
│   │   ├── NewsItemController.php
│   │   └── SourceDiscoveryController.php
│   ├── Requests/
│   │   ├── StoreNewsSourceRequest.php
│   │   └── UpdateNewsSourceRequest.php
│   └── Resources/
│       ├── NewsSourceResource.php
│       ├── NewsItemResource.php
│       └── NewsSourceRunResource.php
├── Models/
│   ├── NewsSource.php
│   ├── NewsSourceRun.php
│   ├── NewsRawItem.php
│   ├── NewsItem.php
│   ├── NewsItemMedia.php
│   ├── NewsItemAiMetadata.php
│   ├── NewsTheme.php
│   ├── NewsCluster.php
│   └── SourceDiscoveryRun.php
├── Services/
│   ├── HttpFetchService.php
│   ├── UrlNormalizerService.php
│   ├── FeedParserService.php
│   ├── FeedQualityScorerService.php
│   ├── SitemapParserService.php       (parser dedicado de sitemap.xml / news-sitemap.xml)
│   ├── ListingDiscoveryService.php    (descoberta por HTML listing — 1ª classe)
│   ├── FieldResolverService.php       (resolução por campo: título, autor, data, corpo, imagem)
│   ├── ArticleExtractorService.php
│   ├── BoilerplateCleanerService.php
│   ├── DateParserService.php
│   ├── SourceDiscoveryService.php
│   └── AiEnrichmentService.php
├── Spiders/
│   ├── GenericDiscoverySpider.php     (orquestra descoberta)
│   └── GenericArticleSpider.php       (orquestra extração, lógica pesada no ArticleExtractorService)
├── Jobs/
│   ├── FetchNewsSourceJob.php
│   ├── ProcessNewsItemJob.php
│   ├── ClassifyNewsItemJob.php        (AI Job 1)
│   └── EnrichNewsItemJob.php          (AI Job 2)
├── Pipelines/                         (RoachPHP Pipelines)
│   ├── DeduplicationPipeline.php
│   ├── BoilerplateCleaningPipeline.php
│   └── PersistencePipeline.php
├── Enums/
│   ├── DiscoveryMode.php
│   ├── FeedQualityProfile.php
│   ├── FetchDetailMode.php            (never, when_incomplete, always)
│   ├── PublishedAtSource.php
│   ├── NewsItemStatus.php
│   ├── ContentSource.php
│   ├── MediaType.php
│   ├── Urgency.php
│   └── SourceType.php
└── routes.php
```

- [ ] Criar todos os diretórios acima
- [ ] Criar o arquivo `routes.php` com rotas prefixadas `/api/v1/news-radar/`
- [ ] Registrar o módulo no `RouteServiceProvider` (ou equivalente)

### 1.3 Migrations (Banco de Dados)

#### 1.3.1 Tabela `news_themes`
- [ ] `id` (bigIncrements)
- [ ] `slug` (string, unique) — Ex: `politica`, `policia`, `esporte`
- [ ] `label` (string) — Ex: "Política", "Polícia"
- [ ] `active` (boolean, default true)
- [ ] timestamps

> **Decisão:** Temas editoriais ficam numa tabela para flexibilidade. O enum PHP valida o output da IA, mas novas categorias (turismo, mobilidade, justiça) são adicionadas pelo painel sem migração.

#### 1.3.2 Tabela `news_sources`
- [ ] `id` (bigIncrements)
- [ ] `name` (string) — Nome do portal
- [ ] `homepage_url` (string, unique)
- [ ] `active` (boolean, default true)
- [ ] `source_type` (enum: portal, prefeitura, blog, agencia, whatsapp)
- [ ] `discovery_mode` (enum: auto, feed, sitemap, html_listing)
- [ ] `feed_quality_profile` (enum: full, partial, teaser_only, nullable)
- [ ] `fetch_detail_mode` (enum: never, when_incomplete, always, default 'when_incomplete') — Determina quando o spider acessa a página HTML do artigo
- [ ] `source_preset` (string, nullable) — Preset sugerido: `html_listing_detail`, `rss_full_with_image_fetch`, `rss_teaser_detail`, `rss_full_clean`, `rss_full_but_noisy`
- [ ] `crawling_config` (json) — Schema expandido com listing_selectors, article_extractors, boilerplate_rules, date_preprocessors, body_stop_text_patterns
- [ ] `throttle_config` (json) — crawl_interval_min, crawl_interval_max, autoadjust_enabled
- [ ] `timezone_default` (string, default 'America/Sao_Paulo')
- [ ] `date_formats` (json, nullable) — Formatos custom por fonte
- [ ] `render_js_required` (boolean, default false)
- [ ] `last_sync_at` (timestamp, nullable)
- [ ] `next_sync_at` (timestamp, nullable)
- [ ] `consecutive_failures` (integer, default 0)
- [ ] `success_rate` (float, default 100)
- [ ] `avg_response_ms` (integer, nullable)
- [ ] `last_items_found` (integer, default 0)
- [ ] `notes` (text, nullable) — Observações do operador
- [ ] timestamps + softDeletes
- [ ] **Índice:** `(next_sync_at, active)` — Para o scheduler filtrar fontes pendentes rapidamente

#### 1.3.3 Tabela `news_source_runs` *(NOVA)*
> Histórico operacional de cada execução. Sem isso, debugging de falhas e o dashboard de saúde ficam superficiais.

- [ ] `id` (bigIncrements)
- [ ] `news_source_id` (foreignId, index)
- [ ] `started_at` (timestamp)
- [ ] `finished_at` (timestamp, nullable)
- [ ] `status` (enum: running, success, partial, failed)
- [ ] `items_found` (integer, default 0)
- [ ] `items_new` (integer, default 0)
- [ ] `items_failed` (integer, default 0)
- [ ] `response_time_avg_ms` (integer, nullable)
- [ ] `error_message` (text, nullable)
- [ ] `meta_json` (json, nullable) — Dados extras de diagnóstico

#### 1.3.4 Tabela `source_discovery_runs` *(NOVA)*
> Persistência do wizard assíncrono. Sem isso, o Step 1–5 fica dependente de cache efêmero sem rastreabilidade.

- [ ] `id` (bigIncrements / uuid)
- [ ] `requested_url` (string)
- [ ] `status` (enum: pending, running, completed, failed)
- [ ] `result_json` (json, nullable) — Feed detectado, sitemap, padrões de URL, score, preview cards
- [ ] `error_message` (text, nullable)
- [ ] `started_at` (timestamp, nullable)
- [ ] `finished_at` (timestamp, nullable)
- [ ] timestamps

#### 1.3.5 Tabela `news_raw_items` *(NOVA)*
> Camada bruta de staging antes do `news_items`. Preserva o dado "como veio" para replay, reprocessamento e comparação.

- [ ] `id` (bigIncrements)
- [ ] `news_source_id` (foreignId, index)
- [ ] `news_source_run_id` (foreignId, nullable, index)
- [ ] `raw_url` (string) — URL original como veio do feed/crawl
- [ ] `normalized_url` (string, index) — URL limpa (sem UTMs)
- [ ] `url_hash` (string, unique, index) — SHA-256 da URL canônica para dedupe rápido
- [ ] `guid` (string, nullable, index) — Identificador auxiliar RSS/WordPress
- [ ] `title_raw` (string, nullable) — Título como veio
- [ ] `body_raw` (longText, nullable) — HTML/texto cru original do feed
- [ ] `raw_payload` (json, nullable) — Todos os campos do item RSS/sitemap como JSON
- [ ] `discovered_at` (timestamp)
- [ ] `processing_status` (enum: pending, processing, promoted, skipped, failed)
- [ ] timestamps

#### 1.3.6 Tabela `news_items`
- [ ] `id` (bigIncrements)
- [ ] `news_source_id` (foreignId)
- [ ] `news_raw_item_id` (foreignId, nullable) — Referência ao item bruto de origem
- [ ] `url` (string) — URL canônica (limpa de UTMs)
- [ ] `url_hash` (string, unique, index) — SHA-256 da URL canônica
- [ ] `raw_url` (string) — URL original como veio
- [ ] `guid` (string, nullable, index) — Identificador auxiliar
- [ ] `title` (string)
- [ ] `subtitle` (string, nullable)
- [ ] `author_raw` (string, nullable) — Texto cru do autor do feed
- [ ] `author_normalized` (string, nullable) — Autor reconciliado
- [ ] `body_html` (longText, nullable) — Corpo em HTML limpo
- [ ] `body_text` (longText, nullable) — Corpo plain text (para IA/indexação)
- [ ] `excerpt` (text, nullable) — Snippet/resumo curto
- [ ] `hero_image_url` (string, nullable) — Imagem principal
- [ ] `categories_raw` (json, nullable) — Array de categorias vindas do feed/HTML
- [ ] `language` (string(5), nullable, default 'pt-BR')
- [ ] `published_at_raw` (string, nullable) — Texto cru da data
- [ ] `published_at_parsed` (timestamp, nullable)
- [ ] `published_at_utc` (timestamp, nullable)
- [ ] `published_at_timezone` (string, nullable)
- [ ] `published_at_source` (enum: rss, jsonld, og_tag, time_tag, text_pattern, manual)
- [ ] `modified_at_raw` (string, nullable)
- [ ] `modified_at_utc` (timestamp, nullable)
- [ ] `extraction_completeness` (integer, default 0) — Score 0–100
- [ ] `content_source` (enum: feed_only, feed_plus_html, html_only)
- [ ] `status` (enum: pending, extracted, enriched_l1, enriched_l2, failed)
- [ ] `is_duplicate_candidate` (boolean, default false)
- [ ] `duplicate_of_news_item_id` (foreignId, nullable) — Aponta para o item original
- [ ] `fetch_attempts` (integer, default 0)
- [ ] `last_fetch_error` (text, nullable)
- [ ] timestamps + softDeletes
- [ ] **Índice:** `(status, published_at_utc)`
- [ ] **Índice:** `(news_source_id, published_at_utc)`

#### 1.3.7 Tabela `news_item_media`
- [ ] `id` (bigIncrements)
- [ ] `news_item_id` (foreignId, index)
- [ ] `type` (enum: hero, gallery, video, embed)
- [ ] `url` (string)
- [ ] `width` (integer, nullable)
- [ ] `height` (integer, nullable)
- [ ] `alt_text` (string, nullable)
- [ ] `position` (integer, default 0)
- [ ] timestamps

#### 1.3.8 Tabela `news_item_ai_metadata`
- [ ] `id` (bigIncrements)
- [ ] `news_item_id` (foreignId, unique)
- [ ] `city` (string, nullable)
- [ ] `state_abbr` (string(2), nullable)
- [ ] `news_theme_id` (foreignId, nullable) — FK para `news_themes`
- [ ] `urgency` (enum: baixa, media, alta, nullable)
- [ ] `relevance_score` (float, nullable)
- [ ] `entities` (json, nullable) — Array de {type, name}
- [ ] `five_ws` (json, nullable) — {who, what, where, when, why, how}
- [ ] `suggested_titles` (json, nullable)
- [ ] `summary_bullets` (json, nullable)
- [ ] `ai_model_used` (string, nullable) — Ex: gpt-4o-mini
- [ ] `ai_tokens_used` (integer, nullable)
- [ ] `enrichment_level` (enum: none, level_1, level_2)
- [ ] timestamps
- [ ] **Índice:** `(news_theme_id, city, urgency)` — Para filtros rápidos no painel

#### 1.3.9 Tabela `news_clusters`
- [ ] `id` (bigIncrements)
- [ ] `label` (string, nullable)
- [ ] timestamps

#### 1.3.10 Tabela pivot `news_cluster_items`
- [ ] `news_cluster_id` (foreignId)
- [ ] `news_item_id` (foreignId)
- [ ] `similarity_score` (float)
- [ ] **Unique composto:** `(news_cluster_id, news_item_id)`

### 1.4 Enums PHP

- [ ] `DiscoveryMode` — auto, feed, sitemap, html_listing
- [ ] `FeedQualityProfile` — full, partial, teaser_only
- [ ] `FetchDetailMode` — never, when_incomplete, always
- [ ] `PublishedAtSource` — rss, jsonld, og_tag, time_tag, text_pattern, manual
- [ ] `NewsItemStatus` — pending, extracted, enriched_l1, enriched_l2, failed
- [ ] `ContentSource` — feed_only, feed_plus_html, html_only
- [ ] `MediaType` — hero, gallery, video, embed
- [ ] `Urgency` — baixa, media, alta
- [ ] `SourceType` — portal, prefeitura, blog, agencia, whatsapp
- [ ] `RawItemStatus` — pending, processing, promoted, skipped, failed
- [ ] `SourceRunStatus` — running, success, partial, failed
- [ ] `DiscoveryRunStatus` — pending, running, completed, failed

### 1.5 Models Eloquent

- [ ] `NewsTheme` — Tabela de temas editáveis. `hasMany(NewsItemAiMetadata)`
- [ ] `NewsSource` — casts JSON, relação `hasMany(NewsItem)`, `hasMany(NewsSourceRun)`, `hasMany(NewsRawItem)`
- [ ] `NewsSourceRun` — relação `belongsTo(NewsSource)`, `hasMany(NewsRawItem)`
- [ ] `SourceDiscoveryRun` — Model independente (wizard async)
- [ ] `NewsRawItem` — relação `belongsTo(NewsSource)`, `belongsTo(NewsSourceRun)`, `hasOne(NewsItem)`
- [ ] `NewsItem` — relações: `belongsTo(NewsSource)`, `belongsTo(NewsRawItem)`, `hasOne(NewsItemAiMetadata)`, `hasMany(NewsItemMedia)`, `belongsToMany(NewsCluster)`, **`belongsTo(NewsItem::class, 'duplicate_of_news_item_id')` (self-reference)**, **`hasMany(NewsItem::class, 'duplicate_of_news_item_id')` (duplicatas reversas)**
- [ ] `NewsItemMedia` — relação `belongsTo(NewsItem)`
- [ ] `NewsItemAiMetadata` — relação `belongsTo(NewsItem)`, `belongsTo(NewsTheme)`
- [ ] `NewsCluster` — relação `belongsToMany(NewsItem)`

---

## Fase 2 — Camada de Serviços Core (Motor de Coleta)

> **Objetivo:** Implementar os serviços fundamentais que vão sustentar os Spiders e os Jobs. Sem UI ainda.
> **Nota:** A inteligência de extração fica nos **Services** (testáveis unitariamente), não nos Spiders. Os Spiders são apenas orquestradores finos.

### 2.1 `UrlNormalizerService`
- [ ] Utilizar `league/uri` para canonicalizar URLs
- [ ] Remover parâmetros UTM (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`)
- [ ] Normalizar trailing slash
- [ ] Forçar HTTPS quando disponível
- [ ] Gerar `url_hash` (SHA-256) para deduplicação rápida

#### Destaque: Schema Oficial do Campo JSON (`crawling_config`)

O coração do extrator adaptável. Schema formalizado com base nos legados (Diarinho, VIPSocial, SCC10, Itapema) para cobrir **listagem com paginação**, **detalhe por campo**, **pré-processamento de datas** e **marcadores de corte**.

```json
{
  "homepage_url": "https://portal.com.br",
  "feed_url": null,
  "sitemap_url": null,
  "relative_url_base": "https://portal.com.br",

  "listing_urls": ["https://portal.com.br/ultimas-noticias"],
  "listing_container_selectors": [".news-list", "main"],
  "listing_item_selectors": [".card-noticia", ".post-item", "article"],
  "listing_link_selectors": ["a"],
  "listing_title_selectors": ["h2", "h1"],
  "listing_image_selectors": ["img"],
  "listing_excerpt_selectors": [".apoio", ".resumo"],
  "next_page_selectors": ["a.next", ".pagination a.next"],
  "listing_max_pages": 3,
  "stop_when_seen_known_urls": true,
  "max_known_urls_before_stop": 10,

  "article_url_patterns": ["/noticias/", "/[0-9]{4}/[0-9]{2}/"],
  "ignore_url_patterns": ["/tag/", "/autor/", "/categoria/", "/videos/"],

  "article_extractors": {
    "title": ["meta[property='og:title']", "h1"],
    "subtitle": ["meta[name='description']", ".subtitle", ".apoio"],
    "author": [".assinatura_interno", ".author", ".box-not-red"],
    "published_at": ["time[datetime]", "meta[property='article:published_time']"],
    "image": ["meta[property='og:image']", ".article-content img:first-child"],
    "body": [".post__content", ".box-not-des", ".materia-conteudo", "article"]
  },

  "image_extraction_strategy": "listing_first_then_og_then_body",

  "body_stop_text_patterns": [
    "O post", "Para mais notícias", "Comente e compartilhe", "siga o"
  ],

  "boilerplate_rules": {
    "remove_selectors": ["style", "script", ".sharedaddy", ".newsletter-box", ".whatsapp-cta", ".post-footer"],
    "remove_text_patterns": [
      "O post .* apareceu primeiro em",
      "Clique aqui e faça parte do nosso grupo"
    ]
  },

  "date_preprocessors": [
    { "type": "replace", "search": "min", "replace": "" },
    { "type": "trim" }
  ],

  "date_formats": ["c", "Y-m-d H:i:s", "d/m/Y H:i", "d/m/Y \\à\\s H:i"]
}
```
### 2.2 `DateParserService`
- [ ] Receber data crua (string) + array de `date_formats` da fonte + `timezone_default`
- [ ] Aplicar **`date_preprocessors`** antes do parse (da config da fonte):
  - [ ] Suportar tipo `replace` (ex: remover "min", "hrs", "às")
  - [ ] Suportar tipo `trim`
  - [ ] Suportar tipo `regex_extract` (para capturar data de dentro de texto misto)
- [ ] Tentar parse na ordem: formatos configurados da fonte → autodetect do Carbon
- [ ] Retornar objeto DTO com: `raw`, `parsed`, `utc`, `timezone`, `source`

### 2.3 `BoilerplateCleanerService`
- [ ] Receber HTML bruto + regras de limpeza (do `crawling_config.boilerplate_rules`)
- [ ] **Regras globais (padrão, sempre ativas):**
  - [ ] Remover `<style>…</style>`, `<script>…</script>`
  - [ ] Remover "O post … apareceu primeiro em …"
  - [ ] Remover CTAs sociais ("Clique aqui e faça parte do nosso grupo")
  - [ ] Remover imagens emoji WordPress (domínio `s.w.org`)
  - [ ] Remover blocos CTA editoriais ("Comente e compartilhe")
  - [ ] Decode HTML entities, normalizar quebras de linha
- [ ] **Regras por fonte (editáveis no painel):**
  - [ ] `remove_selectors` — seletores CSS para remover nós inteiros
  - [ ] `remove_text_patterns` — regex para remover parágrafos com matches

### 2.4 `FeedParserService`
- [ ] Utilizar **SimplePie** para parsear RSS/Atom (namespaces, `dc:creator`, `content:encoded`)
- [ ] Extrair campos na ordem de prioridade:
  - [ ] Título: `title`
  - [ ] Autor: `dc:creator` → `creator`
  - [ ] Data: `isoDate` → `pubDate`
  - [ ] Resumo: `contentSnippet` → `content:encodedSnippet` → `content`
  - [ ] Corpo: `content:encoded` → `content` → vazio
  - [ ] Tags: `categories`
  - [ ] Identificador: `guid` (auxiliar, nunca como URL)
  - [ ] URL: `link` (normalizado via `UrlNormalizerService`)
- [ ] Salvar `author_raw` separado
- [ ] Extrair imagens do HTML do `content:encoded`:
  - [ ] Ignorar domínios de emoji (`s.w.org`, similares)
  - [ ] Preferir imagem com maior `width` no `srcset`
  - [ ] Separar `hero_image` de `gallery_images[]`
- [ ] Retornar array de DTOs (Value Objects) para criação do `NewsRawItem`

### 2.5 `FeedQualityScorerService`
- [ ] Receber array de 3–5 itens parseados do feed
- [ ] Calcular score de completude:
  - [ ] `title` presente = +20
  - [ ] `link` presente = +20
  - [ ] `isoDate`/`pubDate` presente = +15
  - [ ] `content:encoded` > 600 chars = +20
  - [ ] Imagem detectável = +10
  - [ ] Autor presente = +5
  - [ ] Categorias presentes = +5
  - [ ] Teaser limpo (snippet) = +5
- [ ] Resultado: score 80+ → `full` | 50–79 → `partial` | <50 → `teaser_only`
- [ ] Detectar flags: `wordpress_like`, `has_inline_images`, `has_gallery`, `has_boilerplate`, `has_categories`

### 2.6 `SitemapParserService` *(NOVO)*
> Sitemap tem comportamento próprio: index, lastmod, news sitemap. Merece tratamento dedicado.

- [ ] Receber URL do sitemap (configurável ou autodescoberto)
- [ ] Detectar tipo: **Sitemap Index** vs **Sitemap simples** vs **News Sitemap**
  - [ ] Se Index → percorrer sitemaps filhos recursivamente
- [ ] Extrair `<loc>` (URL do artigo) e `<lastmod>` (data de modificação)
- [ ] Para News Sitemaps: extrair `<news:title>`, `<news:publication_date>`, `<news:keywords>`
- [ ] Aplicar `article_url_patterns` e `ignore_url_patterns` para filtrar
- [ ] Normalizar todas as URLs via `UrlNormalizerService`
- [ ] Retornar array de DTOs ordenados por `lastmod` (mais recentes primeiro)

### 2.7 `ListingDiscoveryService` *(NOVO — 1ª classe)*
> Tratamento operacional completo para portais sem RSS (Ex: Diarinho, VIPSocial). Caso de primeira classe, não fallback.

- [ ] Receber `listing_urls` + seletores de listagem da config da fonte
- [ ] Para cada URL de listagem:
  - [ ] Abrir via `HttpFetchService`
  - [ ] Localizar container via `listing_container_selectors` (ex: `.news-list`, `main`)
  - [ ] Extrair cards de notícia via `listing_item_selectors` (ex: `.card-noticia`, `article`)
  - [ ] Para cada card, extrair:
    - [ ] Link → `listing_link_selectors` (com resolução de URLs relativas via `relative_url_base`)
    - [ ] Título prévio → `listing_title_selectors`
    - [ ] Imagem prévia → `listing_image_selectors` (com resolução de URLs relativas)
    - [ ] Excerpt prévio → `listing_excerpt_selectors`
- [ ] Normalizar todas as URLs via `UrlNormalizerService`
- [ ] Aplicar filtros `article_url_patterns` e `ignore_url_patterns`
- [ ] Deduplicar links dentro da própria listagem
- [ ] **Paginação automática:**
  - [ ] Detectar link de próxima página via `next_page_selectors` (ex: `a.next`, `.pagination a.next`)
  - [ ] Seguir até `listing_max_pages` (padrão: 3)
  - [ ] **Parada inteligente:** Se `stop_when_seen_known_urls = true`, parar após encontrar `max_known_urls_before_stop` URLs que já existem no banco (evita re-crawling desnecessário)
- [ ] Retornar array de candidatos de notícia (DTOs)

### 2.8 `FieldResolverService` *(NOVO)*
> Cada campo da notícia pode vir de fontes diferentes (listing, feed, detalhe HTML, JSON-LD, OG). Este service centraliza a resolução, evitando lógica espalhada pelos spiders.

- [ ] `resolveTitle(listingData, feedData, articleData)` — Prioridade: articleJSON-LD > article OG > article H1 > feed title > listing title
- [ ] `resolveSubtitle(feedData, articleData)` — Prioridade: article meta description > articleJSON-LD description > feed snippet
- [ ] `resolveAuthor(feedData, articleData)` — Prioridade: `dc:creator` > articleJSON-LD author > article selector > feed creator
- [ ] `resolvePublishedAt(feedData, articleData, config)` — Aplica `DateParserService` com `date_preprocessors`. Prioridade: articleJSON-LD datePublished > article `<time>` > article OG article:published_time > feed isoDate > feed pubDate > text_pattern
- [ ] `resolveBody(feedData, articleData, config)` — Prioridade: article body selector (limpo) > feed `content:encoded`. Aplica `body_stop_text_patterns` para cortar conteúdo após marcadores de encerramento
- [ ] `resolveHeroImage(listingData, feedData, articleData, config)` — Aplica `image_extraction_strategy`:
  - [ ] `listing_first_then_og_then_body` (padrão para VIPSocial/Diarinho)
  - [ ] `og_first_then_body` (padrão para Itapema/Correio)
  - [ ] `body_only` (casos raros)
- [ ] `resolveCategories(feedData, articleData)` — Merge de tags do feed (`categories`) com meta keywords + seletores do artigo. Normalizar strings (lowercase, trim)
- [ ] **Merge final:** Preencher campos faltantes usando fontes de prioridade inferior. Registrar a `source` de cada campo resolvido (para auditoria)

### 2.9 `ArticleExtractorService`
- [ ] Receber HTML da página + configuração de `article_extractors` da fonte
- [ ] Implementar extração em camadas (A → B → C → D → E):
  - [ ] **Camada A:** Parse JSON-LD (`schema.org/NewsArticle`)
  - [ ] **Camada B:** Parse Open Graph meta tags
  - [ ] **Camada C:** Parse HTML semântico com seletores CSS do banco (via `symfony/css-selector`)
  - [ ] **Camada D:** Aplicar `BoilerplateCleanerService` + `body_stop_text_patterns` ao corpo
  - [ ] **Camada E:** Aplicar seletores custom (override por fonte)
- [ ] Suportar extração de corpo por **container + marcador de parada** (ex: `.post__content` até "Para mais notícias")
- [ ] Suportar iteração em siblings quando corpo não vem num único container (caso Diarinho)
- [ ] Calcular `extraction_completeness` (score 0–100)
- [ ] Delegar resolução final de campos ao `FieldResolverService`

### 2.10 `HttpFetchService`
- [ ] Wrapper **unificado** do Guzzle, reaproveitado tanto no onboarding quanto nos spiders
- [ ] Configurar via **Roach Downloader Middleware** (não criar pilha paralela):
  - [ ] Throttle por host (delay configurável)
  - [ ] Retry com backoff exponencial (429, 500, timeout)
  - [ ] User-Agent (rotação ou fixo por fonte)
  - [ ] Headers custom por fonte (Accept-Language, etc.)
- [ ] Suporte a concorrência via Promises (pool de requests)
- [ ] Métricas: medir `response_time_ms` por request (alimenta `news_source_runs`)

---

## Fase 3 — Spiders e Jobs (Orquestração de Crawling)

> **Objetivo:** Conectar os serviços da Fase 2 em um pipeline executável via filas do Laravel/Horizon.
> **Princípio:** Spiders são orquestradores finos. A inteligência pesada fica nos Services.

### 3.1 `GenericDiscoverySpider` (RoachPHP)
- [ ] Receber configuração da `NewsSource` (injetada via construtor/contexto)
- [ ] Decidir estratégia baseado no `discovery_mode` — **delegar sempre ao service especializado:**
  - [ ] `feed` → Delegar ao `FeedParserService` (SimplePie)
  - [ ] `sitemap` → Delegar ao `SitemapParserService` (index, lastmod, news sitemap)
  - [ ] `html_listing` → Delegar ao `ListingDiscoveryService` (paginação, parada inteligente)
  - [ ] `auto` → Tentar feed → sitemap → listing (nessa ordem, parar no primeiro que retornar resultados)
- [ ] Para cada URL encontrada: normalizar via `UrlNormalizerService`, verificar `url_hash` no banco
- [ ] Emitir itens novos para o `PersistencePipeline` → Criar `NewsRawItem` com status `pending`

### 3.2 `GenericArticleSpider` (RoachPHP) — Orquestrador fino
- [ ] Receber `NewsRawItem` com `processing_status=pending` + configuração da `NewsSource`
- [ ] **A regra final de busca é `fetch_detail_mode`** (não `feed_quality_profile`, que vira apenas diagnóstico):
  - [ ] `never` → Promover direto do `raw_payload` sem fetch externo. Ideal para feeds completos de prefeitura onde corpo + imagem já vieram. O `FieldResolverService` resolve campos apenas do feed.
  - [ ] `when_incomplete` → Usar `FieldResolverService` para verificar completude. Se body, hero_image ou author faltarem → buscar HTML via `HttpFetchService`. Se já completo → pular fetch (ex: Itapema, Correio Catarin.)
  - [ ] `always` → Sempre buscar HTML do artigo, independente do que veio no feed (ex: Diarinho, VIPSocial, SCC10, qualquer `html_listing`)
  - [ ] Se `render_js_required=true` → usar Panther (Headless Browser) em vez de Guzzle
- [ ] Passar HTML para `ArticleExtractorService`
- [ ] Usar `FieldResolverService` para **merge final** de dados do listing + feed + detalhe HTML
- [ ] Emitir item processado para pipelines de limpeza e persistência
- [ ] Promover `NewsRawItem` → `NewsItem`, registrar `content_source` (feed_only, feed_plus_html, html_only)

### 3.3 RoachPHP Pipelines
- [ ] `DeduplicationPipeline` — Verifica `url_hash` no banco, descarta duplicatas
- [ ] `BoilerplateCleaningPipeline` — Aplica `BoilerplateCleanerService`
- [ ] `PersistencePipeline` — Salva/atualiza `NewsRawItem` e `NewsItem` + `NewsItemMedia`

### 3.4 `FetchNewsSourceJob` (Laravel Job)
- [ ] Disparado pelo Scheduler conforme `throttle_config` de cada fonte ativa
- [ ] **Criar `NewsSourceRun`** (status: running, started_at: now)
- [ ] Verificar `consecutive_failures` (Circuit Breaker: pausar se > N)
- [ ] Executar `GenericDiscoverySpider` para a fonte
- [ ] Para cada item novo encontrado: disparar `ProcessNewsItemJob`
- [ ] **Finalizar `NewsSourceRun`** (items_found, items_new, response_time_avg_ms, status)
- [ ] Atualizar `NewsSource`: `last_sync_at`, `success_rate`, `avg_response_ms`, `last_items_found`, `next_sync_at`
- [ ] Em caso de erro: incrementar `consecutive_failures`, salvar `error_message` no run

### 3.5 `ProcessNewsItemJob` (Laravel Job)
- [ ] Receber `NewsRawItem` pendente
- [ ] Executar `GenericArticleSpider` para extração → promover para `NewsItem`
- [ ] Após sucesso: atualizar `status` para `extracted`, incrementar `fetch_attempts`
- [ ] Disparar `ClassifyNewsItemJob` (AI Job 1)
- [ ] Em caso de erro: salvar `last_fetch_error`, incrementar `fetch_attempts`

### 3.6 Scheduler (Console Kernel)
- [ ] Comando artisan `news-radar:dispatch-sources`
  - [ ] Percorre `NewsSource` ativas onde `now >= next_sync_at`
  - [ ] Enfileira `FetchNewsSourceJob`
  - [ ] Roda a cada 1 minuto (o comando respeita o throttle interno de cada fonte)
- [ ] Comando artisan `news-radar:health-check`
  - [ ] Relatório de fontes com `consecutive_failures >= 5`
  - [ ] Roda a cada 1 hora

---

## Fase 4 — Onboarding Inteligente de Fontes (Wizard + API)

> **Objetivo:** Criar o "Wizard" de cadastro de fonte no backend. O `spatie/crawler` é usado aqui para discovery e validação, nunca como extrator principal de matéria.

### 4.1 `SourceDiscoveryService`
- [ ] Método `discover(string $url)`:
  - [ ] Criar registro `SourceDiscoveryRun` (status: running)
  - [ ] Usar `spatie/crawler` para navegar a homepage
  - [ ] Detectar `<link rel="alternate" type="application/rss+xml">`
  - [ ] Tentar acessar `/sitemap.xml`, `/news-sitemap.xml` via `SitemapParserService`
  - [ ] Coletar links `<a href>` da homepage
  - [ ] Identificar padrões de URL de artigo
  - [ ] Detectar possíveis `listing_container_selectors` automaticamente
  - [ ] Detectar se o site precisa de JS (resposta vazia / `<div id="app">`)
  - [ ] Salvar resultado em `SourceDiscoveryRun.result_json`
- [ ] Método `analyzeFeed(string $feedUrl)`:
  - [ ] Parsear 5 itens com `FeedParserService` (SimplePie)
  - [ ] Calcular `FeedQualityScore`
  - [ ] Detectar boilerplates, retornar diagnóstico completo
- [ ] Método `previewArticles(string $mode, string $url, int $count = 3)` — **Genérico, funciona com e sem feed:**
  - [ ] Se `mode=feed` → Parsear feed, extrair primeiros N itens, usar `ArticleExtractorService` + `FieldResolverService`
  - [ ] Se `mode=html_listing` → Usar `ListingDiscoveryService` para extrair N cards da listagem, buscar detalhe do primeiro para preview completo
  - [ ] Retornar cards de preview unificados para o frontend (título, imagem, data, excerpt, score de completude)

### 4.2 `SourceDiscoveryController`
- [ ] `POST /api/v1/news-radar/sources/discover` — Recebe `url`, cria `SourceDiscoveryRun`, dispara discovery async, retorna run ID
- [ ] `GET /api/v1/news-radar/sources/discover/{runId}/status` — Retorna progresso e resultado do discovery
- [ ] `POST /api/v1/news-radar/sources/preview` — **Genérico:** Recebe `mode` (feed|html_listing) + `url` (feed_url ou listing_url), retorna 3 cards de preview
- [ ] `POST /api/v1/news-radar/sources/test-selector` — Recebe `url` + `selector`, retorna conteúdo extraído

### 4.3 `NewsSourceController` (CRUD)
- [ ] `GET    /api/v1/news-radar/sources` — Listar fontes (com filtros: active, profile, failures, source_type)
- [ ] `POST   /api/v1/news-radar/sources` — Criar nova fonte
- [ ] `GET    /api/v1/news-radar/sources/{id}` — Detalhes da fonte (com métricas + últimos runs)
- [ ] `PUT    /api/v1/news-radar/sources/{id}` — Atualizar configuração
- [ ] `DELETE /api/v1/news-radar/sources/{id}` — Desativar (soft delete)
- [ ] `POST   /api/v1/news-radar/sources/{id}/sync` — Forçar sync manual imediato
- [ ] `GET    /api/v1/news-radar/sources/{id}/runs` — Histórico de execuções

### 4.4 `NewsItemController` (Leitura)
- [ ] `GET /api/v1/news-radar/items` — Listar notícias (filtros: source, theme, city, date_range, status, urgency)
- [ ] `GET /api/v1/news-radar/items/{id}` — Detalhe (com AI metadata, media, cluster)
- [ ] `GET /api/v1/news-radar/items/{id}/related` — Notícias relacionadas (embeddings/cluster)
- [ ] `GET /api/v1/news-radar/dashboard` — Resumo: totais por fonte, por tema, alertas de fontes com falha

---

## Fase 5 — Inteligência Artificial e Enriquecimento

> **Objetivo:** Implementar os dois Jobs de IA e o sistema de Embeddings/Clusters.
> **Nota técnica:** Na API atual da OpenAI, Structured Outputs na Responses API usa `text.format` (não o antigo `response_format` do Chat Completions). A documentação oficial da OpenAI é a fonte de verdade para o contrato, não o pacote `openai-php/laravel`.

### 5.1 `AiEnrichmentService`
- [ ] Configurar client `openai-php/laravel` (API key, model default)
- [ ] Método `classifyBasic(NewsItem $item)` — **Job 1 (ClassifyNewsItemJob)**
  - [ ] Montar prompt com título + excerpt + primeiros 2000 chars do `body_text`
  - [ ] Enviar via Responses API com JSON Schema estrito (`text.format`):
    - [ ] `city`, `state_abbr`, `theme` (string validada contra `news_themes`), `urgency` (enum), `relevance_score`, `entities[]`
  - [ ] Salvar resultado em `news_item_ai_metadata` (nível `level_1`)
  - [ ] Se `relevance_score >= 0.7` → disparar Job 2
- [ ] Método `enrichEditorial(NewsItem $item)` — **Job 2 (EnrichNewsItemJob)**
  - [ ] Montar prompt expandido para 5W1H
  - [ ] JSON Schema: `five_ws{}`, `suggested_titles[]`, `summary_bullets[]`
  - [ ] Atualizar `news_item_ai_metadata` com nível `level_2`

### 5.2 `ClassifyNewsItemJob` (AI Job 1)
- [ ] Receber `NewsItem` com `status=extracted`
- [ ] Chamar `AiEnrichmentService::classifyBasic()`
- [ ] Atualizar `status` para `enriched_l1`
- [ ] Se relevância alta → disparar `EnrichNewsItemJob`

### 5.3 `EnrichNewsItemJob` (AI Job 2)
- [ ] Receber `NewsItem` com `status=enriched_l1`
- [ ] Chamar `AiEnrichmentService::enrichEditorial()`
- [ ] Atualizar `status` para `enriched_l2`

### 5.4 Embeddings e Clusterização *(v2 — Fase futura)*
- [ ] Gerar embedding via API OpenAI (`text-embedding-3-small`)
  - [ ] Input: `title` + `excerpt` + primeiros 1000–2000 chars limpos
- [ ] Armazenar vetor (PgVector/Redis ou tabela dedicada)
- [ ] Ao inserir novo item: comparar embedding com últimas 48h
  - [ ] Cosine Similarity > 0.85 → criar/vincular `NewsCluster`
- [ ] API de "notícias relacionadas" consulta por proximidade vetorial

### 5.5 Batch API para Reprocessamento Histórico *(v2 — Fase futura)*
- [ ] Comando artisan `news-radar:batch-enrich` — Exporta JSONL
- [ ] Enviar via Batch API da OpenAI
- [ ] Importar resultados quando completo

---

## Fase 6 — Frontend (Painel Administrativo React)

> **Objetivo:** Criar as telas no SPA React para gerenciamento de fontes e visualização de notícias.

### 6.1 Services & Types (TypeScript)
- [ ] Criar `newsRadar.service.ts` com interfaces e chamadas API
- [ ] Definir tipos: `NewsSource`, `NewsItem`, `NewsRawItem`, `AiMetadata`, `DiscoveryResult`, `PreviewCard`, `SourceRun`

### 6.2 Página: Listagem de Fontes (`/radar/fontes`)
- [ ] Tabela: Nome, Tipo, Perfil, Status, Último Sync, Falhas, Taxa Sucesso
- [ ] Badges visuais por `feed_quality_profile` (Full ✅, Noisy ⚠️, Teaser 🔍)
- [ ] Indicador de saúde (verde/amarelo/vermelho via `consecutive_failures`)
- [ ] Ações: Editar, Sync Manual, Ver Histórico de Runs, Desativar

### 6.3 Página: Wizard Nova Fonte (`/radar/fontes/nova`)
- [ ] **Step 1:** Input da URL + botão "Analisar"
- [ ] **Step 2:** Diagnóstico automático (Feed? Qualidade? Boilerplates? JS?)
- [ ] **Step 3:** Preview de 3 cards de matérias reais
- [ ] **Step 4:** Ajuste fino (seletores CSS, regras de limpeza, exclusões de URL)
- [ ] **Step 5:** Periodicidade sugerida (com override manual)
- [ ] **Step 6:** Confirmação e salvamento

### 6.4 Página: Edição da Fonte (`/radar/fontes/:id/editar`)
- [ ] Formulário com todos os campos da fonte
- [ ] Editor de `crawling_config` (seletores, boilerplate rules)
- [ ] Botão "Testar Seletor" (chama API `/test-selector`)
- [ ] Tabela de últimos 10 runs (com status, itens encontrados, erros)

### 6.5 Página: Feed de Notícias (`/radar/noticias`)
- [ ] Lista/Grid de notícias (cards com imagem, título, fonte, data, tema)
- [ ] Filtros: Fonte, Tema, Cidade, Período, Status, Urgência
- [ ] Busca por texto, Ordenação: mais recentes / mais relevantes

### 6.6 Página: Detalhe da Notícia (`/radar/noticias/:id`)
- [ ] Corpo renderizado, AI Metadata (cidade, tema, urgência, 5W1H)
- [ ] Galeria de imagens, "Notícias Relacionadas" (cluster), Link fonte original

### 6.7 Página: Dashboard do Radar (`/radar`)
- [ ] Totais: notícias hoje, esta semana, este mês
- [ ] Gráficos por tema e por fonte
- [ ] Alertas: fontes com falha, fontes inativas
- [ ] Últimas notícias de alta urgência/relevância

---

## Fase 7 — Testes e Qualidade

### 7.1 Testes Unitários
- [ ] `UrlNormalizerServiceTest` — UTMs, trailing slash, https, URLs relativas com `relative_url_base`
- [ ] `FeedParserServiceTest` — Fixtures de feeds reais (Mesorregional, SCC10, Itapema, Léo Nunes, SCMais)
- [ ] `FeedQualityScorerServiceTest` — Scores corretos para cada perfil (full, partial, teaser)
- [ ] `SitemapParserServiceTest` — Sitemap index, news sitemap, lastmod filtering
- [ ] `ListingDiscoveryServiceTest` — Extração de cards, URLs relativas, filtros, paginação, parada inteligente
- [ ] `FieldResolverServiceTest` — Merge de campos: listing+feed+detalhe em cada perfil de captura (HTML-only, RSS full, RSS teaser)
- [ ] `BoilerplateCleanerServiceTest` — Remoção de style, CTAs, rodapé WP, emojis, stop markers
- [ ] `DateParserServiceTest` — Formatos variados + timezones + fallbacks + `date_preprocessors` (replace, trim, regex_extract)
- [ ] `ArticleExtractorServiceTest` — Camadas A→E com HTML fixtures, body stop markers, sibling iteration

### 7.2 Testes de Feature (API)
- [ ] CRUD de `NewsSource`
- [ ] Discovery + SourceDiscoveryRun
- [ ] Preview endpoint (para `mode=feed` e `mode=html_listing`)
- [ ] Listagem de `NewsItem` com filtros
- [ ] Dashboard endpoint
- [ ] Histórico de `NewsSourceRun`

### 7.3 Testes do Spider/Pipeline
- [ ] RoachPHP helpers de teste para spiders
- [ ] Fixtures HTML simulando portais (com e sem JSON-LD, com e sem OG, com listagem HTML)
- [ ] Testar fluxo completo: `NewsRawItem` → `NewsItem` (promoção) com cada `fetch_detail_mode` (never, when_incomplete, always)

---

## Fase 8 — Operação e Monitoramento (Pós-Deploy)

### 8.1 Workers & Filas
- [ ] Fila dedicada `news-radar` no `queue.php`
- [ ] Workers no Horizon/Supervisor para a fila `news-radar`
- [ ] Timeout adequado dos jobs (discovery pode ser lento)

### 8.2 Monitoramento
- [ ] Log estruturado por fonte (channel dedicado `news-radar`)
- [ ] Alerta quando `consecutive_failures >= 5`
- [ ] Alerta quando nenhuma notícia nova em 24h para fonte ativa
- [ ] Dashboard de saúde baseado em `news_source_runs`

### 8.3 Circuit Breaker
- [ ] Após N falhas consecutivas: marcar fonte como `active=false`
- [ ] Notificar operador via painel (badge de alerta)
- [ ] Botão "Reativar e testar agora"

---

## Ordem de Execução Recomendada

```
Fase 1 (Fundação)           ███░░░░░░░  ~2–3 dias
  ↓
Fase 2 (Serviços Core)      ██████░░░░  ~4–5 dias
  ↓
Fase 3 (Spiders/Jobs)       ████░░░░░░  ~3–4 dias
  ↓
Fase 4 (Onboarding API)     ████░░░░░░  ~3–4 dias
  ↓
Fase 6 (Frontend)            ██████░░░░  ~4–5 dias  ← pode iniciar paralelo à Fase 4
  ↓
Fase 5 (IA)                  ████░░░░░░  ~3–4 dias  ← após Fase 3 funcional
  ↓
Fase 7 (Testes)              ███░░░░░░░  ~2–3 dias  ← contínuo durante as fases
  ↓
Fase 8 (Operação)            ██░░░░░░░░  ~1–2 dias
```

**Estimativa total: ~22–30 dias de desenvolvimento** (1 desenvolvedor full-time).
