# Integracao GA4 e KPIs (arquitetura recomendada)

Data da analise: 2026-03-05  
Escopo: conectar Google Analytics 4 no backend Laravel e expor KPIs para o frontend React, com contrato estavel e resiliencia.

## 1) Resumo executivo

O projeto ja tem base pronta para consumir KPIs via API (`apps/api` + `apps/web`), mas os dados de analytics ainda estao mockados no frontend.

Para evitar divida tecnica, a integracao deve seguir 4 decisoes:

1. Criar modulo dedicado `Analytics` no backend (nao misturar com `Config`).
2. Expor uma camada unica interna (`AnalyticsClientInterface`) para nao acoplar controllers a SDK/lib.
3. Travar um dicionario de KPIs versionado (`AnalyticsMetricsMap`) para evitar ambiguidade futura.
4. Padronizar contrato HTTP (`date_preset`, `compare`, `meta` de cache/fonte/stale).

## 2) Estado atual confirmado no projeto

## Backend (`apps/api`)

- Arquitetura modular com `ModuleServiceProvider` e prefixo `/api/v1`.
- Endpoints com `auth:sanctum`.
- Envelope padrao no `BaseController` (`success`, `data`, `message`, `meta`).
- Nao existe integracao GA4 hoje:
  - sem `spatie/laravel-analytics` e `google/analytics-data` no `composer.json`
  - sem variaveis `ANALYTICS_*` no `.env.example`
  - sem modulo/controller/service de analytics.

## Frontend (`apps/web`)

- API centralizada em `services/api.ts` + hooks React Query.
- KPIs ainda mockados:
  - `apps/web/src/pages/Index.tsx`
  - `apps/web/src/pages/engajamento/Relatorios.tsx`
- Tela de integracoes tambem mockada:
  - `apps/web/src/pages/config/Integracoes.tsx`.

Conclusao: a estrutura suporta a integracao sem refactor estrutural grande.

## 3) Entradas ja definidas

- GA4 Property ID: `291789632`
- Credencial local: `C:\Users\Usuario\Downloads\hypeneural-476a81c22339.json`

## 4) Arquitetura recomendada (backend)

## 4.1 Modulo dedicado

Criar modulo novo:

```
apps/api/app/Modules/Analytics/
|- routes.php
|- Http/Controllers/AnalyticsController.php
|- Http/Requests/
|  |- AnalyticsOverviewRequest.php
|  |- AnalyticsKpisRequest.php
|  |- AnalyticsTopPagesRequest.php
|  |- AnalyticsTimeseriesRequest.php
|- Services/AnalyticsService.php
|- Clients/
|  |- AnalyticsClientInterface.php
|  |- Ga4AnalyticsClient.php
|  |- NullAnalyticsClient.php
|- Support/
|  |- AnalyticsMetricsMap.php
|  |- CacheKeyBuilder.php
|  |- DateRangeResolver.php
```

## 4.2 Cliente unico (evitar bifurcacao de libs)

Mesmo usando `spatie/laravel-analytics` e/ou `google/analytics-data`, o controller deve depender so da interface:

- `AnalyticsClientInterface`
- `Ga4AnalyticsClient` (implementacao real)
- `NullAnalyticsClient` (dev/teste sem credencial)

Isso evita acoplamento direto em endpoints e facilita teste/migracao de lib.

### Interface sugerida

```php
interface AnalyticsClientInterface
{
    public function fetchKpis(array $query): array;
    public function fetchTopPages(array $query): array;
    public function fetchRealtime(array $query = []): array;
    public function fetchTimeseries(array $query): array;
}
```

## 4.3 Pacotes

```bash
cd apps/api
composer require spatie/laravel-analytics
composer require google/analytics-data
php artisan vendor:publish --tag="analytics-config"
```

Observacao:
- Pode manter Spatie como helper para casos comuns.
- O contrato interno continua unico pela interface acima.

## 5) Credenciais e configuracao

## 5.1 Caminho seguro

Salvar JSON em path privado:

`apps/api/storage/app/private/analytics/service-account-credentials.json`

PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path "apps/api/storage/app/private/analytics" | Out-Null
Copy-Item "C:\Users\Usuario\Downloads\hypeneural-476a81c22339.json" `
  "apps/api/storage/app/private/analytics/service-account-credentials.json" -Force
```

## 5.2 `.env` sugerido

```env
ANALYTICS_PROPERTY_ID=291789632
ANALYTICS_CREDENTIALS_PATH=app/private/analytics/service-account-credentials.json
ANALYTICS_TIMEZONE=America/Sao_Paulo
ANALYTICS_CACHE_TTL_REALTIME=20
ANALYTICS_CACHE_TTL_KPIS=600
ANALYTICS_CACHE_TTL_TOP_PAGES=1800
ANALYTICS_CACHE_TTL_TIMESERIES=900
```

## 5.3 `config/analytics.php`

- Ler property id de `ANALYTICS_PROPERTY_ID`
- Ler credencial por `storage_path(env('ANALYTICS_CREDENTIALS_PATH'))`
- Definir timezone de leitura de relatorios com `ANALYTICS_TIMEZONE`

## 6) Dicionario de KPIs (obrigatorio)

Para evitar confusao (`users` vs `activeUsers`, `tempo medio` etc.), criar um mapa versionado:

`apps/api/app/Modules/Analytics/Support/AnalyticsMetricsMap.php`

Exemplo:

```php
final class AnalyticsMetricsMap
{
    public const MAP = [
        'users' => [
            'ga4_metric' => 'totalUsers',
            'description' => 'Usuarios unicos no periodo.',
        ],
        'active_users' => [
            'ga4_metric' => 'activeUsers',
            'description' => 'Usuarios ativos no periodo (nao realtime).',
        ],
        'sessions' => [
            'ga4_metric' => 'sessions',
            'description' => 'Numero total de sessoes.',
        ],
        'pageviews' => [
            'ga4_metric' => 'screenPageViews',
            'description' => 'Visualizacoes de pagina/tela.',
        ],
        'avg_engagement_time_sec' => [
            'ga4_metric' => 'userEngagementDuration',
            'description' => 'Converter para media por usuario ativo no service.',
        ],
        'engagement_rate' => [
            'ga4_metric' => 'engagementRate',
            'description' => 'Taxa de engajamento (0-1, normalizar para % no retorno).',
        ],
        'realtime_active_users_30m' => [
            'ga4_metric' => 'activeUsers',
            'description' => 'Usuarios ativos em tempo real (ultimos 30 min).',
        ],
    ];
}
```

## 7) Contrato de filtros (padrao)

Todos os endpoints devem aceitar:

- `date_preset=today|yesterday|last_7_days|last_30_days|month_to_date|custom`
- `compare=none|previous_period|previous_year`

Quando `date_preset=custom`, exigir:
- `start_date=YYYY-MM-DD`
- `end_date=YYYY-MM-DD`

Parametros adicionais por endpoint:
- `include=kpis,top_pages,realtime` (overview)
- `limit` (top pages)
- `path_prefix` / `exclude_prefix` (top pages)
- `metric`, `granularity` (timeseries)

## 8) Contrato de resposta (padrao)

Sempre responder com `meta` tecnico:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "property_id": "291789632",
    "date_range": {
      "preset": "last_7_days",
      "start": "2026-02-27",
      "end": "2026-03-05"
    },
    "compare": "previous_period",
    "timezone": "America/Sao_Paulo",
    "source": "ga4",
    "stale": false,
    "generated_at": "2026-03-05T12:30:00-03:00",
    "cache_ttl_sec": 600
  },
  "message": ""
}
```

Campos importantes:
- `source`: `ga4` ou `cache`
- `stale`: `true` quando veio cache por falha do GA4

## 9) Endpoints recomendados

## 9.1 Agregado (preferido no dashboard)

`GET /analytics/overview?date_preset=last_7_days&compare=previous_period&include=kpis,top_pages,realtime`

Motivo:
- reduz numero de requests do frontend
- reduz chamadas no GA4
- melhora quota/performance

## 9.2 Individuais

1. `GET /analytics/kpis?date_preset=custom&start_date=2026-03-01&end_date=2026-03-05&compare=previous_period`
2. `GET /analytics/top-pages?date_preset=last_7_days&limit=10&path_prefix=/noticia/&exclude_prefix=/amp/`
3. `GET /analytics/realtime`
4. `GET /analytics/timeseries?metric=screenPageViews&granularity=day&date_preset=last_30_days`

## 9.3 Top pages (payload enriquecido)

Retornar:
- `rank`
- `path`
- `full_url` (quando disponivel)
- `slug` (quando extraivel)
- `title`
- `views`
- `percentage_of_total`

## 10) Cache, quota e performance

- `realtime`: cache 15-30s
- `kpis`: cache 10min
- `top_pages`: cache 30min
- `timeseries`: cache 15min

Boas praticas:
- cache key com `property_id + endpoint + preset + range + compare + filtros`
- usar `CacheKeyBuilder` dedicado
- no `overview`, reaproveitar resultados internos para evitar chamadas repetidas
- manter timeout e retry curto nas chamadas GA4

## 11) Resiliencia (regra fechada)

Regra operacional:

1. Se GA4 falhar e existir cache:  
   retornar `200`, `meta.source=cache`, `meta.stale=true`.
2. Se GA4 falhar e nao existir cache:  
   retornar `503` com `code=ANALYTICS_UNAVAILABLE`.

Exemplo de erro:

```json
{
  "success": false,
  "message": "Analytics temporariamente indisponivel",
  "code": "ANALYTICS_UNAVAILABLE"
}
```

## 12) Mapeamento para UI atual

## Dashboard (`apps/web/src/pages/Index.tsx`)

- `Visitantes Hoje` -> `kpis.users` (preset `today`)
- `Pageviews` -> `kpis.pageviews` (preset `today`)
- `Tempo Medio` -> `kpis.avg_engagement_time_sec` (formatar mm:ss)
- `Materias mais acessadas` -> `top_pages`
- `Ativos agora` (se exibido) -> `realtime.active_users_30m`

## Relatorios (`apps/web/src/pages/engajamento/Relatorios.tsx`)

- cards principais -> `kpis`
- ranking -> `top_pages`
- grafico -> `timeseries`

## 13) Integracao frontend recomendada

Criar:

- `apps/web/src/services/analytics.service.ts`
- `apps/web/src/hooks/useAnalytics.ts`

Padrao:
- Dashboard consome `overview`
- Telas especificas podem consumir endpoints individuais
- `realtime` com `refetchInterval` 20-30s
- mostrar indicador visual quando `meta.stale=true`

## 14) Seguranca

- Service account com acesso minimo (Viewer/Analyst na property)
- Credencial fora de git
- Endpoints autenticados (`auth:sanctum`)
- Permissao recomendada: `analytics.view` (evita overload semantico de `dashboard.view`)

## 15) Perguntas para alinhamento com backend (pendentes)

1. Dominio oficial para KPI editorial (site principal, subdominio, app)?
2. Prefixos oficiais de materia (`/noticia/`, `/pauta/`, outros)?
3. KPI principal de "visitantes": `totalUsers` ou `activeUsers`?
4. Formula final de `avg_engagement_time_sec` (metodo exato)?
5. Timezone oficial para agregacao (`America/Sao_Paulo` confirmado?)?
6. A permissao nova `analytics.view` pode ser criada no seeder?
7. `overview` sera endpoint obrigatorio para dashboard?
8. Regras de cache stale estao aprovadas para producao?
9. Precisamos snapshot em banco para historico interno?
10. Existe cenario multi-property no roadmap?

## 16) Plano de implementacao (fases)

1. Criar modulo `Analytics` + contratos (`interface`, requests, service, controller).
2. Integrar GA4 com `Ga4AnalyticsClient` + `NullAnalyticsClient`.
3. Implementar endpoints `overview`, `kpis`, `top-pages`, `realtime`, `timeseries`.
4. Aplicar cache + fallback stale + erro `ANALYTICS_UNAVAILABLE`.
5. Integrar frontend (`service` + `hook`) e trocar mocks.
6. Validar permissoes e criar docs finais de API.

## 17) Itens ja definidos

- Property ID: `291789632`
- Credencial JSON local disponivel
- Estrutura atual da API e do frontend ja adequada para a integracao
