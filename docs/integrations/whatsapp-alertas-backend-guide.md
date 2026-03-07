# WhatsApp Alertas Backend Guide

Data: 2026-03-06
Escopo: consolidar a estrutura atual do front e do backend para o modulo de alertas, registrar as decisoes ja fechadas para o MVP e definir a arquitetura recomendada para envio automatico de mensagens de texto via Z-API.

## 1) Resumo executivo

Hoje o projeto ja possui:

- front com UX de `alertas`, `alertas/novo`, `alertas/lista`, `alertas/logs`, `alertas/destinos` e `alertas/destinos/novo`
- modulo backend `Modules/WhatsApp` funcional para conexao com a Z-API
- endpoint real de envio de texto: `POST /api/v1/whatsapp/send-text`
- grupos de WhatsApp monitorados no modulo `WhatsApp`

Hoje o projeto ainda nao possui:

- modulo backend `Modules/Alertas`
- tabelas de dominio para alertas, destinos, regras de horario, execucoes e logs
- scheduler que dispare alertas devidos no minuto exato
- pipeline unica para `scheduler`, `send now` e `retry`
- idempotencia real de execucao por minuto

Conclusao pratica:

- o front de alertas existe, mas ainda esta majoritariamente mockado
- o backend de alertas ainda precisa ser implementado
- o maior risco tecnico nao e CRUD, e sim o motor de disparo com idempotencia
- antes de criar `Modules/Alertas`, o modulo `WhatsApp` precisa aceitar alvo do tipo telefone ou `group_id`

## 2) Decisoes ja fechadas para o MVP

Estas decisoes ja devem ser tratadas como contrato de implementacao:

1. MVP sem `tv_programs`
2. destinos serao cadastrados manualmente pelo usuario em `alertas/destinos/novo`
3. o formulario de destino precisa de:
   - `Nome do Destino *`
   - `Numero/ID do Grupo *`
4. um alerta pode vincular 1 ou varios destinos
5. o disparo acontece no horario exato cadastrado
6. timezone de negocio fixo em `America/Sao_Paulo`
7. o horario precisa ser dinamico por dia da semana
8. o mesmo alerta pode ter um horario em um dia e outro horario em outro dia
9. `scheduler`, `enviar agora` e `retry` devem usar a mesma pipeline
10. toda execucao deve gerar `alert_dispatch_runs`
11. todo envio por destino deve gerar `alert_dispatch_logs`
12. persistir sempre:
    - `provider_message_id`
    - `provider_zaap_id`
    - `provider_response_id`
    - `provider_response`
13. idempotencia e obrigatoria
14. para MVP: 1 log por destino por execucao
15. `retry` manual cria uma nova execucao com `trigger_type = retry`
16. `alert_destinations` deve ficar separado de `whatsapp_groups`
17. FK para `whatsapp_groups` pode existir no futuro, mas nao e dependencia do MVP
18. no MVP, desativacao deve usar `active = false`
19. exclusao fisica deve ficar restrita a casos sem historico operacional
20. `retry` automatico nao entra no MVP
21. a mensagem sera unica por alerta no MVP

## 3) Estrutura atual confirmada

## 3.1 Stack atual do front

Arquivo: `apps/web/package.json`

Stack confirmada:

- React 18
- TypeScript 5
- Vite 5
- React Router 6
- TanStack Query 5
- Axios
- Tailwind CSS
- Radix UI / shadcn
- Framer Motion

Padrao atual do front:

- `pages/*` para telas
- `components/*` para blocos reutilizaveis
- `services/*.service.ts` para contrato HTTP
- `hooks/use*.ts` para TanStack Query
- `types/*.ts` para contratos de dominio

## 3.2 Estrutura atual do front de alertas

Arquivos principais:

- `apps/web/src/pages/alertas/Dashboard.tsx`
- `apps/web/src/pages/alertas/AlertForm.tsx`
- `apps/web/src/pages/alertas/AlertsList.tsx`
- `apps/web/src/pages/alertas/Logs.tsx`
- `apps/web/src/pages/alertas/DestinationsList.tsx`
- `apps/web/src/pages/alertas/DestinationForm.tsx`
- `apps/web/src/components/alertas/DestinationSelector.tsx`
- `apps/web/src/components/alertas/DaysOfWeekPicker.tsx`
- `apps/web/src/components/alertas/TimesPicker.tsx`
- `apps/web/src/components/alertas/NextFiringsList.tsx`
- `apps/web/src/hooks/useAlertas.ts`
- `apps/web/src/services/alerta.service.ts`
- `apps/web/src/types/alertas.ts`

Rotas confirmadas no front:

- `/alertas`
- `/alertas/novo`
- `/alertas/lista`
- `/alertas/logs`
- `/alertas/destinos`
- `/alertas/destinos/novo`
- `/alertas/destinos/:id/editar`
- `/alertas/:id/editar`

## 3.3 Situacao atual real do front

O front ja define a UX e parte do contrato, mas ainda esta mockado:

- paginas usam arrays locais
- existem varios `TODO: Fetch from API`
- existem varios `TODO: Save to API`
- hooks e services existem, mas as telas ainda nao consomem os dados reais

Em resumo:

- a navegacao ja esta pronta
- o layout ja existe
- a integracao real ainda nao foi feita

## 3.4 Stack atual do backend

Arquivos relevantes:

- `apps/api/composer.json`
- `apps/api/bootstrap/app.php`
- `apps/api/app/Providers/ModuleServiceProvider.php`
- `apps/api/app/Providers/AppServiceProvider.php`
- `apps/api/app/Support/Http/Controllers/BaseController.php`

Stack confirmada:

- Laravel 12
- PHP 8.2+
- Sanctum
- Spatie Activitylog
- Spatie Permission
- Database queue
- arquitetura modular em `app/Modules/*`

Padrao atual do backend:

- cada modulo possui `routes.php`
- `ModuleServiceProvider` registra os modulos em `/api/v1/*`
- providers externos ficam bindados em `AppServiceProvider`
- commands e schedules ficam em `bootstrap/app.php`
- controllers seguem `BaseController`

## 3.5 Estrutura atual do backend WhatsApp

Arquivos principais:

- `apps/api/app/Modules/WhatsApp/routes.php`
- `apps/api/app/Modules/WhatsApp/Http/Controllers/WhatsAppController.php`
- `apps/api/app/Modules/WhatsApp/Services/WhatsAppService.php`
- `apps/api/app/Modules/WhatsApp/Clients/WhatsAppProviderInterface.php`
- `apps/api/app/Modules/WhatsApp/Clients/ZApiClient.php`
- `apps/api/app/Modules/WhatsApp/Support/PhoneNormalizer.php`

Endpoints ja existentes:

- `GET /api/v1/whatsapp/status`
- `GET /api/v1/whatsapp/qr-code/image`
- `GET /api/v1/whatsapp/device`
- `GET /api/v1/whatsapp/connection-state`
- `GET /api/v1/whatsapp/disconnect`
- `POST /api/v1/whatsapp/send-text`
- `POST /api/v1/whatsapp/send-image`
- `POST /api/v1/whatsapp/send-link`
- `GET /api/v1/whatsapp/groups`
- `POST /api/v1/whatsapp/groups`
- `PATCH /api/v1/whatsapp/groups/{groupId}`
- `POST /api/v1/whatsapp/groups/{groupId}/sync`

## 3.6 Base atual de grupos WhatsApp

Tabela existente:

- `whatsapp_groups`

Situacao atual:

- existem grupos monitorados no modulo `WhatsApp`
- isso e util para observabilidade e metricas
- isso nao deve ser a fonte de verdade do MVP de alertas

Decisao pratica:

- `alert_destinations` sera um cadastro proprio
- o usuario vai cadastrar manualmente os destinos no modulo de alertas
- qualquer relacao futura com `whatsapp_groups` deve ser opcional

## 4) Analise do front atual

## 4.1 Destinos

O formulario atual de destino ja aponta para o MVP correto.

Em `DestinationForm.tsx`, os campos atuais sao:

- `name`
- `phoneNumber`
- `tags`
- `active`

Isso combina com a regra de negocio desejada:

- `Nome do Destino *`
- `Numero/ID do Grupo *`

Ajuste recomendado:

- no front, o label pode continuar `Numero/ID do Grupo`
- na API, por compatibilidade imediata, pode continuar `phone_number`
- no banco, eu nao recomendo usar a coluna `phone` como nome tecnico, porque o valor pode ser:
  - telefone comum
  - `group_id` da Z-API

## 4.2 Alerta

O formulario atual de alerta ainda nao atende a regra real do negocio.

Hoje `AlertForm.tsx` trabalha assim:

- `days_of_week` em string binaria, por exemplo `0111110`
- `times[]`, por exemplo `["11:45", "17:45"]`

Isso significa:

- todos os dias marcados compartilham a mesma lista de horarios

Mas a regra fechada para o MVP e:

- um dia da semana pode ter um horario
- outro dia da semana pode ter outro horario

Exemplo real que o modelo atual nao representa bem:

- segunda: `11:45`
- terca: `17:30`
- sexta: `09:00`

Conclusao:

- o contrato atual `days_of_week + times[]` nao e suficiente
- o front precisa trocar de um modelo agrupado para um modelo de regras dinamicas por dia/horario

## 4.3 Dashboard e logs

Ha divergencias entre `types`, `services` e o que o backend deveria expor.

### Dashboard stats

`types/alertas.ts` espera:

- `sent_last_7_days`
- `failed_last_7_days`

`alerta.service.ts` espera:

- `today_sent`
- `today_failed`

Recomendacao:

- o backend deve devolver um superset estavel:
  - `total_destinations`
  - `active_destinations`
  - `total_alerts`
  - `active_alerts`
  - `next_firings_count`
  - `today_sent`
  - `today_failed`
  - `sent_last_7_days`
  - `failed_last_7_days`

### Proximos disparos

`types/alertas.ts` usa:

- `scheduled_time`
- `destination_count`
- `time_until`
- `time_until_ms`

`alerta.service.ts` hoje usa:

- `next_fire_at`
- `destinations_count`

Recomendacao:

- padronizar em `destination_count`
- devolver tambem `next_fire_at`
- manter:
  - `scheduled_time`
  - `time_until`
  - `time_until_ms`

### Logs

O front usa:

- `response_message_id`

Recomendacao:

- banco usa nomes internos do provider:
  - `provider_message_id`
  - `provider_zaap_id`
  - `provider_response_id`
- API devolve nomes amigaveis para o front:
  - `response_message_id`
  - `response_zaap_id`

## 5) Gap tecnico obrigatorio no modulo WhatsApp

Hoje o `WhatsAppService` nao pode ser usado diretamente para destinos que sejam grupos cadastrados manualmente.

Motivo:

- `WhatsAppService::sendText()` chama `PhoneNormalizer`
- `PhoneNormalizer` remove caracteres nao numericos e exige telefone no formato DDI+DDD+numero
- isso quebra `group_id` validos da Z-API, por exemplo:
  - `120363027326371817-group`
  - `554896318744-1598529471`

Conclusao:

- antes de implementar `Modules/Alertas`, o modulo `WhatsApp` precisa ser ajustado para aceitar:
  - telefone comum
  - `group_id`

## 5.1 O que precisa mudar no modulo WhatsApp

Recomendacao objetiva:

- criar um normalizador de alvo, e nao apenas de telefone

Exemplo de nome:

- `WhatsAppTargetNormalizer`

Comportamento esperado:

1. se o valor tiver formato de grupo, preservar como esta
2. se o valor for telefone, normalizar como numero

Heuristica minima:

- grupo:
  - termina com `-group`
  - ou segue padrao `numero-numero`
- telefone:
  - apenas numeros apos normalizacao

Metodos que precisam usar esse novo comportamento:

- `sendText()`
- `sendImage()`
- `sendLink()`

Sem esse ajuste, o modulo de alertas vai falhar justamente no caso mais importante do produto: envio para grupos.

## 6) Arquitetura recomendada no backend

## 6.1 Criar um modulo novo: `Modules/Alertas`

Recomendacao:

- criar `apps/api/app/Modules/Alertas`

Responsabilidade do modulo:

- CRUD de destinos
- CRUD de alertas
- regras de horario
- resolucao de proximos disparos
- execucao de envio
- logs de envio
- dashboard de alertas

Nao colocar isso em `Modules/WhatsApp`.

Motivo:

- `WhatsApp` deve continuar sendo o modulo do provider
- `Alertas` deve ser o modulo de negocio

## 6.2 Reuso correto do modulo WhatsApp

O modulo `Alertas` deve reutilizar:

- `WhatsAppService`
- o novo `WhatsAppTargetNormalizer`

O modulo `Alertas` nao deve:

- fazer request HTTP interno para `/api/v1/whatsapp/send-text`

Fluxo correto:

`AlertDispatchService` -> `WhatsAppService::sendText()`

## 6.3 Scheduler e fila

Usar o padrao ja existente do projeto:

- command registrado em `bootstrap/app.php`
- jobs na fila de banco
- scheduler em `America/Sao_Paulo`

## 7) Modelagem de dados recomendada

## 7.1 Principio

Separar:

- destino
- alerta
- vinculo alerta-destino
- regra individual de horario
- execucao de disparo
- log de envio por destino

## 7.2 Tabelas recomendadas

### 1. `alert_destinations`

Cadastro logico de destino.

Campos recomendados:

- `id` bigint
- `name` string
- `target_kind` enum `whatsapp_phone|whatsapp_group`
- `target_value` string
- `tags` json nullable
- `active` boolean default true
- `archived_at` datetime nullable
- `last_sent_at` datetime nullable
- `created_by` bigint nullable
- `updated_by` bigint nullable
- `whatsapp_group_fk` ulid nullable
- timestamps

Observacoes:

- `target_value` e o valor enviado para a Z-API
- `target_kind` evita tratar `group_id` como telefone
- `whatsapp_group_fk` fica apenas como extensao futura, nao como dependencia do MVP
- `active = false` indica desativacao operacional temporaria
- `archived_at` indica item retirado da operacao e do CRUD ativo

Regras:

- unique(`target_kind`, `target_value`)
- permitir apenas destinos ativos no envio automatico
- nao apagar fisicamente destinos com historico de envio

Indices recomendados:

- index(`active`)
- index(`last_sent_at`)

Compatibilidade com o front:

- API pode receber `phone_number`
- backend mapeia isso para:
  - `target_value`
  - `target_kind`

### 2. `alerts`

Cadastro principal do alerta.

Campos recomendados:

- `id` bigint
- `title` string
- `message` text
- `active` boolean default true
- `archived_at` datetime nullable
- `created_by` bigint nullable
- `updated_by` bigint nullable
- timestamps

Observacao:

- nao recomendo `timezone` por alerta no MVP
- o modulo inteiro deve usar `America/Sao_Paulo`
- nao apagar fisicamente alertas com historico operacional
- `active = false` indica alerta temporariamente desligado
- `archived_at` indica alerta arquivado

Indices recomendados:

- index(`active`)

### 3. `alert_destination_links`

Pivot entre alerta e destino.

Campos recomendados:

- `id` bigint
- `alert_id`
- `destination_id`
- timestamps

Constraint:

- unique(`alert_id`, `destination_id`)

### 4. `alert_schedule_rules`

Regra de horario individual.

Campos recomendados:

- `id` bigint
- `alert_id`
- `schedule_type` enum `weekly|specific_date`
- `day_of_week` tinyint nullable
- `specific_date` date nullable
- `time_hhmm` string(5)
- `rule_key` string
- `active` boolean default true
- timestamps

Exemplos:

- `weekly`, `day_of_week = 1`, `time_hhmm = 11:45`
- `weekly`, `day_of_week = 5`, `time_hhmm = 17:30`
- `specific_date`, `specific_date = 2026-03-15`, `time_hhmm = 08:00`

Validacoes obrigatorias:

- se `schedule_type = weekly`:
  - exigir `day_of_week`
  - proibir `specific_date`
- se `schedule_type = specific_date`:
  - exigir `specific_date`
  - proibir `day_of_week`

Constraint recomendada:

- unique(`alert_id`, `rule_key`)

Indices recomendados:

- index(`active`, `schedule_type`, `day_of_week`, `time_hhmm`)
- index(`active`, `schedule_type`, `specific_date`, `time_hhmm`)

Exemplos de `rule_key`:

- `weekly:1:11:45`
- `weekly:5:17:30`
- `specific_date:2026-03-15:08:00`

Motivo:

- isso modela o horario exato por dia
- isso atende o requisito real do produto
- isso elimina a ambiguidade de `days_of_week + times[]`

### 5. `alert_dispatch_runs`

Execucao de disparo.

Campos recomendados:

- `id` ulid
- `alert_id`
- `schedule_rule_id` bigint nullable
- `trigger_type` enum `scheduler|manual|retry`
- `source_log_id` ulid nullable
- `source_context` json nullable
- `scheduled_for` datetime
- `idempotency_key` string
- `status` enum `pending|processing|partial|success|failed|cancelled`
- `destinations_total` integer default 0
- `destinations_success` integer default 0
- `destinations_failed` integer default 0
- `started_at` datetime nullable
- `finished_at` datetime nullable
- `error_message` text nullable
- `created_by` bigint nullable
- timestamps

Constraint critica:

- unique(`idempotency_key`)

Indices recomendados:

- index(`alert_id`, `scheduled_for`)
- index(`status`, `scheduled_for`)
- index(`trigger_type`, `created_at`)

Exemplos de `idempotency_key`:

- scheduler:
  - `scheduler:alert-12:rule-33:2026-03-06T11:45:00-03:00`
- manual:
  - `manual:alert-12:01J...`
- retry:
  - `retry:log-01J...:01J...`

### 6. `alert_dispatch_logs`

Resultado por destino dentro de uma execucao.

Campos recomendados:

- `id` ulid
- `dispatch_run_id` ulid
- `alert_id`
- `destination_id`
- `alert_title_snapshot` string
- `destination_name_snapshot` string
- `target_kind` string
- `target_value` string
- `message_snapshot` text
- `status` enum `pending|success|failed|cancelled|skipped`
- `provider` string default `zapi`
- `provider_zaap_id` string nullable
- `provider_message_id` string nullable
- `provider_response_id` string nullable
- `provider_status_code` integer nullable
- `provider_response` json nullable
- `error_message` text nullable
- `sent_at` datetime nullable
- timestamps

Constraint critica:

- unique(`dispatch_run_id`, `destination_id`)

Indices recomendados:

- index(`alert_id`, `sent_at`)
- index(`destination_id`, `sent_at`)
- index(`status`, `sent_at`)
- index(`dispatch_run_id`, `status`)

Decisao do MVP:

- 1 log por destino por execucao
- nao usar `attempt` nesta fase
- retry manual cria nova execucao, nao nova tentativa no mesmo run

## 8) Pipeline de disparo recomendada

## 8.1 Scheduler

Adicionar em `apps/api/bootstrap/app.php`:

- `alertas:dispatch-due` a cada minuto

Configuracao recomendada:

```php
$schedule->command('alertas:dispatch-due')
    ->timezone('America/Sao_Paulo')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();
```

## 8.2 Fluxo seguro do command

1. pegar `now()` em `America/Sao_Paulo`
2. arredondar para o minuto atual
3. localizar regras ativas devidas naquele minuto
4. para cada regra devida, montar `idempotency_key`
5. criar `alert_dispatch_run`
6. se a unique falhar, ignorar silenciosamente
7. carregar destinos ativos do alerta
8. preencher `destinations_total`
9. despachar 1 job por destino

## 8.3 Fluxo seguro do job por destino

Responsabilidades do job:

1. carregar `dispatch_run`, `alert` e `destination`
2. criar ou reservar o log do destino como `pending`
3. se o log ja existir para aquele `dispatch_run + destination`, abortar
4. montar `message_snapshot`
5. chamar `WhatsAppService::sendText()`
6. persistir:
   - `alert_title_snapshot`
   - `destination_name_snapshot`
   - `provider_message_id`
   - `provider_zaap_id`
   - `provider_response_id`
   - `provider_response`
7. atualizar log para `success` ou `failed`
8. atualizar contadores do run
9. chamar `AlertDispatchService::refreshRunStatus($dispatchRunId)`

## 8.4 Manual send e retry

`POST /alertas/{id}/send`

- cria `alert_dispatch_run`
- `trigger_type = manual`
- usa a mesma pipeline do scheduler

`POST /alertas/logs/{logId}/retry`

- cria nova execucao
- `trigger_type = retry`
- `source_log_id = log original`
- envia somente para o destino do log original
- nao reaproveita a execucao anterior

## 8.5 Regras de falha e consistencia

O motor precisa lidar com:

- scheduler duplicado no mesmo minuto
- worker reiniciado no meio da execucao
- timeout da Z-API
- deploy concorrente
- clique duplo em `send now`

Medidas minimas:

- `idempotency_key` unica em `alert_dispatch_runs`
- `unique(dispatch_run_id, destination_id)` em `alert_dispatch_logs`
- log `pending` antes da chamada externa
- `started_at` e `finished_at` no run

## 8.6 Fechamento centralizado do run

Nao recomendo espalhar a logica de fechamento do run pelos jobs.

Recomendacao:

- centralizar em `AlertDispatchService::refreshRunStatus($dispatchRunId)`

Regra recomendada:

- se existe `pending` -> run `processing`
- se todos `success` -> run `success`
- se todos `failed` -> run `failed`
- se houver mistura de `success|failed|cancelled|skipped` -> run `partial`

Motivo:

- evita condicao de corrida
- evita status final incoerente
- simplifica testes

Cuidado de implementacao:

- ao consolidar status e contadores, usar leitura consistente com lock leve no registro de `alert_dispatch_runs`
- isso reduz risco de corrida entre jobs concorrentes fechando o mesmo run ao mesmo tempo

## 8.7 Sem destinos ativos

Quando um alerta estiver devido mas nao tiver destinos ativos:

- nao criar `alert_dispatch_run`
- registrar um evento operacional

Opcoes aceitaveis:

- `activitylog`
- log de aplicacao
- contador operacional dedicado

## 9) Endpoints recomendados

## 9.1 Destinos

- `GET /api/v1/alertas/destinos`
- `GET /api/v1/alertas/destinos/{id}`
- `POST /api/v1/alertas/destinos`
- `PUT /api/v1/alertas/destinos/{id}`
- `DELETE /api/v1/alertas/destinos/{id}` com comportamento de arquivamento logico
- `PATCH /api/v1/alertas/destinos/{id}/toggle`

Observacao:

- nao recomendo `sync-from-whatsapp-groups` no MVP

## 9.2 Alertas

- `GET /api/v1/alertas`
- `GET /api/v1/alertas/{id}`
- `POST /api/v1/alertas`
- `PUT /api/v1/alertas/{id}`
- `DELETE /api/v1/alertas/{id}` com comportamento de arquivamento logico
- `PATCH /api/v1/alertas/{id}/toggle`
- `POST /api/v1/alertas/{id}/duplicate`
- `POST /api/v1/alertas/{id}/send`

Regra de produto:

- no MVP, `DELETE` nao deve remover fisicamente
- deve arquivar ou desativar
- exclusao fisica so deveria existir para registros sem vinculos nem historico

Regra funcional de edicao:

- pode editar `title`, `message`, destinos e regras livremente
- `runs` e `logs` antigos nao sao reprocessados
- o historico continua representando o snapshot salvo no momento do envio

## 9.3 Logs

- `GET /api/v1/alertas/logs`
- `GET /api/v1/alertas/{id}/logs`
- `POST /api/v1/alertas/logs/{logId}/retry`
- `GET /api/v1/alertas/dispatch-runs/{id}` opcional

## 9.4 Dashboard

- `GET /api/v1/alertas/dashboard/stats`
- `GET /api/v1/alertas/dashboard/next-firings`
- `GET /api/v1/alertas/dashboard/recent-logs` opcional

## 10) Contrato de API recomendado

## 10.1 Destino

Request recomendado para create/update:

```json
{
  "name": "Grupo Jornal VIP",
  "phone_number": "120363027326371817-group",
  "tags": ["jornal", "vip"],
  "active": true
}
```

Response recomendado:

```json
{
  "success": true,
  "data": {
    "destination_id": 12,
    "name": "Grupo Jornal VIP",
    "phone_number": "120363027326371817-group",
    "target_kind": "whatsapp_group",
    "tags": ["jornal", "vip"],
    "active": true,
    "created_at": "2026-03-06T18:00:00-03:00",
    "updated_at": "2026-03-06T18:00:00-03:00"
  },
  "message": ""
}
```

## 10.2 Alerta

Recomendacao:

- migrar o contrato do front de `schedules[]` para `schedule_rules[]`

Request recomendado:

```json
{
  "title": "Jornal VIP Meio-dia",
  "message": "Em instantes comeca o Jornal VIP.",
  "active": true,
  "destination_ids": [1, 2, 3],
  "schedule_rules": [
    {
      "schedule_type": "weekly",
      "day_of_week": 1,
      "time_hhmm": "11:45",
      "active": true
    },
    {
      "schedule_type": "weekly",
      "day_of_week": 5,
      "time_hhmm": "17:30",
      "active": true
    }
  ]
}
```

Se precisar de transicao curta para o front atual:

- o backend pode aceitar temporariamente `schedules[{days_of_week, times[]}]`
- internamente expande isso para `alert_schedule_rules`

Mas isso deve ser tratado como compatibilidade temporaria, nao como contrato final.

## 10.3 Dashboard stats

Shape recomendado:

```json
{
  "success": true,
  "data": {
    "total_destinations": 5,
    "active_destinations": 5,
    "total_alerts": 8,
    "active_alerts": 6,
    "next_firings_count": 3,
    "today_sent": 12,
    "today_failed": 1,
    "sent_last_7_days": 142,
    "failed_last_7_days": 3
  },
  "message": ""
}
```

## 10.4 Proximos disparos

Shape recomendado:

```json
{
  "success": true,
  "data": [
    {
      "alert_id": 1,
      "alert_title": "Jornal VIP Meio-dia",
      "next_fire_at": "2026-03-07T11:45:00-03:00",
      "scheduled_time": "11:45",
      "time_until": "Em 12 minutos",
      "time_until_ms": 720000,
      "destination_count": 3
    }
  ],
  "message": ""
}
```

Padrao:

- usar sempre `destination_count`
- nao usar `destinations_count`

## 10.5 Logs

Shape recomendado:

```json
{
  "success": true,
  "data": [
    {
      "log_id": "01JNV...",
      "alert_id": 1,
      "alert_title": "Jornal VIP Meio-dia",
      "destination_id": 3,
      "destination_name": "Grupo Jornal VIP",
      "status": "success",
      "target_kind": "whatsapp_group",
      "target_value": "120363027326371817-group",
      "provider": "zapi",
      "sent_at": "2026-03-06T11:45:05-03:00",
      "success": true,
      "response_message_id": "D241XXXX732339502B68",
      "response_zaap_id": "3999984263738042930CD6ECDE9VDWSA",
      "error_message": null
    }
  ],
  "message": ""
}
```

## 11) O que precisa mudar no front

## 11.1 Destinos

O formulario de destino ja esta perto do necessario.

Ajustes:

- trocar mocks por hooks reais
- manter campo `Numero/ID do Grupo`
- permitir editar `active`
- alinhar retorno da API com `phone_number`

## 11.2 Alerta

O formulario de alerta precisa mudar.

Hoje:

- `DaysOfWeekPicker`
- `TimesPicker`

Isso nao representa bem:

- segunda `11:45`
- quarta `17:30`
- sabado `08:00`

Recomendacao:

- substituir por um componente dinamico, por exemplo:
  - `AlertScheduleRulesBuilder`

Comportamento esperado:

- adicionar linha
- duplicar regra
- ordenar regras
- escolher:
  - dia da semana + horario
  - ou data especifica + horario
- ativar/desativar linha
- remover linha

Modelo visual esperado:

- `Segunda - 11:45`
- `Quarta - 17:30`
- `Sexta - 09:00`

## 11.3 Hooks e services

O front ja possui:

- `useAlertas.ts`
- `alerta.service.ts`

Mas esses contratos precisam ser ajustados para:

- `schedule_rules[]`
- `destination_count`
- stats com superset estavel
- logs com `response_message_id` e `response_zaap_id`
- logs com `status`, `target_kind`, `target_value`, `provider`

## 12) Estrutura recomendada do modulo `Alertas`

```text
apps/api/app/Modules/Alertas/
|- routes.php
|- Http/
|  |- Controllers/
|  |  |- AlertController.php
|  |  |- AlertDestinationController.php
|  |  |- AlertLogController.php
|  |  `- AlertDashboardController.php
|  `- Requests/
|     |- StoreAlertRequest.php
|     |- UpdateAlertRequest.php
|     |- StoreAlertDestinationRequest.php
|     |- UpdateAlertDestinationRequest.php
|     |- AlertListRequest.php
|     |- AlertLogListRequest.php
|     `- NextFiringsRequest.php
|- Models/
|  |- Alert.php
|  |- AlertDestination.php
|  |- AlertScheduleRule.php
|  |- AlertDispatchRun.php
|  `- AlertDispatchLog.php
|- Services/
|  |- AlertService.php
|  |- AlertDestinationService.php
|  |- AlertDispatchService.php
|  |- AlertDashboardService.php
|  `- NextFiringResolver.php
`- Jobs/
   `- DispatchAlertToDestinationJob.php
```

Command:

- `apps/api/app/Console/Commands/DispatchDueAlertsCommand.php`

Migrations:

- `alert_destinations`
- `alerts`
- `alert_destination_links`
- `alert_schedule_rules`
- `alert_dispatch_runs`
- `alert_dispatch_logs`

## 13) Ordem recomendada de implementacao

## Fase 1 - base tecnica

1. ajustar o modulo `WhatsApp` para aceitar telefone ou `group_id`
2. criar `Modules/Alertas`
3. criar migrations das 6 tabelas
4. criar models e relacoes

## Fase 2 - CRUD

1. CRUD de destinos
2. CRUD de alertas
3. vinculacao alerta-destino
4. cadastro das regras dinamicas de horario

## Fase 3 - motor de disparo

1. command `alertas:dispatch-due`
2. service de resolucao de alertas devidos
3. `alert_dispatch_runs`
4. job por destino
5. `alert_dispatch_logs`
6. idempotencia e fechamento do run

## Fase 4 - dashboard e logs

1. endpoint de stats
2. endpoint de proximos disparos
3. endpoint de logs
4. endpoint de retry

## Fase 5 - integracao do front

1. substituir mocks
2. atualizar `types/alertas.ts`
3. trocar `DaysOfWeekPicker + TimesPicker` por builder dinamico
4. integrar dashboard, lista, logs e destinos

## 14) Perguntas e duvidas restantes

Ponto operacional que ainda vale alinhar antes da implementacao:

1. Sem destinos ativos:
   - quando o alerta estiver ativo mas nao tiver destino ativo, o run deve:
     - ser ignorado
     - ou gerar falha

Minha recomendacao:

- nao criar run se nao houver destinos ativos
- isso evita ruido operacional

## 15) Recomendacao final

Baseado na estrutura atual do projeto, eu faria assim:

1. corrigir primeiro o modulo `WhatsApp`, porque hoje ele quebra `group_id`
2. criar `Modules/Alertas`
3. criar um cadastro proprio de destinos, independente de `whatsapp_groups`
4. modelar horario como regra individual por dia/data + horario
5. usar timezone fixo `America/Sao_Paulo`
6. usar a mesma pipeline para `scheduler`, `send now` e `retry`
7. persistir sempre os IDs e o payload bruto do provider
8. garantir idempotencia com:
   - `idempotency_key` unica no run
   - `unique(dispatch_run_id, destination_id)` no log
9. tratar `DELETE` como arquivamento logico no MVP
10. adaptar o front para `schedule_rules[]`, porque o modelo atual nao cobre a regra real do negocio

Essa abordagem respeita a estrutura atual do projeto, evita acoplamento errado ao provider e cobre o que de fato destrava a operacao:

- destino manual
- envio no horario exato
- multiplos destinos por alerta
- horarios diferentes por dia
- logs confiaveis
- retry seguro
