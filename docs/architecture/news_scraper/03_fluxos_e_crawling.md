# 3. Fluxos de Coleta (Crawling & Extração)

O processo central (`CrawlEngine`) é disparado via Cron (Laravel Scheduler / Horizon), enfileirando _Jobs_ (ex: `FetchNewsSourceJob`) baseados na periodicidade de cada fonte cadastrada.

## 3.1. Ordem de Descoberta Prioritária

O objetivo da "Descoberta" não é baixar a notícia inteira, mas sim coletar os links (URLs) das matérias que ainda não existem no nosso banco (comparação via `URL` hash ou campo `guid` do feed).

O sistema obedece rigorosamente a seguinte hierarquia para **Descoberta**:

1.  **Feed Automático / RSS (Não é a fonte final da verdade):**
    *   **Descoberta Pura vs Conteúdo:** O feed não pode ser tratado cegamente. Ele é filtrado por **Regras de Qualidade**:
        *   **Regra 1 (Prioridade de Campos do Parser):** Busca-se `title`/`title`, `dc:creator`/`creator`, `isoDate`/`pubDate`, `content:encoded`/`content`, `categories`, `link`, `guid`.
        *   **Regra 2 (Identificador & Canonicalização):** O link do feed (ex: `link`) passa obrigatoriamente por limpeza (remover UTMs como `?utm_source=rss`). O `guid` é salvo apenas como apoio, nunca como URL principal (devido a peculiaridades como o `?p=123` do WordPress).
        *   **Regra 3 (Classificação Automática do Feed):**
            *   **`wordpress_full_content`:** Se o *Feed Score* é alto (>80 pts: tem `isoDate`, imagem, `content:encoded` longo e autor). Usa-se o feed quase como matéria final. Falhas de escopo engatilham acesso à página.
            *   **`wordpress_full_but_noisy`:** Feed completo, porém imundo. Engatilha os *Limpadores de Boilerplate* (`remove_selectors` como `<style>`, `scripts`, e textos como "O post apareceu primeiro em...").
            *   **`wordpress_teaser_only`:** Feed pobre (< 50 pts: apenas resumo curto). O sistema marca como *Discovery Only* e enfileira acesso obrigatório ao HTML completo.
    *   **Limitação do Feed:** Mesmo nos feeds "Full", a camada de extração HTML é o fallback para buscar o que falhou na Descoberta (ex: Imagem em alta resolução).
2.  **Sitemaps / News Sitemap (`sitemap.xml`):** Segunda via mais rápida. Ajuda a ter cobertura profunda de URLs (`<url>`, `<loc>`, `<lastmod>`), superando a limitação numérica de RSS feeds curtos.
3.  **Crawling de Páginas de Listagem (Fallback de Descoberta):** O portal não possui Feed ou Sitemap estruturado.
    *   Ação: Um web crawler navega nas categorias ("`/noticias`", "`/últimas`"), varrendo os elementos `<a>` que conferem com os `article_url_patterns` configurados. Essa etapa deve respeitar diretivas `robots.txt` e `Throttle/Rate Limiting` implementado via Guzzle.

## 3.2. A Ordem de Extração (O Domicílio da Informação)

Após a "Descoberta", uma Fila/Job de processamento específico por Matéria (`ProcessNewsItemJob`) baixa o conteúdo de cada URL. A etapa de **Extração**, similar à Descoberta, funciona de cima para baixo:

1.  **Camada A — Dados Estruturados Ocultos (`application/ld+json`):**
    *   Tentamos localizar no `<head>` o formato `schema.org/NewsArticle` (JSON-LD). Onde existem tags padronizadas (`headline`, `image`, `datePublished`). Ferramenta: `symfony/dom-crawler` parseando a tag `<script>`.
2.  **Camada B — Open Graph / Twitter Cards / Meta Natives:**
    *   Na falha parcial ou total da Camada A, procuramos `meta[property="og:title"]`, `meta[property="article:published_time"]`, `og:image`.
3.  **Camada C — HTML Semântico (O Domcrawler + CssSelector em Ação):**
    *   Uma marcação confiável `<article>`, ou um `<time datetime="YYYY..."></time>`. O acesso aos nós do DOM é simplificado pelas abstrações de configuração salvas com `symfony/css-selector`. Atenção especial ao salvar imagens (ignorando emojis ou diretórios `/s.w.org/`, dando preferência a maiores resoluções se houver `srcset`, e separando `hero_image` de `gallery_images`).
4.  **Camada D — Boilerplate Removal & Limpeza Padrão:**
    *   A aplicação de filtros de remoção de ruídos no HTML (CTAs do WhatsApp embutidos no texto, blocos de `<style>`). O `contentSnippet` originado do feed **não serve como texto final**, funciona apenas para _preview_ painel/card rápido da matéria.
5.  **Camada E — Sobrescrita do Operador (O Extrator Custom):**
    *   O painel salvou uma configuração customizada para esta URL/Domínio (Ex: "O texto desta rádio específica está na `div.materia-corpo>p`"). O Extrator custom (`CSS`) sobrepõe as lógicas genéricas. Útil para "Portais Teimosos".

## 3.3 Gestão de Autorias

Em inúmeros feeds, encontram-se redundâncias (`creator` e `dc:creator`). A arquitetura padroniza o uso primário da tag qualificada (`dc:creator`). É imprescindível manter em banco o `author_raw` vindo do feed ("Redação PMI", "Evandro JR") antes de tentar a reconciliação (matching com 'autores conhecidos' institucionais ou jornalistas da casa).

## 3.3. Fallback de Páginas Ricas (JavaScript Heavy)

A coleta normal utiliza transporte HTTP leve através da classe orquestradora `HttpFetchService` (baseada no `Guzzle`), operando apenas na resposta string bruta.
No entanto, alguns sites modernos montam seu _grid_ de notícias e conteúdo inteiramente do lado do cliente via React/Vue/Angular.

**A Exceção Controlada (`symfony/panther`):**

A configuração da fonte (`news_sources`) deverá possuir uma _flag_ `render_js_required = true`. Esta "chave grifa" só é ativada se uma página fundamental sabidamente falhou no modo leve de requisições. O recurso do WebDriver Panther não se tornará a regra do ecossistema.

*   A engine sobe um ambiente Chrome Headless.
*   Espera X segundos (Wait until `DOM carregou elemento .titulo`).
*   Injeta um DOM gerado virtualmente e repassa de volta ao `DomCrawler`.

**Uso Recomendado:**
Estritamente restritivo. Apenas ativado via teste/painel pelo usuário após falha das tentativas leves. Demanda CPU e Memória (o processo de *crawl* torna-se centenas de vezes mais lento e vulnerável à expiração do limite de tempo - timeout).

## 3.4 Operações de Proteção de Crawling (Middlewares)

Para sustentar a arquitetura a longo prazo, o uso do Guzzle não é feito diretamente via `Http::get()`, e sim por um **HandlerStack / Middlewares**:

*   **AutoThrottle (Polidez/Concorrência):** Intervalos obrigatórios e _promises_ assíncronos. Limites globais ou específicos por Domínio devem introduzir atrasos aleatórios entre requests sequenciais.
*   **Retry Middleware (Backoff Exponencial):** Configurado para identificar falhas temporárias (HTTP 500, `429 Too Many Requests`, Timeouts) e aguardar _Y_ segundos antes da próxima tentativa sem reprovar o Job imediatamente.
*   **Monitoramento da Fonte (Circuit Breaker):** Configuração máxima de `consecutive_failures`. Diante de retornos 404/403 persistentes (Ex: Prefeitura reformulou site), a Origem é *Pausada*, resguardando recursos da AWS/VPS.
*   **User-Agent e Headers Específicos:** Manipulação individual para portais exigentes (forçar um `Accept-Language` ou disfarçar com UA de Chrome em vez do UA do Guzzle). Respeito à política `robots.txt` a menos que justificado tecnicamente.
