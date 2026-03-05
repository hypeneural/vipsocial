# GA4 Backend Data Guide (analise + melhorias)

Data: 2026-03-05  
Escopo: consolidar a estrutura atual do GA4 no backend, ajustar modelagem de consultas e definir perguntas/pesquisas obrigatorias para o time de backend.

## 1) Estrutura atual confirmada

## 1.1 Fluxo atual

1. `AnalyticsController` recebe requests em `/api/v1/analytics/*`.
2. `AnalyticsService` resolve periodo (`date_preset`), cache/fallback e `meta`.
3. `AnalyticsClientInterface` desacopla controller da lib do Google.
4. `Ga4AnalyticsClient` usa Data API (`runReport` e `runRealtimeReport`).
5. `NullAnalyticsClient` e usado quando credencial/property nao estao validas.

Arquivos principais:

- `apps/api/app/Modules/Analytics/Http/Controllers/AnalyticsController.php`
- `apps/api/app/Modules/Analytics/Services/AnalyticsService.php`
- `apps/api/app/Modules/Analytics/Clients/AnalyticsClientInterface.php`
- `apps/api/app/Modules/Analytics/Clients/Ga4AnalyticsClient.php`
- `apps/api/app/Modules/Analytics/Support/DateRangeResolver.php`
- `apps/api/app/Modules/Analytics/Support/AnalyticsMetricsMap.php`

## 1.2 Libs em uso

- `google/analytics-data` (principal, chamadas diretas GA4 Data API)
- `spatie/laravel-analytics` (instalado; pode seguir como helper opcional)

## 1.3 Endpoints existentes (status atual do codigo)

- `GET /api/v1/analytics/overview`
- `GET /api/v1/analytics/kpis`
- `GET /api/v1/analytics/top-pages`
- `GET /api/v1/analytics/cities`
- `GET /api/v1/analytics/acquisition`
- `GET /api/v1/analytics/realtime`
- `GET /api/v1/analytics/timeseries`

## 2) Validacao da modelagem (OK + ajustes)

## 2.1 Cidades mais acessadas

Modelagem validada para ranking:

- Dimension: `city`
- Metrics: `screenPageViews`, `totalUsers`
- Order: `screenPageViews desc`

Ajuste recomendado:

- `share_pageviews_pct` deve usar o total de `screenPageViews` como base.

Endpoint implementado:

- `GET /api/v1/analytics/cities?date_preset=today|yesterday|last_7_days|month_to_date&limit=10`

## 2.2 Paginas mais acessadas

Modelagem validada:

- Dimensions: `pagePath`, `pageTitle`, `hostName`
- Metric: `screenPageViews`
- Opcional: `fullPageUrl`

Ajuste importante:

- `fullPageUrl` na Data API e `hostname + path + query` (sem protocolo).
- Quando precisar URL completa com protocolo, usar `pageLocation`.

Sugestao pratica:

- Para ranking editorial, padrao: `pagePath + pageTitle + hostName`.
- `pathPrefix` e `excludePrefix` continuam validos.

## 2.3 Visitantes unicos e visualizacoes totais

Modelagem validada:

- Metrics agregadas sem dimensao: `totalUsers`, `screenPageViews`
- Periodos: `today`, `yesterday`, `last_7_days`, `month_to_date`

Observacao:

- `screenPageViews` ja considera `screen_view + page_view`.

## 2.4 Origem dos acessos

Modelagem validada com 2 modos:

- `mode=session` (visao de sessao):
  - Dimension: `sessionDefaultChannelGroup`
  - Metrics: `sessions`, `totalUsers`, `screenPageViews`
- `mode=first_user` (aquisicao):
  - Dimension: `firstUserDefaultChannelGroup`
  - Metric principal: `totalUsers`

Endpoint implementado:

- `GET /api/v1/analytics/acquisition?date_preset=month_to_date&mode=session|first_user`

## 2.5 Grafico 30 dias (pageviews + usuarios unicos)

Modelagem validada:

- Dimension: `date` (formato `YYYYMMDD`)
- Metrics: `screenPageViews`, `totalUsers`
- Order: `date asc`

Melhoria de contrato (ja implementada):

- Evoluir `GET /analytics/timeseries` para aceitar multiplas metricas:
  - legado: `metric=pageviews`
  - novo: `metrics[]=pageviews&metrics[]=users`

Observacao:

- Se desejado, usar `keepEmptyRows=true` para preservar linhas sem valores em series temporais.

## 3) Ajustes na API do modulo Analytics

## 3.1 Endpoints novos (ja implementados)

1. `GET /analytics/cities`
2. `GET /analytics/acquisition`

## 3.2 Endpoint existente evoluido

- `GET /analytics/timeseries`
  - adicionar suporte a `metrics[]`
  - manter `metric` para compatibilidade retroativa

## 3.3 Endpoint agregado

- manter `overview`
- status atual: `include=cities,acquisition` suportado para reduzir roundtrips no dashboard

## 3.4 O que ainda falta (pendencias)

1. Adicionar `checkCompatibility` como smoke test interno de dev/staging.
2. Definir politica de `debug_quota=1` e permissao de acesso.
3. Criar testes automatizados de request/contract para novos endpoints.

## 4) Compatibilidade, quotas, paginacao e robustez

## 4.1 Compatibilidade preventiva

Implementar validacao com `checkCompatibility` em dev/staging para combinacoes alvo:

1. `city + screenPageViews + totalUsers`
2. `sessionDefaultChannelGroup + sessions + totalUsers + screenPageViews`
3. `pagePath + pageTitle + hostName + screenPageViews`

## 4.2 Paginacao e limites

- `limit` padrao da API: 10000
- maximo por request: 250000
- usar `offset` para exportacoes grandes
- para UI, limitar `limit` em no maximo 50 ou 100

## 4.3 Quotas e observabilidade

- quotas sao por categoria (`Core`, `Realtime`, `Funnel`) e por property
- adicionar modo debug interno: `debug_quota=1`
  - quando ativo, enviar `returnPropertyQuota=true`
  - retornar quota em `meta` somente para perfis autorizados

## 5) Mapeamento direto do que voce pediu

1. Cidades mais acessadas (dia, ontem, semana, mes):
- usar `/analytics/cities` com `date_preset` correspondente.

2. Paginas mais acessadas (dia, ontem, semana, mes):
- usar `/analytics/top-pages` com `date_preset` correspondente.

3. Visitantes unicos e visualizacoes totais (dia, ontem, semana, mes):
- usar `/analytics/kpis` e mapear:
  - `unique_visitors = totals.users`
  - `total_pageviews = totals.pageviews`

4. Origem dos acessos com quantidades (mes):
- usar `/analytics/acquisition?date_preset=month_to_date&mode=session`.

5. Grafico pageviews + acessos unicos (30 dias):
- usar `/analytics/timeseries?date_preset=last_30_days&metrics[]=pageviews&metrics[]=users`.

## 6) Perguntas obrigatorias para o time backend/produto

1. Em "mes", o padrao oficial sera `month_to_date` ou `last_30_days`?
2. Cidades devem rankear por `screenPageViews` ou `totalUsers`?
3. Origem de acessos no dashboard principal e `session` ou `first_user`?
4. Precisamos forcar filtro por `hostName=www.vipsocial.com.br` nos rankings de pagina?
5. Como tratar `(not set)`: ocultar, agrupar em "Outros" ou exibir cru?
6. Limite padrao para rankings na UI: 5, 10 ou 20?
7. `timeseries` multi-metrica sera aprovado mantendo compatibilidade com `metric` legado?
8. `debug_quota` pode ser exposto apenas para admin?
9. Timezone oficial final da propriedade para relatorios: `America/Sao_Paulo`?
10. `overview` deve incluir `cities` e `acquisition` via `include=`?

## 7) Tarefas de pesquisa (API e lib) para o time backend

## 7.1 Pesquisa em API oficial (Google)

1. Confirmar compatibilidade das combinacoes acima com `checkCompatibility`.
2. Revisar diferenca pratica entre `fullPageUrl`, `pageLocation`, `pagePathPlusQueryString` para o produto.
3. Definir quando usar `sessionDefaultChannelGroup` vs `firstUserDefaultChannelGroup`.
4. Confirmar estrategia de `keepEmptyRows` para serie temporal.
5. Validar custos de tokens para requests de alto volume.

## 7.2 Pesquisa na lib `google/analytics-data` (PHP)

1. Melhor estrategia para `runReport` com multiplas metricas na mesma consulta.
2. Paginacao com `limit/offset` para cenarios de exportacao.
3. Mapeamento de erros por tipo (invalid argument, auth, quota, 429).
4. Retry e timeout recomendados em ambiente de producao.
5. Avaliar impacto de upgrade da versao atual.

## 7.3 Entregavel esperado da pesquisa

- Um README tecnico curto com:
  - combinacoes validadas
  - contrato final aprovado
  - decisoes de negocio (periodo mensal, modo de origem, filtros de host)
  - riscos e limites de quota

## 8) Plano de implementacao recomendado

1. Implementar `cities`.
2. Implementar `acquisition` com `mode=session|first_user`.
3. Evoluir `timeseries` para `metrics[]` mantendo legado.
4. Incluir `cities/acquisition` no `overview` por `include=`.
5. Cobrir validacao de requests e smoke tests.
6. Validar em producao com `meta.source`, `meta.stale`, `timezone`, `property_id`.

## 9) Referencias oficiais

1. API schema (dimensoes e metricas):  
`https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema`
2. RunReport (limit/offset/keepEmptyRows/returnPropertyQuota):  
`https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport`
3. BatchRunReports:  
`https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/batchRunReports`
4. CheckCompatibility:  
`https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/checkCompatibility`
5. Quotas Data API:  
`https://developers.google.com/analytics/devguides/reporting/data/v1/quotas`
6. PHP client (`google/analytics-data`):  
`https://github.com/googleapis/php-analytics-data`
