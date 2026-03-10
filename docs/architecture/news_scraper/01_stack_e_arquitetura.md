# Stack e Arquitetura do Sistema de Raspagem de Notícias

Para garantir escalabilidade, resiliência e facilidade de manutenção, a arquitetura de raspagem de notícias foi desenhada combinando ferramentas especializadas do ecossistema PHP/Laravel na construção de um pipeline robusto. O foco é a **composição** de ferramentas especializadas em vez de uma única solução monolítica.

## 1. Stack Tecnológica (Laravel/PHP)

A stack foi escolhida considerando as melhores práticas para _web scraping_, extração de dados e integração com IA.

| Responsabilidade | Ferramenta Recomendada | Descrição |
| :--- | :--- | :--- |
| **Motor de Crawling & Pipeline** | `roach-php/laravel` | Toolkit completo inspirado no Scrapy. Ideal para criar pipelines e gerenciar requisições. O diferencial arquitetural aqui é ter apenas **um** `GenericArticleSpider`, que lê as regras do banco, e não "um spider por portal". |
| **Parser de HTML** | `symfony/dom-crawler`<br>`symfony/css-selector` | Extração segura via navegação em nós DOM. O componente de CSS Selector é vital para permitir que o operador do painel cadastre os elementos usando seletores conhecidos web (ex: `.article-body h1`), sem a complexidade de XPath. |
| **Transporte HTTP Concorrente & MIddlewares** | `guzzlehttp/guzzle` | Mais que um cliente HTTP padrão, atua como a camada operacional (`HttpFetchService`), gerenciando concorrência (Promises), `retries` com backoff, timeouts específicos, `user-agent` rotativos e limites de conexão (`politeness`). |
| **Descoberta de Links (Painel Onboarding)** | `spatie/crawler` | Exclusivo para o assistente de cadastro/painel. Excelente para validar padrões de URL e descobrir links rápidos na home do portal alvo de forma assíncrona. Não participa da rotina diária pesada de extração (deixada para o Roach). |
| **Fallback Dinâmico (JS Pesado)** | `symfony/panther` | Para sites onde o conteúdo essencial só é renderizado via JavaScript. Opera via headless browser. Deve ser mantido **estritamente como exceção** controlada (`render_js_required = false` por padrão), devido ao alto custo operacional. |
| **Normalização de Datas & Timezone** | `nesbot/carbon` | Tratamento robusto para os diversos formatos (`createFromLocaleFormat`, etc). |
| **Normalização de URLs** | `league/uri` | Vital para canonicalização de links: limpando traços finais (`trailing slash`), removendo tags inúteis de campanha (`?utm_source`), e padronizando acessos HTTP/HTTPS na desduplicação. |
| **Integração com IA (Enriquecimento)** | `openai-php/laravel` | Foco total no uso do **Structured Outputs** para recebimento estrito do esquema JSON e Responses API. Opera de forma totalmente desconectada do processo imediato de *crawl*. |

## 2. Princípios da Decisão Arquitetural Chave

*   **Não criar código por portal:** Trocar o "Fluxo manual do portal A" por uma "Configuração SQL do Portal A". O sistema deverá ter Spiders e Serviços Genéricos (`GenericDiscoverySpider` e `GenericArticleSpider`) capazes de ler a instrução do Banco de Dados e processar as extrações.
*   **Descoberta > Crawling Cego:** A coleta tenta vias estruturadas primeiro antes de varrer o HTML indiscriminadamente. A ordem preferencial de descoberta é:
    1.  RSS / Feed Automático (para conteúdo novo)
    2.  Sitemaps / News Sitemaps (`sitemap.xml`, `news-sitemap.xml`)
    3.  Páginas de Listagem (Crawling HTML)
*   **Extração em Camadas Diferenciadas:** Semelhante à descoberta estruturada, a extração de dados na página de uma matéria busca metadados ricos primeiramente:
    1.  Camada A: Dados Estruturados (JSON-LD `NewsArticle`, `schema.org/Article`).
    2.  Camada B: Meta Tags Nativas / OGP (`og:title`, `article:published_time`).
    3.  Camada C: HTML Semântico e Seletores Específicos do Banco.
    4.  Camada D: Fallback de Limpeza (Ferramentas de Readability para capturar o corpo de texto principal).
*   **A IA atua Pós-Captação (Async):** A Inteligência Artificial não bloqueia a coleta de dados. Ela atua em processos de background (Filas / `Jobs` no Laravel), enriquecendo as instâncias de matérias já salvas no banco.
*   **Datas são Tratadas como Cidadãos de Primeira Classe:** Diante da imprevisibilidade cronológica dos feeds, o dado original (cru) e a data processada são armazenadas de forma independente.

---

A seguir, consulte os detalhes de [Esquema do Banco de Dados e Cadastro da Fonte](02_banco_e_cadastro.md) e [Fluxo de Coleta e Inteligência Artificial](03_fluxos_e_ia.md).
