# Documentação da Stack e Arquitetura de Coleta de Notícias

Este documento apresenta a stack tecnológica atual do projeto e detalha a arquitetura proposta para a operação robusta, inteligente e escalável de coleta (scraping), classificação e enriquecimento de notícias, bem como a preparação para integrações com Inteligência Artificial (I.A.).

---

## 1. Stack Tecnológica Atual

A arquitetura do nosso ecossistema é separada em Backend (API) e Frontend (Aplicação SPA).

### Backend & API
- **Linguagem & Framework:** PHP 8+ com Laravel. O Laravel nos oferece um ecossistema robusto para a construção de APIs RESTful.
- **Banco de Dados:** MySQL para dados relacionais (estruturação de eventos, notícias, enquetes, galerias VIP, logs, etc).
- **Processamento Assíncrono (Filas):** Redis + Laravel Horizon (ou filas padrão do Laravel via database/Redis). Usado intensamente para processamento em background (como disparo de mensagens WhatsApp, sincronização, downloads).
- **Agendamento de Tarefas:** Laravel Scheduler (via Cron) para a execução periódica de rotinas (sincronização de grupos, automações de fechamento, etc).
- **Autenticação:** JWT ou Laravel Sanctum para segurança na comunicação com a API.

### Frontend
- **Framework:** Vite + React com TypeScript (TSX).
- **Gerenciamento de Estado & Requisições:** React Query (para cache e sincronização com a API).
- **Estilização e Componentes:** Tailwind CSS para estilos utilitários aliados ao Shadcn UI para componentes acessíveis e padronizados.
- **Roteamento:** React Router para navegação como uma Single Page Application (SPA).
- **Manipulação de Datas:** Bibliotecas nativas Intl ou libs enxutas para tratamento de fusos horários (`America/Sao_Paulo`).

---

## 2. Arquitetura de Captura de Notícias (Scraping)

Atualmente tínhamos um fluxo no `n8n` para ler RSS de portais. Contudo, as origens variam: algumas têm RSS, outras não; algumas exigem entrar no link para buscar a imagem/conteúdo completo (Scraping HTML ativo).

Para absorver essa complexidade de forma nativa e limpa dentro do ecossistema do Laravel, a seguinte arquitetura de **Pipeline (ETL)** é proposta:

### 2.1 Padrão de Projeto: Estratégia (Strategy Pattern) e Adapters

Em vez de um script monolítico cheio de "_if porta = A, regex B_", a arquitetura orientada a objetos define "Fonte de Notícia" (NewsSource) e "Adaptadores" (Adapters). 

- **Interface `SourceAdapter`**:
  - `fetchList()`: Como buscar a lista de links (via RSS node/xml, REST, ou DOM Crawler básico na home).
  - `fetchArticle(url)`: Como buscar o conteúdo detalhado da página da notícia. Extractores específicos lidam com `head > og:image`, `article content`, etc.
  
As tarefas são em sua essência dois Jobs de fila do Laravel separados:
1. `Job: FetchNewsList` (Busca os últimos links e insere na fila secundária se for novo).
2. `Job: ScrapeNewsArticle` (Acessa o HTML do portal, extrai imagem correta, limpa o texto, processa data e salva).

### 2.2 Tratamento Robusto do HTML e Textos (Substituição de Regex)
O script antigo via n8n usava muito regex para parsing HTML, quebrava fácil e era trabalhoso de manter.
- **Novo Método:** Para o parsing ativo em PHP, usaremos o componente nativo `Symfony\Component\DomCrawler\Crawler` do Laravel ou bibliotecas amigáveis como o `Goutte` para varrer o DOM através de seletores CSS (`img`, `p`, `.post-content`). Ele extrai e sanitiza os textos utilizando `strip_tags` ao invés de manipulações de string complexas.

---

## 3. Gestão e Frequência Periódica (Smart Crawling)

Nem todos os sites atualizam com a mesma frequência (Ex: prefeituras postam 1x por dia, G1 posta 10x por hora). Pingar todos os sites a cada X minutos desperdiça recursos e energia, e pode até causar banimentos temporários.

**Arquitetura "Smart Crawling":**
1. **Model `NewsSource`**:
   - `base_url`: A URL do portal.
   - `crawl_interval_minutes`: O intervalo dinâmico de coleta.
   - `last_run_at`: Quando rodou,
   - `average_posts_per_day`: Uma métrica atualizada constantemente.
2. **Dynamic Scheduler**:
   - Um comando no Laravel (e.g. `artisan news:schedule`) roda a cada 1 minuto. Ele pesquisa a tabela `NewsSources` onde `now()` > `last_run_at + crawl_interval_minutes`. 
   - Ao executar a coleta de uma prefeitura, se descobrirmos que nas últimas 48h houve exatamente 1 notícia, **o próprio sistema pode ajustar** progressivamente o valor de `crawl_interval_minutes` da fonte de 60 para 240 minutos (adaptive rate limits).
   - Sites de grande volume (Ex: SCC10) são mantidos fixos com intervalo agressivo (Ex: a cada 5 ou 10 mins).

---

## 4. Evolução: Ingestão em Tempo Real & Outros Canais

### WhatsApp & Webhooks
A estrutura de "Adaptadores" desenhada permite a construção fácil de _Pipes de Ingestão_.
- **Webhooks PUSH:** Portais parceiros que possuam tecnologia podem invocar a nossa API quando publicarem algo. (Eventing)
- **WhatsApp Bot / Ingestão Direta:** Da mesma forma que o sistema lida com o "Cobertura VIP", o bot via Z-API/Baileys passará os textos longos para uma interface interna da API que apenas diz `ProcessNewsMessageJob`.
  - Esse Job verificará links anexos, extrai a URL e manda para o `ScrapeNewsArticle`.
  - Diferença: o gatilho não é cronológico, mas via evento gerado pelo Webhook do WhatsApp de um jornalista de campo enviando matéria, etc.

---

## 5. Implementação de Inteligência Artificial (O "Cérebro" Jornalístico)

Uma vez que o texto cru entra no banco (tabela `news_inbox` ou similar), podemos despachar um Job `AnalyzeNewsContentWithAI`, utilizando integrações com a API da OpenAI (ou similar). 

### Foco da Classificação Algorítmica (Prompts Especializados)

A requisição de IA (ex: Chat Completions GPT-4o-mini ou GPT-3.5) recebe o título + texto sujo em markdown. O prompt de sistema será orientado a JSON puro (`response_format: json_object`) para retornar objetos tipados contendo:

1. **Jornalismo 5W1H:**
   - **O que** (What) - Evento central.
   - **Quem** (Who) - Pessoas/Entidades.
   - **Onde** (Where) - Cidades, local geográfico (Para relacionar as tags "Notícias Locais" no seu sistema de municípios de SC).
   - **Quando** (When)
   - **Por que/Como** (Why/How)
2. **Classificação & Tagueamento Ativo:**
   - `sentiment`: Positivo, Negativo, Neutro.
   - `categories`: [Política, Esporte, Trânsito, Policial, Educação].
3. **Reescrita & Geração de Conteúdo:**
   - Opcionalmente, pode-se pedir para a IA gerar um resumo curto estilo manchete "Flash" pronto para ser disparado em grupos do WhatsApp (via integração de Disparo de Mensagem), ou adaptar a linguagem institucional para chamadas envolventes em redes sociais.

---

## Resumo e Ordem de Tarefas Recomendadas (Roadmap)

**Fase 1: Motor Base & Crawling (Sem I.A. ainda)**
- [ ] Criar estruturação no banco de dados (`news_sources`, `news`, tabela logs).
- [ ] Criar sistema de classes `CrawlerAdapter` (RSS vs DOM).
- [ ] Construir o agendador inteligente baseado no cron `artisan schedule`.
- [ ] Implementar as filas (`Horizon`/Redis) para isolar a captura pesada da API principal.
- [ ] Construir a tela no Frontend (React) para listar e adicionar novas Fontes e gerir URLs.

**Fase 2: Multi-canais (Tempo real)**
- [ ] Expandir API de ingestão (`/api/v1/news/webhook`) para aceitar JSON em tempo real.
- [ ] Integrar webhook do WhatsApp (ao entrar link ou texto longo em um grupo de monitoramento restrito).

**Fase 3: Camada "Brain" / I.A. Jornalística**
- [ ] Prototipar prompts sistêmicos.
- [ ] Desenvolver `AnalyzeNewsContentWithAI` que enriquece os campos "Onde", "Policial vs Política", gerando resumos.
- [ ] Interligação com os Grupos VIP: Gerar a chamada e fornecer gatilho "Disparar para lista X".
