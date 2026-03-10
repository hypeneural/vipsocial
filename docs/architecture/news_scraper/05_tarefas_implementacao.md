# 5. Tarefas de Implementação — Módulo Radar de Notícias

Roadmap completo de implementação do módulo `NewsRadar`, organizado em **fases sequenciais**. Cada fase contém tarefas e subtarefas com dependências claras. A estrutura segue o padrão modular existente do projeto (`app/Modules/NewsRadar/`).

---

## Fase 1 — Fundação (Infraestrutura, Banco de Dados e Dependências)

> **Objetivo:** Criar a estrutura de diretórios, instalar dependências e rodar as migrations. Nenhuma lógica de negócio ainda — apenas o "esqueleto" do módulo.

### 1.1 Instalação de Dependências Composer

- [ ] `roach-php/laravel` — Motor de crawling/spiders
- [ ] `symfony/css-selector` — Habilitar seletores CSS no DomCrawler (já vem com o Roach, validar)
- [ ] `spatie/crawler` — Descoberta de links (onboarding)
- [ ] `league/uri` — Normalização/canonicalização de URLs
- [ ] `openai-php/laravel` — Integração com a API OpenAI (Structured Outputs)
- [ ] Verificar se `guzzlehttp/guzzle`, `symfony/dom-crawler` e `nesbot/carbon` já estão no `composer.json` (normalmente sim no Laravel)

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
│       └── NewsItemResource.php
├── Models/
│   ├── NewsSource.php
│   ├── NewsItem.php
│   ├── NewsItemMedia.php
│   └── NewsCluster.php
├── Services/
│   ├── HttpFetchService.php
│   ├── UrlNormalizerService.php
│   ├── FeedParserService.php
│   ├── FeedQualityScorerService.php
│   ├── ArticleExtractorService.php
│   ├── BoilerplateCleanerService.php
│   ├── DateParserService.php
│   ├── SourceDiscoveryService.php
│   └── AiEnrichmentService.php
├── Spiders/
│   ├── GenericDiscoverySpider.php
│   └── GenericArticleSpider.php
├── Jobs/
│   ├── FetchNewsSourceJob.php
│   ├── ProcessNewsItemJob.php
│   ├── ClassifyNewsItemJob.php       (AI Job 1)
│   └── EnrichNewsItemJob.php         (AI Job 2)
├── Pipelines/                        (RoachPHP Pipelines)
│   ├── DeduplicationPipeline.php
│   ├── BoilerplateCleaningPipeline.php
│   └── PersistencePipeline.php
├── Enums/
│   ├── DiscoveryMode.php
│   ├── FeedQualityProfile.php
│   ├── NewsTheme.php
│   └── PublishedAtSource.php
├── Support/
│   └── Middleware/
│       ├── ThrottleMiddleware.php
│       ├── RetryMiddleware.php
│       └── UserAgentMiddleware.php
└── routes.php
```

- [ ] Criar todos os diretórios acima
- [ ] Criar o arquivo `routes.php` com rotas prefixadas `/api/v1/news-radar/`
- [ ] Registrar o módulo no `RouteServiceProvider` (ou equivalente)

### 1.3 Migrations (Banco de Dados)

#### 1.3.1 Tabela `news_sources`
- [ ] `id` (bigIncrements)
- [ ] `name` (string) — Nome do portal
- [ ] `homepage_url` (string, unique)
- [ ] `active` (boolean, default true)
- [ ] `discovery_mode` (enum: auto, feed, sitemap, html_listing)
- [ ] `feed_quality_profile` (enum: full, partial, teaser_only, nullable)
- [ ] `crawling_config` (json) — Seletores, extractors, boilerplate_rules, ignore_url_patterns
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
- [ ] `notes` (text, nullable) — Campo de observações do operador
- [ ] timestamps + softDeletes

#### 1.3.2 Tabela `news_items`
- [ ] `id` (bigIncrements)
- [ ] `news_source_id` (foreignId)
- [ ] `url` (string) — URL canônica (limpa de UTMs)
- [ ] `url_hash` (string, unique, index) — SHA-256 da URL canônica para dedupe rápido
- [ ] `raw_url` (string) — URL original como veio do feed/crawl
- [ ] `guid` (string, nullable, index) — Identificador auxiliar do RSS/WordPress
- [ ] `title` (string)
- [ ] `subtitle` (string, nullable)
- [ ] `author_raw` (string, nullable) — Texto cru do autor do feed
- [ ] `author_normalized` (string, nullable) — Autor reconciliado
- [ ] `body_html` (longText, nullable) — Corpo da matéria em HTML limpo
- [ ] `body_text` (longText, nullable) — Corpo plain text (para IA/indexação)
- [ ] `excerpt` (text, nullable) — Snippet/resumo curto
- [ ] `hero_image_url` (string, nullable) — Imagem principal
- [ ] `categories_raw` (json, nullable) — Array de categorias vindas do feed/HTML
- [ ] `published_at_raw` (string, nullable) — Texto cru da data
- [ ] `published_at_parsed` (timestamp, nullable)
- [ ] `published_at_utc` (timestamp, nullable, index)
- [ ] `published_at_timezone` (string, nullable)
- [ ] `published_at_source` (enum: rss, jsonld, og_tag, time_tag, text_pattern, manual)
- [ ] `modified_at_raw` (string, nullable)
- [ ] `modified_at_utc` (timestamp, nullable)
- [ ] `extraction_completeness` (integer, default 0) — Score 0–100 de completude
- [ ] `content_source` (enum: feed_only, feed_plus_html, html_only)
- [ ] `status` (enum: pending, extracted, enriched_l1, enriched_l2, failed)
- [ ] timestamps + softDeletes

#### 1.3.3 Tabela `news_item_media`
- [ ] `id` (bigIncrements)
- [ ] `news_item_id` (foreignId)
- [ ] `type` (enum: hero, gallery, video, embed)
- [ ] `url` (string)
- [ ] `width` (integer, nullable)
- [ ] `height` (integer, nullable)
- [ ] `alt_text` (string, nullable)
- [ ] `position` (integer, default 0)
- [ ] timestamps

#### 1.3.4 Tabela `news_item_ai_metadata`
- [ ] `id` (bigIncrements)
- [ ] `news_item_id` (foreignId, unique)
- [ ] `city` (string, nullable)
- [ ] `state_abbr` (string(2), nullable)
- [ ] `theme` (string, nullable) — Enum controlado pelo Structured Output
- [ ] `urgency` (enum: baixa, media, alta, nullable)
- [ ] `relevance_score` (float, nullable)
- [ ] `entities` (json, nullable) — Array de {type, name}
- [ ] `five_ws` (json, nullable) — {who, what, where, when, why, how}
- [ ] `suggested_titles` (json, nullable) — Array de sugestões de título
- [ ] `summary_bullets` (json, nullable) — Array de bullet-points
- [ ] `ai_model_used` (string, nullable) — Ex: gpt-4o-mini
- [ ] `ai_tokens_used` (integer, nullable)
- [ ] `enrichment_level` (enum: none, level_1, level_2)
- [ ] timestamps

#### 1.3.5 Tabela `news_clusters`
- [ ] `id` (bigIncrements)
- [ ] `label` (string, nullable) — Título do cluster (opcional, pode vir da IA)
- [ ] timestamps

#### 1.3.6  Tabela pivot `news_cluster_items`
- [ ] `news_cluster_id` (foreignId)
- [ ] `news_item_id` (foreignId)
- [ ] `similarity_score` (float) — Cosine similarity

### 1.4 Enums PHP

- [ ] `DiscoveryMode` — auto, feed, sitemap, html_listing
- [ ] `FeedQualityProfile` — full, partial, teaser_only
- [ ] `NewsTheme` — politica, policia, esporte, economia, saude, educacao, comunidade, entretenimento, meio_ambiente, tecnologia, outro
- [ ] `PublishedAtSource` — rss, jsonld, og_tag, time_tag, text_pattern, manual
- [ ] `NewsItemStatus` — pending, extracted, enriched_l1, enriched_l2, failed
- [ ] `ContentSource` — feed_only, feed_plus_html, html_only
- [ ] `MediaType` — hero, gallery, video, embed
- [ ] `Urgency` — baixa, media, alta

### 1.5 Models Eloquent

- [ ] `NewsSource` — casts JSON, relação `hasMany(NewsItem)`
- [ ] `NewsItem` — relação `belongsTo(NewsSource)`, `hasOne(NewsItemAiMetadata)`, `hasMany(NewsItemMedia)`, `belongsToMany(NewsCluster)`
- [ ] `NewsItemMedia` — relação `belongsTo(NewsItem)`
- [ ] `NewsItemAiMetadata` — relação `belongsTo(NewsItem)`
- [ ] `NewsCluster` — relação `belongsToMany(NewsItem)`

---

## Fase 2 — Camada de Serviços Core (Motor de Coleta)

> **Objetivo:** Implementar os serviços fundamentais que vão sustentar os Spiders e os Jobs. Sem UI ainda.

### 2.1 `HttpFetchService`
- [ ] Wrapper do Guzzle com HandlerStack configurável
- [ ] Middleware de Throttle (delay por host)
- [ ] Middleware de Retry (backoff exponencial para 429, 500, timeout)
- [ ] Middleware de User-Agent (rotação ou UA fixo por fonte)
- [ ] Headers custom por fonte (Accept-Language, etc.)
- [ ] Suporte a concorrência via Promises (pool de requests)
- [ ] Métricas: medir `response_time_ms` por request

### 2.2 `UrlNormalizerService`
- [ ] Utilizar `league/uri` para canonicalizar URLs
- [ ] Remover parâmetros UTM (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`)
- [ ] Normalizar trailing slash
- [ ] Forçar HTTPS quando disponível
- [ ] Gerar `url_hash` (SHA-256) para deduplicação rápida

### 2.3 `FeedParserService`
- [ ] Parser de RSS/Atom (usando `SimpleXML` ou lib dedicada)
- [ ] Extrair campos na ordem de prioridade definida na arquitetura:
  - [ ] Título: `title`
  - [ ] Autor: `dc:creator` → `creator`
  - [ ] Data: `isoDate` → `pubDate`
  - [ ] Resumo: `contentSnippet` → `content:encodedSnippet` → `content`
  - [ ] Corpo: `content:encoded` → `content` → vazio
  - [ ] Tags: `categories`
  - [ ] Identificador: `guid` (auxiliar, nunca como URL)
  - [ ] URL: `link` (normalizado)
- [ ] Salvar `author_raw` e `author_normalized` separados
- [ ] Extrair imagens do HTML do `content:encoded`:
  - [ ] Ignorar domínios de emoji (`s.w.org`, etc.)
  - [ ] Preferir imagem com maior `width` no `srcset`
  - [ ] Separar `hero_image` de `gallery_images[]`
- [ ] Retornar array de `NewsItem` parciais (DTO/Value Object)

### 2.4 `FeedQualityScorerService`
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
- [ ] Detectar flags adicionais:
  - [ ] `wordpress_like` (guid com `?p=`, `content:encoded` com tags WP)
  - [ ] `has_inline_images`
  - [ ] `has_gallery`
  - [ ] `has_boilerplate` (CTAs WhatsApp, rodapé WP)
  - [ ] `has_categories`

### 2.5 `BoilerplateCleanerService`
- [ ] Receber HTML bruto + regras de limpeza (do `crawling_config.boilerplate_rules`)
- [ ] **Regras globais (padrão, sempre ativas):**
  - [ ] Remover `<style>...</style>`
  - [ ] Remover `<script>...</script>`
  - [ ] Remover "O post ... apareceu primeiro em ..."
  - [ ] Remover CTAs sociais ("Clique aqui e faça parte do nosso grupo")
  - [ ] Remover imagens emoji WordPress (domínio `s.w.org`)
  - [ ] Remover blocos CTA editoriais ("Comente e compartilhe")
  - [ ] Decode HTML entities
  - [ ] Normalizar quebras de linha
- [ ] **Regras por fonte (editáveis no painel):**
  - [ ] `remove_selectors` — seletores CSS para remover nós inteiros
  - [ ] `remove_text_patterns` — regex para remover parágrafos com matches

### 2.6 `DateParserService`
- [ ] Receber data crua (string) + array de `date_formats` da fonte + `timezone_default`
- [ ] Tentar parse na ordem: formatos configurados da fonte → autodetect do Carbon
- [ ] Retornar objeto com:
  - [ ] `raw` (string original)
  - [ ] `parsed` (Carbon no timezone original)
  - [ ] `utc` (Carbon em UTC)
  - [ ] `timezone` (string do timezone detectado)
  - [ ] `source` (rss_pubDate, rss_isoDate, jsonld, og_tag, time_tag, text_pattern)

### 2.7 `ArticleExtractorService`
- [ ] Receber HTML da página + configuração de seletores da fonte
- [ ] Implementar extração em camadas (A → B → C → D → E):
  - [ ] **Camada A:** Parse JSON-LD (`schema.org/NewsArticle`)
  - [ ] **Camada B:** Parse Open Graph meta tags
  - [ ] **Camada C:** Parse HTML semântico com seletores CSS do banco
  - [ ] **Camada D:** Aplicar `BoilerplateCleanerService` ao corpo
  - [ ] **Camada E:** Aplicar seletores custom (override por fonte)
- [ ] Merge inteligente: preencher campos faltantes de camadas inferiores
- [ ] Calcular `extraction_completeness` (score 0–100)

---

## Fase 3 — Spiders e Jobs (Orquestração de Crawling)

> **Objetivo:** Conectar os serviços do `Fase 2` em um pipeline executável via filas do Laravel/Horizon.

### 3.1 `GenericDiscoverySpider` (RoachPHP)
- [ ] Receber configuração da `NewsSource` (injetada via construtor/contexto)
- [ ] Decidir estratégia de descoberta baseado no `discovery_mode`:
  - [ ] `feed` → Buscar e parsear RSS/Atom
  - [ ] `sitemap` → Buscar e parsear `sitemap.xml` / `news-sitemap.xml`
  - [ ] `html_listing` → Navegar `listing_urls`, buscar `<a>` que conferem `article_url_patterns`
  - [ ] `auto` → Tentar feed → sitemap → listing (nessa ordem)
- [ ] Para cada URL encontrada: normalizar, gerar hash, verificar se já existe no banco
- [ ] Emitir itens novos para o `PersistencePipeline` (criar `NewsItem` com status `pending`)

### 3.2 `GenericArticleSpider` (RoachPHP)
- [ ] Receber `NewsItem` com `status=pending` + configuração da `NewsSource`
- [ ] Decidir se precisa buscar HTML:
  - [ ] Se `feed_quality_profile=full` e item já veio completo do feed → pular fetch, marcar `content_source=feed_only`
  - [ ] Se `feed_quality_profile=partial|teaser_only` → buscar HTML via `HttpFetchService`
  - [ ] Se `render_js_required=true` → usar Panther (Headless Browser)
- [ ] Passar HTML para `ArticleExtractorService`
- [ ] Emitir item processado para pipelines de limpeza e persistência

### 3.3 RoachPHP Pipelines
- [ ] `DeduplicationPipeline` — Verifica `url_hash` no banco, descarta duplicatas
- [ ] `BoilerplateCleaningPipeline` — Aplica `BoilerplateCleanerService` ao corpo HTML
- [ ] `PersistencePipeline` — Salva/atualiza `NewsItem` + `NewsItemMedia` no banco

### 3.4 `FetchNewsSourceJob` (Laravel Job)
- [ ] Disparado pelo Scheduler (cron) conforme `throttle_config` de cada fonte ativa
- [ ] Verificar `consecutive_failures` (Circuit Breaker: pausar se > N)
- [ ] Executar `GenericDiscoverySpider` para a fonte
- [ ] Para cada item novo encontrado: disparar `ProcessNewsItemJob`
- [ ] Atualizar `last_sync_at`, `success_rate`, `avg_response_ms`, `last_items_found`
- [ ] Em caso de erro: incrementar `consecutive_failures`, logar erro

### 3.5 `ProcessNewsItemJob` (Laravel Job)
- [ ] Receber `NewsItem` pendente
- [ ] Executar `GenericArticleSpider` para extração
- [ ] Após sucesso: atualizar `status` para `extracted`
- [ ] Disparar `ClassifyNewsItemJob` (AI Job 1)

### 3.6 Scheduler (Console Kernel)
- [ ] Comando artisan `news-radar:dispatch-sources` — Percorre todas as `NewsSource` ativas, verifica se `now >= next_sync_at`, e enfileira `FetchNewsSourceJob`
- [ ] Rodar a cada 1 minuto (o comando internamente respeita o throttle de cada fonte)
- [ ] Comando artisan `news-radar:health-check` — Relatório de fontes com falhas consecutivas
- [ ] Rodar a cada 1 hora

---

## Fase 4 — Onboarding Inteligente de Fontes (Painel + API)

> **Objetivo:** Criar o "Wizard" de cadastro de fonte no backend e garantir que o frontend consiga consumir a API.

### 4.1 `SourceDiscoveryService`
- [ ] Método `discover(string $url)`:
  - [ ] Usar `spatie/crawler` para navegar a homepage
  - [ ] Detectar `<link rel="alternate" type="application/rss+xml">`
  - [ ] Tentar acessar `/sitemap.xml`, `/news-sitemap.xml`, `/sitemap_news.xml`
  - [ ] Coletar todos os links `<a href>` da homepage
  - [ ] Identificar padrões de URL que parecem ser artigos (`/noticias/`, `/2026/03/`)
  - [ ] Detectar se o site precisa de JS (resposta vazia ou `<div id="app">` sem conteúdo)
- [ ] Método `analyzeFeed(string $feedUrl)`:
  - [ ] Parsear 5 itens do feed
  - [ ] Calcular `FeedQualityScore`
  - [ ] Detectar boilerplates
  - [ ] Retornar diagnóstico completo
- [ ] Método `previewArticles(string $feedUrl, int $count = 3)`:
  - [ ] Parsear feed, pegar os primeiros N itens
  - [ ] Para cada: extrair título, data, imagem, corpo (usando `ArticleExtractorService`)
  - [ ] Retornar cards de preview para o frontend

### 4.2 `SourceDiscoveryController`
- [ ] `POST /api/v1/news-radar/sources/discover` — Recebe `url`, dispara discovery (async), retorna job ID
- [ ] `GET /api/v1/news-radar/sources/discover/{jobId}/status` — Retorna progresso e resultado do discovery
- [ ] `POST /api/v1/news-radar/sources/preview` — Recebe `feed_url`, retorna 3 cards de preview
- [ ] `POST /api/v1/news-radar/sources/test-selector` — Recebe `url` + `selector`, retorna conteúdo extraído (para ajuste fino no painel)

### 4.3 `NewsSourceController` (CRUD)
- [ ] `GET    /api/v1/news-radar/sources` — Listar fontes (com filtros: active, profile, failures)
- [ ] `POST   /api/v1/news-radar/sources` — Criar nova fonte (com configuração completa)
- [ ] `GET    /api/v1/news-radar/sources/{id}` — Exibir detalhes da fonte (com métricas de saúde)
- [ ] `PUT    /api/v1/news-radar/sources/{id}` — Atualizar configuração da fonte
- [ ] `DELETE /api/v1/news-radar/sources/{id}` — Desativar/remover fonte (soft delete)
- [ ] `POST   /api/v1/news-radar/sources/{id}/sync` — Forçar sync manual imediato

### 4.4 `NewsItemController` (Leitura)
- [ ] `GET /api/v1/news-radar/items` — Listar notícias (filtros: source, theme, city, date_range, status)
- [ ] `GET /api/v1/news-radar/items/{id}` — Detalhe da notícia (com AI metadata, media, cluster)
- [ ] `GET /api/v1/news-radar/items/{id}/related` — Notícias relacionadas (embeddings/cluster)
- [ ] `GET /api/v1/news-radar/dashboard` — Resumo: totais por fonte, por tema, alertas de fontes com falha

---

## Fase 5 — Inteligência Artificial e Enriquecimento

> **Objetivo:** Implementar os dois Jobs de IA e o sistema de Embeddings/Clusters.

### 5.1 `AiEnrichmentService`
- [ ] Configurar client `openai-php/laravel` (API key, model default)
- [ ] Método `classifyBasic(NewsItem $item)` — **Job 1**
  - [ ] Montar prompt com título + excerpt + primeiros 2000 chars do `body_text`
  - [ ] Enviar via Responses API com JSON Schema estrito:
    - [ ] `city`, `state_abbr`, `theme` (enum), `urgency` (enum), `relevance_score`, `entities[]`
  - [ ] Salvar resultado em `news_item_ai_metadata`
  - [ ] Se `relevance_score >= 0.7` → disparar Job 2
- [ ] Método `enrichEditorial(NewsItem $item)` — **Job 2**
  - [ ] Montar prompt expandido para 5W1H
  - [ ] JSON Schema: `five_ws{}`, `suggested_titles[]`, `summary_bullets[]`
  - [ ] Atualizar `news_item_ai_metadata` com nível 2

### 5.2 `ClassifyNewsItemJob` (AI Job 1)
- [ ] Receber `NewsItem` com `status=extracted`
- [ ] Chamar `AiEnrichmentService::classifyBasic()`
- [ ] Atualizar `status` para `enriched_l1`
- [ ] Se relevância alta → disparar `EnrichNewsItemJob`

### 5.3 `EnrichNewsItemJob` (AI Job 2)
- [ ] Receber `NewsItem` com `status=enriched_l1`
- [ ] Chamar `AiEnrichmentService::enrichEditorial()`
- [ ] Atualizar `status` para `enriched_l2`

### 5.4 Embeddings e Clusterização (Fase futura — v2)
- [ ] Gerar embedding via API OpenAI (`text-embedding-3-small`)
  - [ ] Input: `title` + `excerpt` + primeiros 1000–2000 chars limpos
- [ ] Armazenar vetor na tabela `news_item_embeddings` (ou PgVector/Redis)
- [ ] Ao inserir novo item: comparar embedding com últimas 48h
  - [ ] Cosine Similarity > 0.85 → criar/vincular `NewsCluster`
- [ ] API de "notícias relacionadas" consulta por proximidade vetorial

### 5.5 Batch API para Reprocessamento Histórico (Fase futura — v2)
- [ ] Comando artisan `news-radar:batch-enrich` — Exporta JSONL
- [ ] Enviar via Batch API da OpenAI
- [ ] Importar resultados quando completo

---

## Fase 6 — Frontend (Painel Administrativo React)

> **Objetivo:** Criar as telas no SPA React para gerenciamento de fontes e visualização de notícias.

### 6.1 Services & Types (TypeScript)
- [ ] Criar `newsRadar.service.ts` com interfaces e chamadas API
- [ ] Definir tipos: `NewsSource`, `NewsItem`, `AiMetadata`, `DiscoveryResult`, `PreviewCard`

### 6.2 Página: Listagem de Fontes (`/radar/fontes`)
- [ ] Tabela com colunas: Nome, Perfil, Status, Último Sync, Falhas, Taxa Sucesso
- [ ] Badges visuais por `feed_quality_profile` (Full ✅, Noisy ⚠️, Teaser 🔍)
- [ ] Indicador de saúde (verde/amarelo/vermelho baseado em `consecutive_failures`)
- [ ] Ações: Editar, Sync Manual, Desativar

### 6.3 Página: Wizard Nova Fonte (`/radar/fontes/nova`)
- [ ] **Step 1:** Input da URL + botão "Analisar"
- [ ] **Step 2:** Exibição do diagnóstico automático:
  - [ ] Feed encontrado? Sim/Não
  - [ ] Qualidade: Full/Partial/Teaser
  - [ ] Boilerplates detectados (lista)
  - [ ] Precisa JS? Sim/Não
- [ ] **Step 3:** Preview de 3 cards de matérias recentes
- [ ] **Step 4:** Ajuste fino (seletores CSS, regras de limpeza, exclusões de URL)
- [ ] **Step 5:** Periodicidade sugerida (com possibilidade de override manual)
- [ ] **Step 6:** Confirmação e salvamento

### 6.4 Página: Edição da Fonte (`/radar/fontes/:id/editar`)
- [ ] Formulário com todos os campos da fonte
- [ ] Editor de `crawling_config` (seletores, boilerplate rules)
- [ ] Botão "Testar Seletor" (chama API `/test-selector`)
- [ ] Histórico de syncs recentes (últimos 10)

### 6.5 Página: Feed de Notícias (`/radar/noticias`)
- [ ] Lista/Grid de notícias capturadas (cards com imagem, título, fonte, data, tema)
- [ ] Filtros: Fonte, Tema, Cidade, Período, Status
- [ ] Busca por texto
- [ ] Ordenação: mais recentes, mais relevantes

### 6.6 Página: Detalhe da Notícia (`/radar/noticias/:id`)
- [ ] Corpo da matéria renderizado
- [ ] AI Metadata (cidade, tema, urgência, 5W1H)
- [ ] Galeria de imagens
- [ ] Sidebar com "Notícias Relacionadas" (cluster)
- [ ] Fonte original (link externo)

### 6.7 Página: Dashboard do Radar (`/radar`)
- [ ] Totais: notícias hoje, esta semana, este mês
- [ ] Gráfico por tema (pizza/barra)
- [ ] Gráfico por fonte (barras horizontais)
- [ ] Alertas: fontes com falha, fontes inativas
- [ ] Últimas notícias de alta urgência/relevância

---

## Fase 7 — Testes e Qualidade

> **Objetivo:** Garantir que o sistema é confiável e detecta quebras automaticamente.

### 7.1 Testes Unitários
- [ ] `UrlNormalizerServiceTest` — UTMs, trailing slash, https
- [ ] `FeedParserServiceTest` — Fixtures de feeds reais (Mesorregional, SCC10, Itapema, etc.)
- [ ] `FeedQualityScorerServiceTest` — Scores corretos para cada perfil
- [ ] `BoilerplateCleanerServiceTest` — Remoção de style, CTAs, rodapé WP
- [ ] `DateParserServiceTest` — Formatos variados + timezones + fallbacks
- [ ] `ArticleExtractorServiceTest` — Camadas A→E com HTML fixtures

### 7.2 Testes de Feature (API)
- [ ] CRUD de `NewsSource`
- [ ] Discovery endpoint
- [ ] Preview endpoint
- [ ] Listagem de `NewsItem` com filtros
- [ ] Dashboard endpoint

### 7.3 Testes do Spider/Pipeline
- [ ] RoachPHP inclui helpers de teste para spiders
- [ ] Fixtures HTML simulando portais (com e sem JSON-LD, com e sem OG tags)
- [ ] Testar deduplicação, limpeza e persistência

---

## Fase 8 — Operação e Monitoramento (Pós-Deploy)

> **Objetivo:** Garantir que o radar funciona 24/7 com visibilidade sobre falhas.

### 8.1 Workers & Filas
- [ ] Configurar fila dedicada `news-radar` no `queue.php`
- [ ] Configurar workers no Horizon (ou supervisor) para a fila `news-radar`
- [ ] Configurar timeout dos jobs (discovery pode ser lento)

### 8.2 Monitoramento
- [ ] Log estruturado por fonte (channel dedicado `news-radar`)
- [ ] Alerta quando `consecutive_failures >= 5`
- [ ] Alerta quando nenhuma notícia nova em 24h para fonte ativa
- [ ] Dashboard de saúde das fontes (taxa de sucesso, response time médio)

### 8.3 Circuit Breaker
- [ ] Após N falhas consecutivas: marcar fonte como `active=false`
- [ ] Notificar operador via painel (badge de alerta)
- [ ] Botão no painel para "Reativar e testar agora"

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
