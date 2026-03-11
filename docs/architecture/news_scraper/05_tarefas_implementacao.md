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

- [x] `roach-php/laravel` — Motor de crawling/spiders (já inclui `symfony/dom-crawler`)
- [x] `symfony/css-selector` — **Obrigatório.** Habilitar seletores CSS no DomCrawler e no editor visual do painel
- [x] `simplepie/simplepie` — Parser dedicado de RSS/Atom com suporte nativo a namespaces (`dc:creator`, `content:encoded`)
- [x] `spatie/crawler` — Descoberta de links (onboarding wizard)
- [x] `league/uri` — Normalização/canonicalização de URLs
- [x] `openai-php/laravel` — Adaptador para a API OpenAI (Structured Outputs via Responses API)
- [x] Verificar se `guzzlehttp/guzzle`, `nesbot/carbon` já estão no `composer.json` (normalmente sim no Laravel)

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

- [x] Criar todos os diretórios acima
- [x] Criar o arquivo `routes.php` com rotas prefixadas `/api/v1/news-radar/`
- [x] Registrar o módulo no `RouteServiceProvider` (ou equivalente)

### 1.3 Migrations (Banco de Dados)

#### 1.3.1 Tabela `news_themes`
- [x] `id` (bigIncrements)
- [x] `slug` (string, unique) — Ex: `politica`, `policia`, `esporte`
- [x] `label` (string) — Ex: "Política", "Polícia"
- [x] `active` (boolean, default true)
- [x] timestamps

> **Decisão:** Temas editoriais ficam numa tabela para flexibilidade. O enum PHP valida o output da IA, mas novas categorias (turismo, mobilidade, justiça) são adicionadas pelo painel sem migração.

#### 1.3.2 Tabela `news_sources`
- [x] `id` (bigIncrements)
- [x] `name` (string) — Nome do portal
- [x] `homepage_url` (string, unique)
- [x] `active` (boolean, default true)
- [x] `source_type` (enum: portal, prefeitura, blog, agencia, whatsapp)
- [x] `discovery_mode` (enum: auto, feed, sitemap, html_listing)
- [x] `feed_quality_profile` (enum: full, partial, teaser_only, nullable)
- [x] `fetch_detail_mode` (enum: never, when_incomplete, always, default 'when_incomplete') — Determina quando o spider acessa a página HTML do artigo
- [x] `source_preset` (string, nullable) — Preset sugerido: `html_listing_detail`, `rss_full_with_image_fetch`, `rss_teaser_detail`, `rss_full_clean`, `rss_full_but_noisy`
- [x] `crawling_config` (json) — Schema versionado com listing_selectors, article_extractors, boilerplate_rules, date_preprocessors, body_stop_text_patterns
- [x] `throttle_config` (json) — crawl_interval_min, crawl_interval_max, autoadjust_enabled
- [x] `timezone_default` (string, default 'America/Sao_Paulo')
- [x] `date_formats` (json, nullable) — Formatos custom por fonte
- [x] `render_js_required` (boolean, default false)
- [x] `last_sync_at` (timestamp, nullable)
- [x] `next_sync_at` (timestamp, nullable)
- [x] `sync_locked_until` (timestamp, nullable) — **Trava de concorrência.** Impede dispatch paralelo da mesma fonte. Job seta ao iniciar, limpa ao finalizar. Scheduler ignora fontes com lock ativo.
- [x] `consecutive_failures` (integer, default 0)
- [x] `success_rate` (float, default 100)
- [x] `avg_response_ms` (integer, nullable)
- [x] `last_items_found` (integer, default 0)
- [x] `notes` (text, nullable) — Observações do operador
- [x] timestamps + softDeletes
- [x] **Índice:** `(next_sync_at, active)` — Para o scheduler filtrar fontes pendentes rapidamente

#### 1.3.3 Tabela `news_source_runs` *(NOVA)*
> Histórico operacional de cada execução. Sem isso, debugging de falhas e o dashboard de saúde ficam superficiais.

- [x] `id` (bigIncrements)
- [x] `news_source_id` (foreignId, index)
- [x] `started_at` (timestamp)
- [x] `finished_at` (timestamp, nullable)
- [x] `status` (enum: running, success, partial, failed)
- [x] `items_found` (integer, default 0)
- [x] `items_new` (integer, default 0)
- [x] `items_failed` (integer, default 0)
- [x] `response_time_avg_ms` (integer, nullable)
- [x] `error_message` (text, nullable)
- [x] `meta_json` (json, nullable) — Dados extras de diagnóstico

#### 1.3.4 Tabela `source_discovery_runs` *(NOVA)*
> Persistência do wizard assíncrono. Sem isso, o Step 1–5 fica dependente de cache efêmero sem rastreabilidade.

- [x] `id` (**uuid**) — UUID para evitar enumeração fácil e facilitar polling assíncrono no frontend
- [x] `requested_url` (string)
- [x] `status` (enum: pending, running, completed, failed)
- [x] `result_json` (json, nullable) — Feed detectado, sitemap, padrões de URL, score, preview cards
- [x] `selector_test_snapshots` (json, nullable) — Array de snapshots dos testes de seletor: `[{url, selector, result_preview, tested_at}]`. Facilita debug de "por que quebrou?"
- [x] `error_message` (text, nullable)
- [x] `started_at` (timestamp, nullable)
- [x] `finished_at` (timestamp, nullable)
- [x] timestamps

#### 1.3.5 Tabela `news_raw_items` *(NOVA)*
> Camada bruta de staging antes do `news_items`. Preserva o dado "como veio" para replay, reprocessamento e comparação.
> **Modelo canônico único (Modelo 1):** Cada URL existe uma única vez por fonte. O registro é atualizado a cada execução que a encontra.

- [x] `id` (bigIncrements)
- [x] `news_source_id` (foreignId, index)
- [x] `news_source_run_id` (foreignId, nullable, index) — Run que **primeiro** descobriu este item
- [x] `last_seen_run_id` (foreignId, nullable) — Run que **mais recentemente** viu este item
- [x] `raw_url` (string) — URL original como veio do feed/crawl
- [x] `normalized_url` (string, index) — URL limpa (sem UTMs)
- [x] `url_hash` (string, index) — SHA-256 da URL canônica
- [x] `guid` (string, nullable, index) — Identificador auxiliar RSS/WordPress
- [x] `title_raw` (string, nullable) — Título como veio
- [x] `body_raw` (longText, nullable) — HTML/texto cru original do feed
- [x] `raw_payload` (json, nullable) — Todos os campos do item RSS/sitemap como JSON
- [x] `first_seen_at` (timestamp) — Quando esta URL apareceu pela primeira vez
- [x] `last_seen_at` (timestamp) — Última vez que a URL foi vista num crawl
- [x] `seen_count` (integer, default 1) — Quantas vezes este item foi visto (para heurísticas)
- [x] `processing_status` (enum: pending, processing, promoted, skipped, failed)
- [x] `fetch_attempts` (integer, default 0) — **Fica aqui, não no NewsItem.** Erro pré-promoção é rastreado aqui.
- [x] `last_fetch_error` (text, nullable) — Se falhou antes de virar NewsItem, o erro fica aqui.
- [x] `last_fetch_at` (timestamp, nullable)
- [x] timestamps
- [x] **Unique composto:** `(news_source_id, url_hash)` — Modelo canônico: uma URL por fonte

#### 1.3.6 Tabela `news_items`
- [x] `id` (bigIncrements)
- [x] `news_source_id` (foreignId)
- [x] `news_raw_item_id` (foreignId, nullable) — Referência ao item bruto de origem
- [x] `url` (string) — URL canônica (limpa de UTMs)
- [x] `url_hash` (string, unique, index) — SHA-256 da URL canônica
- [x] `raw_url` (string) — URL original como veio
- [x] `guid` (string, nullable, index) — Identificador auxiliar
- [x] `title` (string)
- [x] `subtitle` (string, nullable)
- [x] `author_raw` (string, nullable) — Texto cru do autor do feed
- [x] `author_normalized` (string, nullable) — Autor reconciliado
- [x] `body_html` (longText, nullable) — Corpo em HTML limpo
- [x] `body_text` (longText, nullable) — Corpo plain text (para IA/indexação)
- [x] `excerpt` (text, nullable) — Snippet/resumo curto
- [x] `hero_image_url` (string, nullable) — Imagem principal
- [x] `categories_raw` (json, nullable) — Array de categorias vindas do feed/HTML
- [x] `language` (string(5), nullable, default 'pt-BR')
- [x] `published_at_raw` (string, nullable) — Texto cru da data
- [x] `published_at_parsed` (timestamp, nullable)
- [x] `published_at_utc` (timestamp, nullable)
- [x] `published_at_timezone` (string, nullable)
- [x] `published_at_source` (enum: rss, jsonld, og_tag, time_tag, text_pattern, manual)
- [x] `modified_at_raw` (string, nullable)
- [x] `modified_at_utc` (timestamp, nullable)
- [x] `extraction_completeness` (integer, default 0) — Score 0–100
- [x] `content_source` (enum: feed_only, feed_plus_html, html_only)
- [x] `extraction_status` (enum: pending, extracted, extraction_failed) — **Separado de IA.** Rastreia apenas o resultado da extração/promoção.
- [x] `enrichment_status` (enum: none, enriched_l1, enriched_l2, enrichment_failed) — **Separado de extração.** Rastreia apenas o resultado do enriquecimento de IA.
- [x] `is_duplicate_candidate` (boolean, default false)
- [x] `duplicate_of_news_item_id` (foreignId, nullable) — Aponta para o item original
- [x] timestamps + softDeletes
- [x] **Índice:** `(extraction_status, enrichment_status, published_at_utc)` — Para filtros rápidos no painel
- [x] **Índice:** `(news_source_id, published_at_utc)`

> **Decisão (Lifecycle):** `fetch_attempts` e `last_fetch_error` ficam no `NewsRawItem` porque erros de fetch/extração acontecem **antes** da promoção para `NewsItem`. Se o fetch falha, não existe `NewsItem` para armazenar o erro. O `NewsItem` só registra status pós-promoção.

#### 1.3.7 Tabela `news_item_media`
- [x] `id` (bigIncrements)
- [x] `news_item_id` (foreignId, index)
- [x] `type` (enum: hero, gallery, video, embed)
- [x] `url` (string)
- [x] `width` (integer, nullable)
- [x] `height` (integer, nullable)
- [x] `alt_text` (string, nullable)
- [x] `position` (integer, default 0)
- [x] timestamps

#### 1.3.8 Tabela `news_item_ai_metadata`
- [x] `id` (bigIncrements)
- [x] `news_item_id` (foreignId, unique)
- [x] `city` (string, nullable)
- [x] `state_abbr` (string(2), nullable)
- [x] `news_theme_id` (foreignId, nullable) — FK para `news_themes`
- [x] `urgency` (enum: baixa, media, alta, nullable)
- [x] `relevance_score` (float, nullable)
- [x] `entities` (json, nullable) — Array de {type, name}
- [x] `five_ws` (json, nullable) — {who, what, where, when, why, how}
- [x] `suggested_titles` (json, nullable)
- [x] `summary_bullets` (json, nullable)
- [x] `ai_model_used` (string, nullable) — Ex: gpt-4o-mini
- [x] `ai_tokens_used` (integer, nullable)
- [x] `enrichment_level` (enum: none, level_1, level_2)
- [x] timestamps
- [x] **Índice:** `(news_theme_id, city, urgency)` — Para filtros rápidos no painel

#### 1.3.9 Tabela `news_clusters`
- [x] `id` (bigIncrements)
- [x] `label` (string, nullable)
- [x] timestamps

#### 1.3.10 Tabela pivot `news_cluster_items`
- [x] `news_cluster_id` (foreignId)
- [x] `news_item_id` (foreignId)
- [x] `similarity_score` (float)
- [ ] **Unique composto:** `(news_cluster_id, news_item_id)`

### 1.4 Enums PHP

- [x] `DiscoveryMode` — auto, feed, sitemap, html_listing
- [x] `FeedQualityProfile` — full, partial, teaser_only *(diagnóstico, não regra operacional)*
- [x] `FetchDetailMode` — never, when_incomplete, always *(regra operacional do spider)*
- [x] `PublishedAtSource` — rss, jsonld, og_tag, time_tag, text_pattern, manual
- [x] `ExtractionStatus` — pending, extracted, extraction_failed
- [x] `EnrichmentStatus` — none, enriched_l1, enriched_l2, enrichment_failed
- [x] `ContentSource` — feed_only, feed_plus_html, html_only
- [x] `MediaType` — hero, gallery, video, embed
- [x] `Urgency` — baixa, media, alta
- [x] `SourceType` — portal, prefeitura, blog, agencia, whatsapp
- [x] `RawItemStatus` — pending, processing, promoted, skipped, failed
- [x] `SourceRunStatus` — running, success, partial, failed
- [x] `DiscoveryRunStatus` — pending, running, completed, failed

### 1.5 Models Eloquent

- [x] `NewsTheme` — Tabela de temas editáveis. `hasMany(NewsItemAiMetadata)`
- [x] `NewsSource` — casts JSON, relação `hasMany(NewsItem)`, `hasMany(NewsSourceRun)`, `hasMany(NewsRawItem)`
- [x] `NewsSourceRun` — relação `belongsTo(NewsSource)`, `hasMany(NewsRawItem)`
- [x] `SourceDiscoveryRun` — Model independente (wizard async)
- [x] `NewsRawItem` — relação `belongsTo(NewsSource)`, `belongsTo(NewsSourceRun)`, `hasOne(NewsItem)`
- [x] `NewsItem` — relações: `belongsTo(NewsSource)`, `belongsTo(NewsRawItem)`, `hasOne(NewsItemAiMetadata)`, `hasMany(NewsItemMedia)`, `belongsToMany(NewsCluster)`, **`belongsTo(NewsItem::class, 'duplicate_of_news_item_id')` (self-reference)**, **`hasMany(NewsItem::class, 'duplicate_of_news_item_id')` (duplicatas reversas)**
- [x] `NewsItemMedia` — relação `belongsTo(NewsItem)`
- [x] `NewsItemAiMetadata` — relação `belongsTo(NewsItem)`, `belongsTo(NewsTheme)`
- [x] `NewsCluster` — relação `belongsToMany(NewsItem)`

---

## Fase 2 — Camada de Serviços Core (Motor de Coleta)

> **Objetivo:** Implementar os serviços fundamentais que vão sustentar os Spiders e os Jobs. Sem UI ainda.
> **Nota:** A inteligência de extração fica nos **Services** (testáveis unitariamente), não nos Spiders. Os Spiders são apenas orquestradores finos.

### 2.1 `UrlNormalizerService`
- [x] Utilizar `league/uri` para canonicalizar URLs
- [x] Remover parâmetros UTM (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`)
- [x] Normalizar trailing slash
- [x] Forçar HTTPS quando disponível
- [x] Gerar `url_hash` (SHA-256) para deduplicação rápida

#### Destaque: Schema Oficial do Campo JSON (`crawling_config`)

O coração do extrator adaptável. Schema formalizado com base nos legados (Diarinho, VIPSocial, SCC10, Itapema) para cobrir **listagem com paginação**, **detalhe por campo**, **pré-processamento de datas** e **marcadores de corte**.

```json
{
  "config_version": 1,
  "preset_origin": "html_listing_detail",

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

> **`config_version`** permite evolução futura do schema sem quebrar fontes já cadastradas. **`preset_origin`** registra qual preset gerou esta config inicialmente (o operador pode ter ajustado depois).
### 2.2 `DateParserService`
- [x] Receber data crua (string) + array de `date_formats` da fonte + `timezone_default`
- [x] Aplicar **`date_preprocessors`** antes do parse (da config da fonte):
  - [x] Suportar tipo `replace` (ex: remover "min", "hrs", "às")
  - [x] Suportar tipo `trim`
  - [x] Suportar tipo `regex_extract` (para capturar data de dentro de texto misto)
- [x] Tentar parse na ordem: formatos configurados da fonte → autodetect do Carbon
- [x] Retornar objeto DTO com: `raw`, `parsed`, `utc`, `timezone`, `source`

### 2.3 `BoilerplateCleanerService`
- [x] Receber HTML bruto + regras de limpeza (do `crawling_config.boilerplate_rules`)
- [x] **Regras globais (padrão, sempre ativas):**
  - [x] Remover `<style>…</style>`, `<script>…</script>`
  - [x] Remover "O post … apareceu primeiro em …"
  - [x] Remover CTAs sociais ("Clique aqui e faça parte do nosso grupo")
  - [x] Remover imagens emoji WordPress (domínio `s.w.org`)
  - [x] Remover blocos CTA editoriais ("Comente e compartilhe")
  - [x] Decode HTML entities, normalizar quebras de linha
- [x] **Regras por fonte (editáveis no painel):**
  - [x] `remove_selectors` — seletores CSS para remover nós inteiros
  - [x] `remove_text_patterns` — regex para remover parágrafos com matches

### 2.4 `FeedParserService`
- [x] Utilizar **SimplePie** para parsear RSS/Atom (namespaces, `dc:creator`, `content:encoded`)
- [x] Extrair campos na ordem de prioridade:
  - [x] Título: `title`
  - [x] Autor: `dc:creator` → `creator`
  - [x] Data: `isoDate` → `pubDate`
  - [x] Resumo: `contentSnippet` → `content:encodedSnippet` → `content`
  - [x] Corpo: `content:encoded` → `content` → vazio
  - [x] Tags: `categories`
  - [x] Identificador: `guid` (auxiliar, nunca como URL)
  - [x] URL: `link` (normalizado via `UrlNormalizerService`)
- [x] Salvar `author_raw` separado
- [x] Extrair imagens do HTML do `content:encoded`:
  - [x] Ignorar domínios de emoji (`s.w.org`, similares)
  - [x] Preferir imagem com maior `width` no `srcset`
  - [x] Separar `hero_image` de `gallery_images[]`
- [x] Retornar array de DTOs (Value Objects) para criação do `NewsRawItem`

### 2.5 `FeedQualityScorerService`
- [x] Receber array de 3–5 itens parseados do feed
- [x] Calcular score de completude:
  - [x] `title` presente = +20
  - [x] `link` presente = +20
  - [x] `isoDate`/`pubDate` presente = +15
  - [x] `content:encoded` > 600 chars = +20
  - [x] Imagem detectável = +10
  - [x] Autor presente = +5
  - [x] Categorias presentes = +5
  - [x] Teaser limpo (snippet) = +5
- [x] Resultado: score 80+ → `full` | 50–79 → `partial` | <50 → `teaser_only`
- [x] Detectar flags: `wordpress_like`, `has_inline_images`, `has_gallery`, `has_boilerplate`, `has_categories`

### 2.6 `SitemapParserService` *(NOVO)*
> Sitemap tem comportamento próprio: index, lastmod, news sitemap. Merece tratamento dedicado.

- [x] Receber URL do sitemap (configurável ou autodescoberto)
- [x] Detectar tipo: **Sitemap Index** vs **Sitemap simples** vs **News Sitemap**
  - [x] Se Index → percorrer sitemaps filhos recursivamente
- [x] Extrair `<loc>` (URL do artigo) e `<lastmod>` (data de modificação)
- [x] Para News Sitemaps: extrair `<news:title>`, `<news:publication_date>`, `<news:keywords>`
- [x] Aplicar `article_url_patterns` e `ignore_url_patterns` para filtrar
- [x] Normalizar todas as URLs via `UrlNormalizerService`
- [x] Retornar array de DTOs ordenados por `lastmod` (mais recentes primeiro)

### 2.7 `ListingDiscoveryService` *(NOVO — 1ª classe)*
> Tratamento operacional completo para portais sem RSS (Ex: Diarinho, VIPSocial). Caso de primeira classe, não fallback.

- [x] Receber `listing_urls` + seletores de listagem da config da fonte
- [x] Para cada URL de listagem:
  - [x] Abrir via `HttpFetchService`
  - [x] Localizar container via `listing_container_selectors` (ex: `.news-list`, `main`)
  - [x] Extrair cards de notícia via `listing_item_selectors` (ex: `.card-noticia`, `article`)
  - [x] Para cada card, extrair:
    - [x] Link → `listing_link_selectors` (com resolução de URLs relativas via `relative_url_base`)
    - [x] Título prévio → `listing_title_selectors`
    - [x] Imagem prévia → `listing_image_selectors` (com resolução de URLs relativas)
    - [x] Excerpt prévio → `listing_excerpt_selectors`
- [x] Normalizar todas as URLs via `UrlNormalizerService`
- [x] Aplicar filtros `article_url_patterns` e `ignore_url_patterns`
- [x] Deduplicar links dentro da própria listagem
- [x] **Paginação automática:**
  - [x] Detectar link de próxima página via `next_page_selectors` (ex: `a.next`, `.pagination a.next`)
  - [x] Seguir até `listing_max_pages` (padrão: 3)
  - [x] **Parada inteligente:** Se `stop_when_seen_known_urls = true`, parar após encontrar `max_known_urls_before_stop` URLs que já existem no banco (evita re-crawling desnecessário)
- [x] Retornar array de candidatos de notícia (DTOs)

### 2.8 `FieldResolverService` *(NOVO)*
> Cada campo da notícia pode vir de fontes diferentes (listing, feed, detalhe HTML, JSON-LD, OG). Este service centraliza a resolução, evitando lógica espalhada pelos spiders.

- [x] `resolveTitle(listingData, feedData, articleData)` — Prioridade: articleJSON-LD > article OG > article H1 > feed title > listing title
- [x] `resolveSubtitle(feedData, articleData)` — Prioridade: article meta description > articleJSON-LD description > feed snippet
- [x] `resolveAuthor(feedData, articleData)` — Prioridade: `dc:creator` > articleJSON-LD author > article selector > feed creator
- [x] `resolvePublishedAt(feedData, articleData, config)` — Aplica `DateParserService` com `date_preprocessors`. Prioridade: articleJSON-LD datePublished > article `<time>` > article OG article:published_time > feed isoDate > feed pubDate > text_pattern
- [x] `resolveBody(feedData, articleData, config)` — Prioridade: article body selector (limpo) > feed `content:encoded`. Aplica `body_stop_text_patterns` para cortar conteúdo após marcadores de encerramento
- [x] `resolveHeroImage(listingData, feedData, articleData, config)` — Aplica `image_extraction_strategy`:
  - [x] `listing_first_then_og_then_body` (padrão para VIPSocial/Diarinho)
  - [x] `og_first_then_body` (padrão para Itapema/Correio)
  - [x] `body_only` (casos raros)
- [x] `resolveCategories(feedData, articleData)` — Merge de tags do feed (`categories`) com meta keywords + seletores do artigo. Normalizar strings (lowercase, trim)
- [x] **Merge final:** Preencher campos faltantes usando fontes de prioridade inferior. Registrar a `source` de cada campo resolvido (para auditoria)

### 2.9 `ArticleExtractorService`
- [x] Receber HTML da página + configuração de `article_extractors` da fonte
- [x] Implementar extração em camadas (A → B → C → D → E):
  - [x] **Camada A:** Parse JSON-LD (`schema.org/NewsArticle`)
  - [x] **Camada B:** Parse Open Graph meta tags
  - [x] **Camada C:** Parse HTML semântico com seletores CSS do banco (via `symfony/css-selector`)
  - [x] **Camada D:** Aplicar `BoilerplateCleanerService` + `body_stop_text_patterns` ao corpo
  - [x] **Camada E:** Aplicar seletores custom (override por fonte)
- [x] Suportar extração de corpo por **container + marcador de parada** (ex: `.post__content` até "Para mais notícias")
- [x] Suportar iteração em siblings quando corpo não vem num único container (caso Diarinho)
- [x] Calcular `extraction_completeness` (score 0–100)
- [x] Delegar resolução final de campos ao `FieldResolverService`

### 2.10 `HttpFetchService`
- [x] Wrapper **unificado** do Guzzle, reaproveitado tanto no onboarding quanto nos spiders
- [x] Configurar via **Roach Downloader Middleware** (não criar pilha paralela):
  - [x] Throttle por host (delay configurável)
  - [x] Retry com backoff exponencial (429, 500, timeout)
  - [x] User-Agent (rotação ou fixo por fonte)
  - [x] Headers custom por fonte (Accept-Language, etc.)
- [x] Suporte a concorrência via Promises (pool de requests)
- [x] Métricas: medir `response_time_ms` por request (alimenta `news_source_runs`)

---

## Fase 3 — Spiders e Jobs (Orquestração de Crawling)

> **Objetivo:** Conectar os serviços da Fase 2 em um pipeline executável via filas do Laravel/Horizon.
> **Princípio:** Spiders são orquestradores finos. A inteligência pesada fica nos Services.

### 3.1 `GenericDiscoverySpider` (RoachPHP)
- [x] Receber configuração da `NewsSource` (injetada via construtor/contexto)
- [x] Decidir estratégia baseado no `discovery_mode` — **delegar sempre ao service especializado:**
  - [x] `feed` → Delegar ao `FeedParserService` (SimplePie)
  - [x] `sitemap` → Delegar ao `SitemapParserService` (index, lastmod, news sitemap)
  - [x] `html_listing` → Delegar ao `ListingDiscoveryService` (paginação, parada inteligente)
  - [x] `auto` → Tentar feed → sitemap → listing (nessa ordem, parar no primeiro que retornar resultados)
- [x] Para cada URL encontrada: normalizar via `UrlNormalizerService`, verificar `url_hash` no banco
- [x] Emitir itens novos para o `PersistencePipeline` → Criar `NewsRawItem` com status `pending`

### 3.2 `GenericArticleSpider` (RoachPHP) — Orquestrador fino
- [x] Receber `NewsRawItem` com `processing_status=pending` + configuração da `NewsSource`
- [x] **A regra final de busca é `fetch_detail_mode`** (não `feed_quality_profile`, que vira apenas diagnóstico):
  - [x] `never` → Promover direto do `raw_payload` sem fetch externo. Ideal para feeds completos de prefeitura onde corpo + imagem já vieram. O `FieldResolverService` resolve campos apenas do feed.
  - [x] `when_incomplete` → Usar `FieldResolverService` para verificar completude. Se body, hero_image ou author faltarem → buscar HTML via `HttpFetchService`. Se já completo → pular fetch (ex: Itapema, Correio Catarin.)
  - [x] `always` → Sempre buscar HTML do artigo, independente do que veio no feed (ex: Diarinho, VIPSocial, SCC10, qualquer `html_listing`)
  - [x] Se `render_js_required=true` → usar Panther (Headless Browser) em vez de Guzzle
- [x] Passar HTML para `ArticleExtractorService`
- [x] Usar `FieldResolverService` para **merge final** de dados do listing + feed + detalhe HTML
- [x] Emitir item processado para pipelines de limpeza e persistência
- [x] Promover `NewsRawItem` → `NewsItem`, registrar `content_source` (feed_only, feed_plus_html, html_only)

### 3.3 RoachPHP Pipelines
- [x] `DeduplicationPipeline` — Verifica `url_hash` no banco, descarta duplicatas
- [x] `BoilerplateCleaningPipeline` — Aplica `BoilerplateCleanerService`
- [x] `PersistencePipeline` — Salva/atualiza `NewsRawItem` e `NewsItem` + `NewsItemMedia`

### 3.4 `FetchNewsSourceJob` (Laravel Job)
- [x] Disparado pelo Scheduler conforme `throttle_config` de cada fonte ativa
- [x] **Adquirir lock:** Setar `sync_locked_until = now + timeout` na `NewsSource`. Se já locado → abortar (evita runs paralelos)
- [x] **Criar `NewsSourceRun`** (status: running, started_at: now)
- [x] Verificar `consecutive_failures` (Circuit Breaker: pausar se > N)
- [x] Executar `GenericDiscoverySpider` para a fonte
- [x] Para cada item novo encontrado: disparar `ProcessNewsItemJob`
- [x] **Finalizar `NewsSourceRun`** (items_found, items_new, response_time_avg_ms, status)
- [x] Atualizar `NewsSource`: `last_sync_at`, `success_rate`, `avg_response_ms`, `last_items_found`, `next_sync_at`
- [x] **Liberar lock:** Setar `sync_locked_until = null`
- [x] Em caso de erro: incrementar `consecutive_failures`, salvar `error_message` no run, **liberar lock**

### 3.5 `ProcessNewsItemJob` (Laravel Job)
- [x] Receber `NewsRawItem` pendente
- [x] Atualizar `NewsRawItem.processing_status` → `processing`, incrementar `fetch_attempts`
- [x] Executar `GenericArticleSpider` para extração → promover para `NewsItem`
- [x] Após sucesso:
  - [x] `NewsRawItem.processing_status` → `promoted`
  - [x] Criar `NewsItem` com `extraction_status = extracted`
  - [x] Disparar `ClassifyNewsItemJob` (AI Job 1)
- [x] Em caso de erro:
  - [x] `NewsRawItem.processing_status` → `failed`
  - [x] Salvar `last_fetch_error` no `NewsRawItem` (não no `NewsItem`, que pode não existir)
  - [x] Se `fetch_attempts < max_retries` → re-enfileirar com delay

### 3.6 Scheduler (Console Kernel)
- [x] Comando artisan `news-radar:dispatch-sources`
  - [x] Percorre `NewsSource` ativas onde `now >= next_sync_at`
  - [x] Enfileira `FetchNewsSourceJob`
  - [x] Roda a cada 1 minuto (o comando respeita o throttle interno de cada fonte)
- [x] Comando artisan `news-radar:health-check`
  - [x] Relatório de fontes com `consecutive_failures >= 5`
  - [x] Roda a cada 1 hora

---

## Fase 4 — Onboarding Inteligente de Fontes (Wizard + API)

> **Objetivo:** Criar o "Wizard" de cadastro de fonte no backend. O `spatie/crawler` é usado aqui para discovery e validação, nunca como extrator principal de matéria.

### 4.1 `SourceDiscoveryService`
- [x] Método `discover(string $url)`:
  - [x] Criar registro `SourceDiscoveryRun` (status: running)
  - [x] Usar `spatie/crawler` para navegar a homepage
  - [x] Detectar `<link rel="alternate" type="application/rss+xml">`
  - [x] Tentar acessar `/sitemap.xml`, `/news-sitemap.xml` via `SitemapParserService`
  - [x] Coletar links `<a href>` da homepage
  - [x] Identificar padrões de URL de artigo
  - [x] Detectar possíveis `listing_container_selectors` automaticamente
  - [x] Detectar se o site precisa de JS (resposta vazia / `<div id="app">`)
  - [x] Salvar resultado em `SourceDiscoveryRun.result_json`
- [x] Método `analyzeFeed(string $feedUrl)`:
  - [x] Parsear 5 itens com `FeedParserService` (SimplePie)
  - [x] Calcular `FeedQualityScore`
  - [x] Detectar boilerplates, retornar diagnóstico completo
- [x] Método `previewArticles(string $mode, string $url, int $count = 3)` — **Genérico, funciona com e sem feed:**
  - [x] Se `mode=feed` → Parsear feed, extrair primeiros N itens, usar `ArticleExtractorService` + `FieldResolverService`
  - [x] Se `mode=html_listing` → Usar `ListingDiscoveryService` para extrair N cards da listagem, buscar detalhe do primeiro para preview completo
  - [x] Retornar cards de preview unificados para o frontend (título, imagem, data, excerpt, score de completude)

### 4.2 `SourceDiscoveryController`
- [x] `POST /api/v1/news-radar/sources/discover` — Recebe `url`, cria `SourceDiscoveryRun`, dispara discovery async, retorna run ID
- [x] `GET /api/v1/news-radar/sources/discover/{runId}/status` — Retorna progresso e resultado do discovery
- [x] `POST /api/v1/news-radar/sources/preview` — **Genérico:** Recebe `mode` (feed|html_listing) + `url` (feed_url ou listing_url), retorna 3 cards de preview
- [x] `POST /api/v1/news-radar/sources/test-selector` — Recebe `url` + `selector`, retorna conteúdo extraído. **Salvar snapshot** em `source_discovery_runs.selector_test_snapshots` (se run ativo) para auditoria.

### 4.3 `NewsSourceController` (CRUD)
- [x] `GET    /api/v1/news-radar/sources` — Listar fontes (com filtros: active, profile, failures, source_type)
- [x] `POST   /api/v1/news-radar/sources` — Criar nova fonte
- [x] `GET    /api/v1/news-radar/sources/{id}` — Detalhes da fonte (com métricas + últimos runs)
- [x] `PUT    /api/v1/news-radar/sources/{id}` — Atualizar configuração
- [x] `DELETE /api/v1/news-radar/sources/{id}` — Desativar (soft delete)
- [x] `POST   /api/v1/news-radar/sources/{id}/sync` — Forçar sync manual imediato
- [x] `GET    /api/v1/news-radar/sources/{id}/runs` — Histórico de execuções

### 4.4 `NewsItemController` (Leitura)
- [x] `GET /api/v1/news-radar/items` — Listar notícias (filtros: source, theme, city, date_range, status, urgency)
- [x] `GET /api/v1/news-radar/items/{id}` — Detalhe (com AI metadata, media, cluster)
- [x] `GET /api/v1/news-radar/items/{id}/related` — Notícias relacionadas (embeddings/cluster)
- [x] `GET /api/v1/news-radar/dashboard` — Resumo: totais por fonte, por tema, alertas de fontes com falha

---

## Fase 5 — Inteligência Artificial e Enriquecimento

> **Objetivo:** Implementar os dois Jobs de IA e o sistema de Embeddings/Clusters.
> **Nota técnica:** Na API atual da OpenAI, Structured Outputs na Responses API usa `text.format` (não o antigo `response_format` do Chat Completions). A documentação oficial da OpenAI é a fonte de verdade para o contrato, não o pacote `openai-php/laravel`.

### 5.1 `AiEnrichmentService`
- [x] Configurar client `openai-php/laravel` (API key, model default)
- [x] Método `classifyBasic(NewsItem $item)` — **Job 1 (ClassifyNewsItemJob)**
  - [x] Montar prompt com título + excerpt + primeiros 2000 chars do `body_text`
  - [x] Enviar via Responses API com JSON Schema estrito (`text.format`):
    - [x] `city`, `state_abbr`, `theme` (string validada contra `news_themes`), `urgency` (enum), `relevance_score`, `entities[]`
  - [x] Salvar resultado em `news_item_ai_metadata` (nível `level_1`)
  - [x] Se `relevance_score >= 0.7` → disparar Job 2
- [x] Método `enrichEditorial(NewsItem $item)` — **Job 2 (EnrichNewsItemJob)**
  - [x] Montar prompt expandido para 5W1H
  - [x] JSON Schema: `five_ws{}`, `suggested_titles[]`, `summary_bullets[]`
  - [x] Atualizar `news_item_ai_metadata` com nível `level_2`

### 5.2 `ClassifyNewsItemJob` (AI Job 1)
- [x] Receber `NewsItem` com `extraction_status=extracted` e `enrichment_status=none`
- [x] Chamar `AiEnrichmentService::classifyBasic()`
- [x] Atualizar `enrichment_status` para `enriched_l1`
- [x] Se relevância alta → disparar `EnrichNewsItemJob`
- [x] Em caso de erro: atualizar `enrichment_status` para `enrichment_failed`

### 5.3 `EnrichNewsItemJob` (AI Job 2)
- [x] Receber `NewsItem` com `enrichment_status=enriched_l1`
- [x] Chamar `AiEnrichmentService::enrichEditorial()`
- [x] Atualizar `enrichment_status` para `enriched_l2`
- [x] Em caso de erro: manter `enriched_l1` (pode reprocessar)

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
> **Nota de implementação:** As entregas abaixo foram acopladas às rotas existentes `/raspagem/feed`, `/raspagem/fontes` e `/raspagem/filtros`, reaproveitando o shell e os componentes atuais do painel.

### 6.1 Services & Types (TypeScript)
- [x] Criar `newsRadar.service.ts` com interfaces e chamadas API
- [x] Definir tipos: `NewsSource`, `NewsItem`, `NewsRawItem`, `AiMetadata`, `DiscoveryResult`, `PreviewCard`, `SourceRun`

### 6.2 Página: Listagem de Fontes (`/radar/fontes`)
- [x] Listagem operacional: Nome, Tipo, Modo, Status, Último Sync, Falhas, Taxa Sucesso
- [ ] Badges visuais por `feed_quality_profile` (Full ✅, Noisy ⚠️, Teaser 🔍)
- [x] Indicador de saúde (verde/amarelo/vermelho via `consecutive_failures`)
- [x] Ações: Editar, Sync Manual, Ver Histórico de Runs, Desativar

### 6.3 Página: Wizard Nova Fonte (`/radar/fontes/nova`)
- [x] **Step 1:** Input da URL + botão "Analisar"
- [x] **Step 2:** Diagnóstico automático (Feed? Qualidade? Boilerplates? JS?)
- [x] **Step 3:** Preview de 3 cards de matérias reais
- [x] **Step 4:** Ajuste fino (seletores CSS, regras de limpeza, exclusões de URL)
- [ ] **Step 5:** Periodicidade sugerida (com override manual)
- [x] **Step 6:** Confirmação e salvamento

### 6.4 Página: Edição da Fonte (`/radar/fontes/:id/editar`)
- [x] Formulário com todos os campos da fonte
- [x] Editor de `crawling_config` (seletores, boilerplate rules)
- [x] Teste de seletor integrado à operação (centralizado em `/raspagem/filtros`, chama API `/test-selector`)
- [x] Tabela de últimos 10 runs (com status, itens encontrados, erros)

### 6.5 Página: Feed de Notícias (`/radar/noticias`)
- [x] Lista/Grid de notícias (cards com imagem, título, fonte, data e metadados operacionais)
- [x] Filtros já integrados: Fonte, Cidade, Status de extração, Status de IA, Urgência
- [ ] Filtros pendentes: Tema e Período
- [x] Busca por texto
- [ ] Ordenação explícita: mais recentes / mais relevantes

### 6.6 Página: Detalhe da Notícia (`/radar/noticias/:id`)
- [x] Corpo renderizado em modal de detalhe
- [x] AI Metadata já exibido: cidade, urgência, relevância, 5W1H e summary bullets
- [ ] Tema da IA exibido no detalhe
- [ ] Galeria de imagens completa
- [x] "Notícias Relacionadas" e links para matéria original / homepage da fonte

### 6.7 Página: Dashboard do Radar (`/radar`)
- [x] KPIs operacionais: fontes ativas, itens hoje, fontes com falha, locks ativos
- [x] Visão por fonte (volume) e breakdowns por status de extração / enriquecimento
- [ ] Totais editoriais completos: notícias hoje, esta semana, este mês
- [ ] Gráfico por tema
- [x] Alertas: fontes com falha
- [ ] Alertas: fontes inativas
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
