# Plano de Execucao - GA4 Analytics (Backend + Frontend)

Data inicial: 2026-03-05  
Contexto: implementar a arquitetura definida em `docs/integrations/ga4-kpis-integration.md`.

## Status legend

- `[ ]` pendente
- `[/]` em progresso
- `[x]` concluido

## Fase 0 - Governanca e alinhamento

- [x] Consolidar arquitetura alvo (modulo `Analytics`, contrato de filtros, cache/stale, endpoint `overview`).
- [x] Definir property id e fonte de credencial (`291789632`, JSON local informado).
- [x] Criar backlog detalhado com subtarefas e criterio de aceite.
  - [x] Enumerar fases tecnicas backend/frontend.
  - [x] Incluir estrategia de rollback/fallback.
  - [x] Atualizar status dinamicamente durante execucao.

## Fase 1 - Base tecnica backend

- [x] Instalar dependencias no `apps/api`.
  - [x] `spatie/laravel-analytics`
  - [x] `google/analytics-data`
  - [x] Publicar config analytics (`php artisan vendor:publish --tag="analytics-config"`).
- [x] Configurar parametros de ambiente.
  - [x] Atualizar `apps/api/.env.example` com `ANALYTICS_*`.
  - [x] Garantir leitura de `credentials` via `storage_path`.
- [x] Preparar caminho de credencial privado (sem commit do JSON).
  - [x] Criar diretorio `storage/app/private/analytics/`.
  - [x] Validar `.gitignore` efetivo para impedir versionamento.

## Fase 2 - Modulo Analytics (backend)

- [x] Criar estrutura do modulo `apps/api/app/Modules/Analytics`.
  - [x] `routes.php`
  - [x] `Http/Controllers/AnalyticsController.php`
  - [x] `Http/Requests/*`
  - [x] `Services/AnalyticsService.php`
  - [x] `Clients/*`
  - [x] `Support/*`
- [x] Implementar `AnalyticsClientInterface`.
  - [x] Contratos: `fetchKpis`, `fetchTopPages`, `fetchRealtime`, `fetchTimeseries`.
- [x] Implementar `Ga4AnalyticsClient`.
  - [x] Inicializacao segura do client GA4.
  - [x] Conversao de resposta GA4 para formato interno.
  - [x] Normalizacao de unidades (engagement rate, tempo medio, etc.).
- [x] Implementar `NullAnalyticsClient`.
  - [x] Retorno nulo/previsivel para ambiente sem credencial.
  - [x] Compatibilidade com testes locais.
- [x] Implementar suporte.
  - [x] `AnalyticsMetricsMap` (dicionario de KPIs versionado).
  - [x] `DateRangeResolver` (`date_preset`, `custom`, `compare`).
  - [x] `CacheKeyBuilder` (chaves deterministicas).
- [x] Implementar `AnalyticsService`.
  - [x] Fluxo cache fresh/stale.
  - [x] Fallback `stale=true` quando GA4 indisponivel.
  - [x] Erro `ANALYTICS_UNAVAILABLE` (503) sem cache.
- [x] Implementar requests de validacao.
  - [x] `AnalyticsOverviewRequest`
  - [x] `AnalyticsKpisRequest`
  - [x] `AnalyticsTopPagesRequest`
  - [x] `AnalyticsTimeseriesRequest`
- [x] Implementar controller e endpoints.
  - [x] `GET /analytics/overview`
  - [x] `GET /analytics/kpis`
  - [x] `GET /analytics/top-pages`
  - [x] `GET /analytics/realtime`
  - [x] `GET /analytics/timeseries`
- [x] Garantir envelope com `meta` padrao.
  - [x] `property_id`
  - [x] `date_range`
  - [x] `compare`
  - [x] `timezone`
  - [x] `source`
  - [x] `stale`
  - [x] `generated_at`
  - [x] `cache_ttl_sec`

## Fase 3 - Permissoes e integracao cross-module

- [x] Incluir modulo `analytics` no mapeamento de permissoes backend.
  - [x] `RoleAndPermissionSeeder`
  - [x] `PermissaoController` (lista de modulos)
- [/] Proteger endpoints analytics com permissao adequada.
  - [x] Politica: `analytics.view` (ou fallback temporario).
  - [ ] Testar acesso por perfil.

## Fase 4 - Frontend (consumo real)

- [/] Criar `apps/web/src/services/analytics.service.ts`.
  - [x] Tipos de payload (`overview`, `kpis`, `top_pages`, `realtime`, `timeseries`).
  - [x] Parametros de query padronizados.
- [/] Criar `apps/web/src/hooks/useAnalytics.ts`.
  - [x] Query keys.
  - [x] Refetch para realtime.
  - [ ] Tratamento de `meta.stale`.
- [x] Substituir mocks da tela inicial.
  - [x] `apps/web/src/pages/Index.tsx` (KPIs e top pages).
- [x] Substituir mocks da tela de relatorios.
  - [x] `apps/web/src/pages/engajamento/Relatorios.tsx` (cards + ranking + timeseries minimo).

## Fase 5 - Validacao e entrega

- [/] Executar validacoes backend.
  - [/] `php artisan test` (falhou por problema pre-existente de migration sqlite com `ALTER TABLE ... MODIFY COLUMN`)
  - [x] Verificar rotas (`php artisan route:list | findstr analytics`)
- [x] Executar validacoes frontend.
  - [x] `pnpm build`
- [/] Revisar contratos finais e documentacao.
  - [x] Atualizar `ga4-kpis-integration.md` se houver ajuste.
  - [/] Registrar decisoes de implementacao divergentes.
- [ ] Preparar commit(s) com mensagem clara por fase.

## Criterios de aceite

- [x] Endpoints analytics respondendo com contrato padrao e `meta`.
- [x] Fluxo de fallback funcionando (`stale=true` ou `503 ANALYTICS_UNAVAILABLE`).
- [x] Dashboard e Relatorios consumindo dados reais sem mocks principais.
- [x] Build do frontend concluindo com sucesso.
- [x] Permissoes analytics aplicadas em backend.
