# 3. Fluxos de Coleta (Crawling & Extração)

O processo central (`CrawlEngine`) é disparado via Cron (Laravel Scheduler / Horizon), enfileirando _Jobs_ (ex: `FetchNewsSourceJob`) baseados na periodicidade de cada fonte cadastrada.

## 3.1. Ordem de Descoberta Prioritária

O objetivo da "Descoberta" não é baixar a notícia inteira, mas sim coletar os links (URLs) das matérias que ainda não existem no nosso banco (comparação via `URL` hash ou campo `guid` do feed).

O sistema obedece rigorosamente a seguinte hierarquia para **Descoberta**:

1.  **Feed Automático / RSS (Opcional):** Fonte mais barata e rápida.
    *   **Sucesso:** Encontra títulos, links e formato de pre-data. Inicia o "Item Bruto".
    *   **Limitação do Feed:** Falta campo de imagem de capa, texto quebrado, dados incompletos ou sumário apenas? Passamos para o resgate do **HTML da Matéria**.
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
    *   Uma marcação confiável `<article>`, ou um `<time datetime="YYYY..."></time>`. O acesso aos nós do DOM é simplificado pelas abstrações de configuração salvas com `symfony/css-selector`.
4.  **Camada D — Fallback Readability / Extração Limpa (O Miolo da Notícia):**
    *   O corpo denso da matéria (`body`) dificilmente encontra-se inteiro nas meta tags. Aqui entram os extratores configurados manualmente pelo usuário para a fonte, ou abordagens "_Zero Config_" (Semelhante ao `readability-php`  / Trafilatura) para limpar blocos gigantescos de HTML repletos de anúncios e focar no _Main Content_.
5.  **Camada E — Sobrescrita do Operador (O Extrator Custom):**
    *   O painel salvou uma configuração customizada para esta URL/Domínio. O Extrator custom (`CSS`/`XPath` armazenado no banco) sobrepõe todas as lógicas genéricas acima. Útil para "Portais Teimosos".

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
