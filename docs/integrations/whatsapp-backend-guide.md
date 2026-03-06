# WhatsApp Backend Guide (Laravel 12 + Z-API)

Data: 2026-03-06  
Escopo: estrutura atual do modulo `Modules/WhatsApp`, endpoints, fluxo de sync de grupos e como evoluir com seguranca.

Roadmap de metricas de grupos:
`docs/integrations/whatsapp-groups-metrics-roadmap.md`

## 1) Arquitetura atual

Camadas do modulo:

1. `Clients`: integra com provider externo (Z-API).
2. `Services`: regras de negocio (normalizacao, cache, sync, metricas).
3. `Http/Controllers`: endpoints internos da plataforma (`/api/v1/whatsapp/*`).
4. `Http/Requests`: validacao de entrada.
5. `Jobs`: processamento assincrono (mensagens e sync de grupo).
6. `Models`: persistencia de grupos, participantes, memberships e eventos.

Objetivo: evitar integracao HTTP espalhada e manter contratos internos estaveis.

## 2) Stack

- Laravel 12
- Auth API: `auth:sanctum`
- Provider HTTP: `Illuminate\Support\Facades\Http`
- Cache: facade `Cache`
- Queue: jobs `ShouldQueue`
- Scheduler: `whatsapp:groups-sync` 2x/dia (09:00 e 21:00 America/Sao_Paulo)

## 3) Estrutura de pastas

```txt
apps/api/app/Modules/WhatsApp/
|- Clients/
|  |- WhatsAppProviderInterface.php
|  |- ZApiClient.php
|  `- NullWhatsAppClient.php
|- Exceptions/
|  `- WhatsAppProviderException.php
|- Http/
|  |- Controllers/
|  |  |- WhatsAppController.php
|  |  |- WhatsAppGroupsController.php
|  |  `- WhatsAppGroupMetricsController.php
|  `- Requests/
|     |- BaseWhatsAppRequest.php
|     |- PaginatedListRequest.php
|     |- WindowRequest.php
|     |- StoreWhatsAppGroupRequest.php
|     |- UpdateWhatsAppGroupRequest.php
|     |- SyncWhatsAppGroupRequest.php
|     |- SendTextRequest.php
|     |- SendImageRequest.php
|     `- SendLinkRequest.php
|- Jobs/
|  |- SendWhatsAppTextJob.php
|  |- SendWhatsAppImageJob.php
|  |- SendWhatsAppLinkJob.php
|  `- SyncGroupMetadataJob.php
|- Models/
|  |- WhatsAppGroup.php
|  |- WhatsAppParticipant.php
|  |- WhatsAppGroupMembership.php
|  `- WhatsAppGroupMemberEvent.php
|- Services/
|  |- WhatsAppService.php
|  |- GroupSyncService.php
|  `- GroupMetricsService.php
|- Support/
|  `- PhoneNormalizer.php
`- routes.php
```

Suporte fora do modulo:

- `apps/api/config/whatsapp.php`
- `apps/api/app/Providers/AppServiceProvider.php` (binding do provider)
- `apps/api/app/Console/Commands/SyncWhatsAppGroupsCommand.php`
- `apps/api/bootstrap/app.php` (registro de command + schedule)

## 4) Configuracao

## 4.1 `.env`

```env
WHATSAPP_PROVIDER=zapi
ZAPI_BASE_URL=https://api.z-api.io
ZAPI_INSTANCE=
ZAPI_TOKEN=
ZAPI_CLIENT_TOKEN=
ZAPI_TIMEOUT=30
ZAPI_RETRY_TIMES=3
ZAPI_RETRY_SLEEP_MS=300
WHATSAPP_CACHE_TTL_STATUS=15
WHATSAPP_CACHE_TTL_QRCODE=10
WHATSAPP_CACHE_TTL_DEVICE=30
WHATSAPP_CACHE_TTL_GROUP_METRICS=120
WHATSAPP_DEFAULT_COUNTRY_CODE=55
WHATSAPP_GROUP_IDS=
```

## 4.2 URL e header no provider

- Base URL final:  
  `{ZAPI_BASE_URL}/instances/{ZAPI_INSTANCE}/token/{ZAPI_TOKEN}/`
- Header obrigatorio:  
  `Client-Token: {ZAPI_CLIENT_TOKEN}`

## 5) Endpoints internos

Todos exigem `auth:sanctum`.

## 5.1 Mensageria

1. `POST /api/v1/whatsapp/send-text`
2. `POST /api/v1/whatsapp/send-image`
3. `POST /api/v1/whatsapp/send-link`

Obs.: aceitam `async=true`; rotas protegidas por middleware `idempotent`.

## 5.2 Estado da instancia

1. `GET /api/v1/whatsapp/status`
2. `GET /api/v1/whatsapp/qr-code/image`
3. `GET /api/v1/whatsapp/device`
4. `GET /api/v1/whatsapp/disconnect`

## 5.3 Grupos monitorados

1. `GET /api/v1/whatsapp/groups?per_page=20&include_inactive=0`
2. `POST /api/v1/whatsapp/groups`
3. `PATCH /api/v1/whatsapp/groups/{groupId}`
4. `POST /api/v1/whatsapp/groups/{groupId}/sync`
5. `GET /api/v1/whatsapp/groups/{groupId}/metadata`
6. `GET /api/v1/whatsapp/groups/{groupId}/light-metadata`

Formatos aceitos para `group_id`:

- Novo: `120363019502650977-group`
- Antigo: `554896318744-1598529471`

## 5.4 Contatos/chats

1. `GET /api/v1/whatsapp/contacts?page=1&pageSize=1000`
2. `GET /api/v1/whatsapp/chats?page=1&pageSize=1000`

## 5.5 Metricas de grupos (leitura no DB)

1. `GET /api/v1/whatsapp/groups/metrics/overview?window=7d|15d|30d`
2. `GET /api/v1/whatsapp/groups/metrics/by-group?window=7d|15d|30d`
3. `GET /api/v1/whatsapp/groups/{groupId}/metrics?window=7d|15d|30d`

## 6) Persistencia para metricas

Tabelas:

1. `whatsapp_groups`
2. `whatsapp_participants`
3. `whatsapp_group_memberships`
4. `whatsapp_group_member_events`

Principio:

- identidade principal do participante: `lid` (`xxxxx@lid`)
- fallback: `phone`
- metricas de crescimento: eventos `join/leave` gerados por diff de snapshot

## 7) Fluxo de sincronizacao de grupos

1. Command `whatsapp:groups-sync` seleciona grupos ativos.
2. Um `SyncGroupMetadataJob` e disparado por grupo.
3. `GroupSyncService`:
   - aplica lock por grupo
   - chama `light-group-metadata/{groupId}`
   - normaliza participantes (`lid` preferencial)
   - calcula diff (`added` e `removed`)
   - cria/atualiza memberships
   - grava eventos (`join`, `leave`, `promote_admin`, `demote_admin`)
   - atualiza `last_synced_at` e `last_member_count`
4. Endpoints de metricas leem apenas banco (nao chamam Z-API).

Guard rails:

- snapshot zerado com base anterior grande aborta diff
- queda brusca suspeita aborta diff

## 8) Comandos operacionais

Sync manual total:

```bash
php artisan whatsapp:groups-sync
```

Sync manual de grupos especificos:

```bash
php artisan whatsapp:groups-sync --group=120363027326371817-group --group=554896318744-1598529471
```

Ignorar guard rails (apenas diagnostico):

```bash
php artisan whatsapp:groups-sync --force
```

Ver agenda:

```bash
php artisan schedule:list
```

## 9) Como criar nova funcionalidade

Exemplo: novo endpoint `send-audio`.

1. Adicionar metodo no `WhatsAppService`.
2. Adicionar validacao em `Http/Requests`.
3. Adicionar metodo no `WhatsAppController`.
4. Registrar rota em `Modules/WhatsApp/routes.php`.
5. Se async, criar Job.
6. Cobrir com testes (`Http::fake()` para provider).

Regra: controller/service nao devem conhecer detalhes de autenticacao HTTP do provider; isso fica no `ZApiClient`.

## 10) Testes atuais

Rodar:

```bash
php artisan test --filter=WhatsApp
```

Cobertura principal:

- Unit:
  - `PhoneNormalizerTest`
  - `ZApiClientTest`
  - `GroupSyncServiceTest`
  - `GroupMetricsServiceTest`
  - `SyncGroupMetadataJobTest`
- Feature:
  - `WhatsAppTest`
  - `WhatsAppGroupMetricsTest`
  - `WhatsAppGroupsManagementTest`

## 11) Troubleshooting

1. `WHATSAPP_PROVIDER_ERROR`:
   - validar `ZAPI_BASE_URL`, `ZAPI_INSTANCE`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN`
2. Sync sem dados:
   - validar se grupos estao ativos em `/api/v1/whatsapp/groups`
   - validar payload real de `light-group-metadata/{groupId}`
3. Async nao processa:
   - validar `QUEUE_CONNECTION` + worker ativo
4. Scheduler nao roda:
   - validar cron do `schedule:run`

## 12) Referencias de codigo

- Rotas: `apps/api/app/Modules/WhatsApp/routes.php`
- Controllers: `apps/api/app/Modules/WhatsApp/Http/Controllers/*`
- Services: `apps/api/app/Modules/WhatsApp/Services/*`
- Config: `apps/api/config/whatsapp.php`
- Command: `apps/api/app/Console/Commands/SyncWhatsAppGroupsCommand.php`
- Schedule: `apps/api/bootstrap/app.php`
