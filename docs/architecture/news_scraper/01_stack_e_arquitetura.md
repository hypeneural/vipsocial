# Stack e Arquitetura do Sistema de Raspagem de Notícias

Para garantir escalabilidade, resiliência e facilidade de manutenção, a arquitetura de raspagem de notícias foi desenhada combinando ferramentas especializadas do ecossistema PHP/Laravel na construção de um pipeline robusto. O foco é a **composição** de ferramentas especializadas em vez de uma única solução monolítica.

## 1. Stack Tecnológica (Laravel/PHP)

A stack foi escolhida considerando as melhores práticas para _web scraping_, extração de dados e integração com IA.

| Responsabilidade | Ferramenta Recomendada | Descrição |
| :--- | :--- | :--- |
| **Motor de Crawling & Pipeline** | `roach-php/laravel` | Toolkit completo inspirado no Scrapy. Ideal para criar spiders, gerenciar pipelines de itens e middlewares. Substitui lógicas complexas e repetitivas por spiders focados. |
| **Parser de HTML** | `symfony/dom-crawler` | Extração segura via navegação em nós DOM (Xpath/CSS selectors), superando em muito a fragilidade de Expressões Regulares (Regex) no parseamento de HTML. |
| **Transporte HTTP Concorrente** | `guzzlehttp/guzzle` | Cliente HTTP padrão, gerenciando requisições síncronas/assíncronas, retries, timeouts e alta concorrência. |
| **Descoberta de Links** | `spatie/crawler` | Focado em descobrir páginas a partir de uma base. Excelente para auxiliar o usuário no cadastro da fonte (encontrar links de notícias na home, por exemplo). |
| **Fallback para Sites Dinâmicos (JS)** | `symfony/panther` | Para sites onde o conteúdo essencial só é renderizado via JavaScript. Opera via headless browser. Deve ser usado estritamente como fallback (exceção), devido ao custo operacional (memória/tempo). |
| **Normalização de Datas & Timezone** | `nesbot/carbon` | Tratamento robusto para os diversos formatos de data/hora (ex: `2026-03-10T14:23:00-03:00`, `10/03/2026 14:23`) com total suporte a locais e formatos customizados (`createFromLocaleFormat`, etc). |
| **Integração com Inteligência Artificial** | `openai-php/laravel` | Cliente PHP consolidado para a API da OpenAI. Foco total em **Structured Outputs** (JSON Schema) para recebimento previsível e tipado das entidades extraídas da notícia. |

## 2. Princípios da Arquitetura

*   **Configuração por Fonte (Data-Driven Crawler):** Os spiders não devem conter _hardcode_ da estrutura HTML do alvo. O código do spider deve ser limpo, extraindo as instruções de raspagem (URL, seletores, timezone) diretamente do banco de dados para a fonte correspondente.
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
