# Externas WhatsApp Reminders - Implementation Plan

Escopo: criar disparos automaticos de WhatsApp para eventos de `Externas`, avisando colaboradores vinculados ao evento e um grupo/telefone especifico quando o evento for criado, quando a data de inicio for alterada e 2 horas antes da `Data e Hora de Inicio`.

Destino operacional fixo solicitado:

- `phone`: `554896318744-1499088823`
- interpretacao: grupo WhatsApp no formato legado Z-API `numero-timestamp`
- comportamento esperado: sempre enviar para esse destino alem dos colaboradores do evento

## 1. Estado atual validado

### 1.1 Docs oficiais Z-API

Validacao feita contra a documentacao oficial:

- `https://developer.z-api.io/message/send-text`
- `https://developer.z-api.io/en/message/introduction`
- `https://developer.z-api.io/en/group/introduction`

Pontos confirmados:

- `POST /instances/{instanceId}/token/{token}/send-text` recebe JSON com `phone` e `message`.
- O header `Client-Token` e obrigatorio no padrao documentado.
- `phone` pode ser telefone de contato ou ID de grupo.
- A resposta de sucesso retorna `zaapId`, `messageId` e `id`.
- A Z-API recomenda guardar `messageId` para acoes futuras.
- Para grupos, a documentacao informa dois formatos aceitos:
  - novo: `120363019502650977-group`
  - legado: `5511999999999-1623275280`
- Quebras de linha podem ser enviadas com `\n`.
- Formatacao de texto usa o padrao do WhatsApp, por exemplo `*negrito*`, `_italico_`, `~riscado~` e monospace.

Conclusao: o destino `554896318744-1499088823` esta alinhado com o formato legado de grupo e deve ser enviado exatamente como `phone`, sem passar por normalizacao numerica de telefone.

### 1.2 Modulo WhatsApp/Z-API

O envio real para Z-API ja esta centralizado no modulo `apps/api/app/Modules/WhatsApp`:

- `WhatsAppService::sendText($phone, $message)` monta o payload `phone` + `message` e chama o provider.
- `WhatsAppService::queueSendText(...)` existe para envio assicrono simples.
- `SendWhatsAppTextJob` encapsula envio de texto em fila.
- `WhatsAppTargetNormalizer` aceita telefone normal e identificadores de grupo Z-API, incluindo formatos como `120363027326371817-group` e `554896318744-1598529471`.
- `ZApiClient` usa config de `apps/api/config/whatsapp.php` com `ZAPI_BASE_URL`, `ZAPI_INSTANCE`, `ZAPI_TOKEN` e `ZAPI_CLIENT_TOKEN`.
- `/api/v1/whatsapp/status`, `/api/v1/whatsapp/qr-code/image`, `/api/v1/whatsapp/device`, `/api/v1/whatsapp/connection-state` e `/api/v1/whatsapp/disconnect` sustentam a tela de status em `/alertas/status`.

Conclusao: o novo fluxo nao deve criar outro client HTTP para Z-API. Deve usar `WhatsAppService`.

### 1.3 Modulo Alertas

O modulo `apps/api/app/Modules/Alertas` ja esta implementado para alertas genericos:

- Rotas backend:
  - `GET /api/v1/alertas/dashboard/stats`
  - `GET /api/v1/alertas/dashboard/next-firings`
  - `GET /api/v1/alertas/dashboard/recent-logs`
  - `GET|POST|PUT|DELETE /api/v1/alertas/destinos`
  - `PATCH /api/v1/alertas/destinos/{id}/toggle`
  - `GET|POST|PUT|DELETE /api/v1/alertas`
  - `PATCH /api/v1/alertas/{id}/toggle`
  - `POST /api/v1/alertas/{id}/duplicate`
  - `POST /api/v1/alertas/{id}/send`
  - `GET /api/v1/alertas/logs`
  - `POST /api/v1/alertas/logs/{logId}/retry`
- Frontend:
  - `/alertas`
  - `/alertas/lista`
  - `/alertas/novo`
  - `/alertas/destinos`
  - `/alertas/destinos/novo`
  - `/alertas/status`
  - `/alertas/logs`
- `AlertDestinationService` normaliza telefone ou grupo via `WhatsAppTargetNormalizer`.
- `AlertDispatchService` cria `alert_dispatch_runs`, cria `alert_dispatch_logs`, despacha `DispatchAlertToDestinationJob`, envia via `WhatsAppService` e persiste ids/resposta do provider.
- `alertas:dispatch-due` roda a cada minuto em `bootstrap/app.php`.
- Testes em `apps/api/tests/Feature/AlertasTest.php` cobrem destino de grupo, envio manual, logs, dashboard e retry.

Conclusao: o modulo Alertas e a referencia de padrao operacional: run/log/idempotencia/fila/provider response. Porem, nao e ideal auto-criar `alerts` genericos para cada evento de Externas, porque os lembretes dependem de entidade de negocio, colaboradores, alteracao de data e cancelamento/reagendamento.

### 1.4 Modulo Externas

O modulo `apps/api/app/Modules/Externas` gerencia a agenda:

- `ExternalEvent` representa eventos em `external_events`.
- `data_hora` e `data_hora_fim` existem em `external_events`.
- Colaboradores ficam no pivot `event_collaborators`.
- `ExternalEvent::collaborators()` aponta para `users`.
- `users.phone` e o campo atual de telefone do colaborador.
- O formulario de `apps/web/src/pages/externas/EventForm.tsx` envia `colaboradores`, `data_hora`, `data_hora_fim` e, quando Cobertura VIP esta ativa, `whatsapp_group_id`.
- `whatsapp_group_id` hoje esta acoplado a Cobertura VIP:
  - aparece no formulario dentro do bloco VIP;
  - e obrigatorio somente quando `is_vip_gallery = true`;
  - e limpo para `null` quando a cobertura VIP nao esta ativa.

Conclusao: para alertas de agenda de Externas, nao se deve depender do campo VIP `whatsapp_group_id` se o lembrete tambem precisa funcionar para eventos que nao sao Cobertura VIP.

## 2. Requisito de produto

Para cada evento externo:

1. Ao criar evento:
   - enviar WhatsApp para cada colaborador cadastrado no evento;
   - enviar tambem para o destino operacional fixo `554896318744-1499088823`;
   - enviar tambem para um grupo/telefone especifico do evento, se informado no futuro.
2. Ao editar evento e alterar `data_hora`:
   - enviar WhatsApp aos colaboradores vinculados;
   - enviar tambem ao destino operacional fixo `554896318744-1499088823`;
   - enviar tambem ao grupo/telefone especifico, se informado no futuro;
   - cancelar ou invalidar o lembrete antigo de 2 horas antes e agendar novo lembrete.
3. Duas horas antes de `data_hora`:
   - enviar lembrete para cada colaborador atual do evento;
   - enviar tambem ao destino operacional fixo `554896318744-1499088823`;
   - enviar tambem ao grupo/telefone especifico, se informado no futuro.

## 3. Decisao recomendada

Criar um subfluxo proprio dentro de `Modules/Externas`, reaproveitando a infraestrutura do modulo WhatsApp e seguindo o desenho operacional de Alertas.

Nao recomendado:

- criar chamadas HTTP diretas para Z-API dentro de `ExternaController`;
- criar registros `alerts` genericos automaticamente para cada evento;
- reutilizar `whatsapp_group_id` da Cobertura VIP como campo geral, pois o comportamento atual limpa esse campo quando `is_vip_gallery = false`.

Recomendado:

- criar tabela propria de notificacoes/logs de Externas;
- criar service/action de orquestracao;
- criar jobs de envio por destinatario;
- usar `WhatsAppService::sendText`;
- usar idempotencia por `event_id + trigger_type + target_kind + target_value + scheduled_for + event_version`;
- adicionar config de destinos padrao de Externas com `554896318744-1499088823`;
- opcionalmente adicionar um campo geral de destino WhatsApp do evento, separado da Cobertura VIP.

## 4. Modelo de dados proposto

### 4.1 Config de destinos padrao

Criar `apps/api/config/externas.php`:

```php
return [
    'timezone' => env('EXTERNAS_TIMEZONE', 'America/Sao_Paulo'),
    'whatsapp_queue' => env('EXTERNAS_WHATSAPP_QUEUE', 'default'),
    'whatsapp_due_batch_limit' => (int) env('EXTERNAS_WHATSAPP_DUE_BATCH_LIMIT', 200),
    'whatsapp_default_targets' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('EXTERNAS_WHATSAPP_DEFAULT_TARGETS', '554896318744-1499088823'))
    ))),
];
```

Variaveis `.env` novas:

```dotenv
EXTERNAS_TIMEZONE=America/Sao_Paulo
EXTERNAS_WHATSAPP_QUEUE=default
EXTERNAS_WHATSAPP_DUE_BATCH_LIMIT=200
EXTERNAS_WHATSAPP_DEFAULT_TARGETS=554896318744-1499088823
```

Regra: os destinos padrao sempre entram no conjunto de destinatarios, alem dos colaboradores. No MVP, isso atende diretamente o pedido de enviar tambem para `"phone": "554896318744-1499088823"`.

### 4.2 `external_events` opcional

Adicionar campo geral para destino coletivo do lembrete:

- `notification_whatsapp_target` nullable string(64)
- opcional: `notification_whatsapp_target_label` nullable string(120)

Esse campo aceita:

- telefone com DDI ou sem DDI;
- ID de grupo da Z-API, por exemplo `120363027326371817-group`;
- formato alternativo aceito por `WhatsAppTargetNormalizer`, por exemplo `554896318744-1598529471`.

Motivo para criar campo novo: `whatsapp_group_id` atual pertence ao contexto da Cobertura VIP e nao deve ser alterado semanticamente sem refatorar o fluxo VIP.

Observacao: esse campo nao e obrigatorio para atender o destino fixo solicitado. Ele deve ser implementado apenas se o produto quiser permitir um destino adicional por evento no formulario.

### 4.3 Nova tabela `external_event_whatsapp_notifications`

Campos sugeridos:

- `id` ulid primary
- `external_event_id` FK para `external_events`
- `trigger_type` string(50): `created`, `date_changed`, `two_hours_before`
- `recipient_type` string(50): `collaborator`, `default_target`, `event_target`
- `recipient_user_id` nullable FK `users`
- `recipient_name_snapshot` nullable string(191)
- `recipient_role_snapshot` nullable string(100)
- `target_kind` string(50): `whatsapp_phone`, `whatsapp_group`
- `target_value` string(64)
- `message_snapshot` text
- `event_title_snapshot` string
- `event_start_snapshot` datetime
- `scheduled_for` datetime
- `status` string(50): `pending`, `processing`, `success`, `failed`, `cancelled`, `skipped`
- `idempotency_key` string(191) unique
- `provider` string(50) default `zapi`
- `provider_zaap_id` nullable string(191)
- `provider_message_id` nullable string(191)
- `provider_response_id` nullable string(191)
- `provider_status_code` nullable int
- `provider_response` nullable json
- `error_message` nullable text
- `sent_at` nullable datetime
- timestamps

Indices:

- `external_event_id, trigger_type`
- `status, scheduled_for`
- `recipient_user_id, scheduled_for`
- `target_kind, target_value, scheduled_for`

Essa tabela substitui a necessidade de criar runs/logs genericos no modulo Alertas, mas preserva rastreabilidade equivalente.

## 5. Backend proposto

### 5.1 Novos arquivos

Criar em `apps/api/app/Modules/Externas`:

- `Models/ExternalEventWhatsAppNotification.php`
- `Services/ExternalEventWhatsAppNotificationService.php`
- `Jobs/SendExternalEventWhatsAppNotificationJob.php`
- `Console/DispatchDueExternalEventWhatsAppNotificationsCommand.php`
- `Support/ExternalEventWhatsAppMessageBuilder.php`

### 5.2 Alterar `ExternalEvent`

Adicionar se o destino por evento entrar no MVP:

- fillable: `notification_whatsapp_target`, `notification_whatsapp_target_label`
- casts se necessario;
- relation:
  - `whatsappNotifications(): HasMany`

Adicionar sempre:

- relation `whatsappNotifications(): HasMany`

### 5.3 Alterar `ExternaController`

O controller hoje concentra validacao e persistencia. Para menor risco no MVP, pode-se integrar o service apos os pontos existentes de persistencia.

No `store`:

1. se o campo por evento entrar no MVP, validar `notification_whatsapp_target` como nullable string max 64;
2. salvar evento;
3. sync de colaboradores;
4. chamar service:
   - `handleEventCreated($event->fresh(['collaborators']))`

No `update`:

1. capturar `$originalStart = $event->getOriginal('data_hora')`;
2. atualizar evento;
3. sync colaboradores;
4. se `data_hora` mudou:
   - `handleEventStartChanged($event->fresh(['collaborators']), $originalStart)`
5. se colaboradores mudaram mas a data nao mudou:
   - opcional no MVP: apenas o lembrete futuro usa os colaboradores atuais no momento do disparo;
   - nao reenviar mensagem imediata, salvo se produto pedir explicitamente.

### 5.4 Service de notificacao

Responsabilidades:

- montar destinatarios atuais:
  - colaboradores ativos com `users.phone` preenchido;
  - destinos padrao de `config('externas.whatsapp_default_targets')`, incluindo `554896318744-1499088823`;
  - destino coletivo `notification_whatsapp_target`, se preenchido e implementado no formulario;
- normalizar cada destino com `WhatsAppTargetNormalizer`;
- criar notificacoes imediatas (`created`, `date_changed`) com `scheduled_for = now`;
- criar notificacoes futuras (`two_hours_before`) com `scheduled_for = data_hora - 2 hours`;
- cancelar notificacoes futuras pendentes antigas quando a data mudar;
- evitar duplicidade por `idempotency_key`;
- despachar job para notificacoes imediatas ou devidas.

Regras:

- colaborador sem telefone deve gerar registro `skipped` com erro claro, nao derrubar o fluxo do evento;
- destino padrao invalido deve gerar registro `failed` ou log tecnico e acionar observabilidade, porque e configuracao operacional;
- evento cancelado/deletado deve cancelar notificacoes pendentes;
- se `data_hora - 2 hours` ja passou no momento da criacao/edicao:
  - nao criar lembrete atrasado;
  - criar registro `skipped` com motivo `two_hour_window_already_passed`, ou simplesmente nao criar e logar tecnicamente. Para auditoria, prefiro registro `skipped`.

### 5.5 Job de envio

`SendExternalEventWhatsAppNotificationJob`:

1. carrega notificacao por ULID;
2. se status nao for `pending`, retorna;
3. marca `processing`;
4. chama `WhatsAppService::sendText($targetValue, $messageSnapshot)`;
5. salva ids/resposta do provider e `sent_at`;
6. em `WhatsAppProviderException`, salva status `failed`, status code e response;
7. em `Throwable`, reporta e salva `failed`.

Fila:

- usar config nova `externas.whatsapp_queue` ou reaproveitar `alertas.queue` somente se nao houver necessidade operacional distinta;
- recomendado: `EXTERNAS_WHATSAPP_QUEUE=default` no MVP.

### 5.6 Command scheduler

Criar comando:

- `externas:dispatch-due-whatsapp-reminders`

Responsabilidade:

- buscar notificacoes `pending` com `scheduled_for <= now()->startOfMinute()`;
- limitar lote para evitar avalanche, por exemplo `--limit=200`;
- despachar `SendExternalEventWhatsAppNotificationJob`.

Registrar em `bootstrap/app.php`:

```php
$schedule->command('externas:dispatch-due-whatsapp-reminders')
    ->timezone((string) config('externas.timezone', 'America/Sao_Paulo'))
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();
```

Se nao existir `config/externas.php`, criar com:

- `timezone`
- `whatsapp_queue`
- `due_batch_limit`

## 6. Variaveis e mensagens

Criar templates simples no backend para evitar depender do frontend.

### 6.1 Variaveis obrigatorias

Dados do evento:

- `{event_id}`: ID do evento.
- `{event_title}`: `ExternalEvent.titulo`.
- `{event_start_at}`: `ExternalEvent.data_hora`.
- `{event_start_formatted}`: data/hora em `America/Sao_Paulo`, formato `dd/MM/yyyy HH:mm`.
- `{event_end_at}`: `ExternalEvent.data_hora_fim`, quando existir.
- `{event_end_formatted}`: data/hora final formatada, quando existir.
- `{event_location}`: `ExternalEvent.local`.
- `{event_address}`: `ExternalEvent.endereco_completo`, quando existir.
- `{event_contact_name}`: `ExternalEvent.contato_nome`, quando existir.
- `{event_contact_whatsapp}`: `ExternalEvent.contato_whatsapp`, quando existir.
- `{event_briefing}`: resumo limpo e truncado, quando existir.

Dados do colaborador:

- `{collaborator_name}`: `users.name`.
- `{collaborator_first_name}`: primeiro nome de `users.name`.
- `{collaborator_role}`: pivot `event_collaborators.funcao`; fallback para `users.role` ou `users.department`.
- `{collaborator_phone}`: `users.phone`.

Dados de destino coletivo:

- `{target_label}`: `Equipe VIP`, `Grupo Externas` ou label configurada.
- `{target_phone}`: `554896318744-1499088823` para o destino fixo.
- `{collaborators_list}`: lista curta dos colaboradores atuais, separada por virgula.

### 6.2 Regras de formatacao WhatsApp

- Comecar a mensagem individual com o nome do colaborador.
- Usar `*...*` para destacar titulo e labels principais.
- Usar quebras de linha `\n`; a doc oficial da Z-API lista `\n`, `\r`, `\r\n` e `%0a`, mas no Laravel deve-se usar string com `\n`.
- Evitar markdown complexo para nao quebrar visual no WhatsApp.
- Evitar emojis no MVP para manter mensagens previsiveis e compativeis com logs/testes.
- Limitar briefing/observacao para nao gerar mensagens longas demais.

### 6.3 Criacao - colaborador

```text
{collaborator_first_name}, voce foi escalado para uma externa.

*Evento:* {event_title}
*Inicio:* {event_start_formatted}
*Local:* {event_location}
*Funcao:* {collaborator_role}
```

Campos condicionais:

```text
*Endereco:* {event_address}
*Contato:* {event_contact_name} - {event_contact_whatsapp}
*Briefing:* {event_briefing}
```

### 6.4 Criacao - destino fixo/grupo

```text
*Nova externa agendada*

*Evento:* {event_title}
*Inicio:* {event_start_formatted}
*Local:* {event_location}
*Colaboradores:* {collaborators_list}
```

Enviar para:

```json
{
  "phone": "554896318744-1499088823",
  "message": "..."
}
```

### 6.5 Alteracao de data - colaborador

```text
{collaborator_first_name}, a data da sua externa foi alterada.

*Evento:* {event_title}
*Novo inicio:* {event_start_formatted}
*Local:* {event_location}
*Funcao:* {collaborator_role}
```

### 6.6 Alteracao de data - destino fixo/grupo

```text
*Data de externa alterada*

*Evento:* {event_title}
*Novo inicio:* {event_start_formatted}
*Local:* {event_location}
*Colaboradores:* {collaborators_list}
```

### 6.7 Duas horas antes - colaborador

```text
{collaborator_first_name}, lembrete da sua externa.

*Evento:* {event_title}
*Comeca em:* 2 horas
*Inicio:* {event_start_formatted}
*Local:* {event_location}
*Funcao:* {collaborator_role}
```

### 6.8 Duas horas antes - destino fixo/grupo

```text
*Lembrete de externa*

*Evento:* {event_title}
*Comeca em:* 2 horas
*Inicio:* {event_start_formatted}
*Local:* {event_location}
*Colaboradores:* {collaborators_list}
```

Formato de data: usar `America/Sao_Paulo`, seguindo `externas.timezone` e o padrao de datas do projeto.

## 7. Frontend proposto

### 7.1 `EventForm.tsx`

Adicionar campo fora do bloco de Cobertura VIP:

- label: `Destino WhatsApp do evento`
- placeholder: `Telefone ou ID do grupo Z-API`
- ajuda curta: `Recebe aviso ao criar, reagendar e 2 horas antes.`

Esse campo deve preencher `notification_whatsapp_target`.

Manter `whatsapp_group_id` existente apenas no bloco de Cobertura VIP.

Observacao para MVP: como ja existe o destino fixo `554896318744-1499088823`, este campo pode ficar para uma segunda etapa se o objetivo for reduzir o primeiro recorte.

### 7.2 `externa.service.ts`

Adicionar ao DTO:

- `notification_whatsapp_target?: string | null`
- `notification_whatsapp_target_label?: string | null`

### 7.3 `types/externas.ts`

Adicionar os mesmos campos em `ExternalEvent`.

### 7.4 Exibicao operacional

MVP minimo:

- mostrar o destino no detalhe do evento;
- nao precisa criar tela nova de logs no primeiro passo se os logs ficarem acessiveis por API/teste.

Recomendado para operacao:

- adicionar aba/lista em `/externas/:id` com historico de WhatsApp;
- ou adicionar filtro de origem em uma futura tela operacional de logs.

## 8. API opcional para logs

Adicionar rotas em `Modules/Externas/routes.php` antes de `/{id}`:

- `GET /api/v1/externas/{id}/whatsapp-notifications`
- `POST /api/v1/externas/whatsapp-notifications/{notificationId}/retry`

Retry deve criar nova notificacao com `trigger_type = retry` ou duplicar a notificacao anterior com novo ULID/idempotency key.

## 9. Idempotencia e alteracao de data

Idempotency key sugerida:

```text
externas:{event_id}:{trigger_type}:{scheduled_for_iso}:{target_kind}:{target_value}:{event_updated_at_timestamp}
```

Para `two_hours_before`, quando a data mudar:

1. cancelar pendentes antigas do evento com `trigger_type = two_hours_before`;
2. criar novas notificacoes com `scheduled_for = new_data_hora - 2 hours`;
3. manter notificacoes ja enviadas como historico.

Para `created`, usar `event_id + created_at + target`.

Para `date_changed`, usar `event_id + old_start + new_start + target`.

Para o destino fixo, a chave deve incluir `default_target`:

```text
externas:{event_id}:{trigger_type}:{scheduled_for_iso}:default_target:554896318744-1499088823:{event_updated_at_timestamp}
```

## 10. Casos de borda

- Evento criado para iniciar em menos de 2 horas: dispara criacao imediata, mas lembrete de 2 horas fica `skipped`.
- Evento sem colaborador: hoje o backend valida ao menos um colaborador, entao nao deve ocorrer pelo formulario atual.
- Colaborador sem telefone: registrar `skipped` por colaborador e seguir com os demais.
- Destino fixo `554896318744-1499088823`: sempre criar notificacao, salvo se removido explicitamente de `EXTERNAS_WHATSAPP_DEFAULT_TARGETS`.
- Grupo/telefone invalido: normalizador deve falhar para aquele destino; registrar `failed` ou `skipped` conforme momento.
- Evento deletado: cancelar pendentes no `destroy`.
- Evento cancelado por status: se houver slug/status de cancelamento, cancelar pendentes no `changeStatus`.
- Edicao que muda apenas briefing/local: nao dispara "data alterada"; o lembrete futuro usara mensagem snapshot criada anteriormente, a menos que o service recrie pendentes quando campos de mensagem mudarem. Para evitar mensagem velha, recomendado cancelar e recriar pendentes quando mudar `titulo`, `local` ou `data_hora`.

## 11. Testes TDD e validacoes

Teste TDD ja adicionado para validar a premissa do destino fixo:

- `apps/api/tests/Unit/WhatsApp/WhatsAppTargetNormalizerTest.php`
  - preserva `554896318744-1499088823` como `whatsapp_group`;
  - preserva `120363027326371817-group` como `whatsapp_group`;
  - normaliza telefone comum como `whatsapp_phone`.

Teste TDD de feature adicionado:

- `apps/api/tests/Feature/Externas/ExternalEventWhatsAppRemindersTest.php`

Coberturas implementadas:

1. Criacao de evento cria notificacoes imediatas para colaboradores e destino coletivo.
2. Criacao de evento cria notificacoes futuras para 2 horas antes.
3. Grupo Z-API legado `554896318744-1499088823` e preservado como `target_kind = whatsapp_group`.
4. Alterar `data_hora` cria notificacao `date_changed`, cancela lembretes pendentes antigos e cria novos.
5. Scheduler despacha notificacoes devidas.
6. Provider success salva `provider_message_id`, `provider_zaap_id`, `provider_response_id` e `provider_response`.
7. Provider error salva `failed`, status code e body, sem impedir a criacao do evento.
8. Mensagem individual comeca pelo primeiro nome do colaborador.
9. Mensagem usa labels em negrito do WhatsApp, por exemplo `*Evento:*`.
10. Destino fixo `554896318744-1499088823` recebe notificacao em `created`, `date_changed` e `two_hours_before`.

Validacoes executadas na implementacao:

```bash
cd apps/api
php artisan test --filter=WhatsAppTargetNormalizerTest
php artisan test --filter=ExternalEventWhatsAppRemindersTest
php artisan test --filter=ExternalEventTimezoneTest
php artisan test --filter=AlertasTest
php artisan test --filter=WhatsApp
php artisan test --filter=VipGalleryTest
php artisan list externas --raw
```

Resultado atual: todos os comandos acima passaram.

Validacao adicional executada:

- `php -l` nos arquivos PHP novos e alterados do fluxo.

Nao executado nesta etapa:

- `pnpm validate:api`, porque o recorte foi validado com testes focados de API/WhatsApp/Externas/VIP e checagem de sintaxe. Deve ser executado antes de merge/release amplo.

## 12. Sequencia de implementacao

Status da implementacao atual:

- [x] Criar config `externas.php` para timezone/fila/limite/destinos padrao.
- [ ] Criar migration de campos em `external_events`.
  - Nao implementado no MVP porque o requisito atual foi atendido pelo destino fixo `EXTERNAS_WHATSAPP_DEFAULT_TARGETS`.
- [x] Criar migration da tabela `external_event_whatsapp_notifications`.
- [x] Criar model de notificacao e relacao em `ExternalEvent`.
- [x] Criar message builder.
- [x] Criar service de notificacoes com criacao, cancelamento, due dispatch e envio.
- [x] Criar job `SendExternalEventWhatsAppNotificationJob`.
- [x] Criar command `externas:dispatch-due-whatsapp-reminders` e registrar scheduler.
- [x] Integrar chamadas no `store`, `update`, `destroy` e `changeStatus`.
- [ ] Atualizar DTO/types/form do frontend com `notification_whatsapp_target`.
  - Deferido para quando o produto quiser destino adicional por evento, alem do grupo fixo.
- [ ] Adicionar API de logs/retry.
  - Deferido; os logs ja ficam persistidos em `external_event_whatsapp_notifications`.
- [x] Adicionar testes focados.

## 13. Riscos

- O controller de Externas esta grande; idealmente uma refatoracao futura extrairia Actions, mas o MVP pode integrar service sem reestruturar tudo.
- `whatsapp_group_id` ja tem significado de Cobertura VIP; reutilizar esse campo para agenda causaria regressao em eventos sem VIP.
- Se a fila estiver em `sync` no ambiente, criacao/edicao do evento pode esperar chamadas externas. Em producao, usar worker real.
- Sem tela de logs, suporte operacional depende do banco/API. Para produto, logs por evento sao recomendados.

## 14. Validacao real local - 2026-05-14

Validacoes executadas no ambiente local `apps/api` usando o banco configurado em `.env`:

- Migration `2026_05_14_120000_create_external_event_whatsapp_notifications_table` aplicada com sucesso.
- Banco ativo: `vipsocialadm`.
- Z-API configurada e respondendo em `connectionState(true)`.
- Estado retornado pela integracao WhatsApp: conectado, `smartphone_connected = true`, origem `status+device`.
- Destino padrao ativo em config: `554896318744-1499088823`.
- Rotas WhatsApp existentes incluem `/api/v1/whatsapp/status`, `/api/v1/whatsapp/connection-state` e `/api/v1/whatsapp/send-text`.
- Rotas Alertas existentes incluem `/api/v1/alertas/logs` e `/api/v1/alertas/logs/{logId}/retry`.
- Rotas Externas existentes incluem `/api/v1/externas`, `/api/v1/externas/{id}`, `/api/v1/externas/{id}/logs`, mas ainda nao incluem endpoints especificos de logs/retry de WhatsApp de Externas.

Bloqueio encontrado para o disparo real solicitado:

- `ExternalEvent::withTrashed()->find(6)` retornou `null`.
- Busca por titulo contendo `Teste de Evento` tambem retornou `0` registros.
- Nao havia notificacoes para `external_event_id = 6`.

Conclusao operacional: o endpoint Z-API esta pronto para envio, mas o disparo real para `externas/6` nao foi executado porque esse evento nao existe no banco local da API. Para testar o envio real, e necessario confirmar o ID correto do evento no banco `vipsocialadm` ou ajustar o `.env` da API para o banco onde o evento foi cadastrado.

Melhoria aplicada durante a validacao:

- O idempotency key de `trigger_type = created` passou a usar `created_at` do evento como chave temporal estavel. Assim, reexecutar `handleEventCreated` manualmente para o mesmo evento nao cria notificacoes duplicadas nem reenvia mensagens.

## 15. Validacao real local - evento 124

Validacao executada em `2026-05-14` no banco `vipsocialadm`, evento `/externas/124`:

- Evento: `TESTE - Cobertura do VivaPark`.
- Colaborador: `Anderson marques`.
- Destino colaborador normalizado: `5548996553954`.
- Destino padrao/grupo: `554896318744-1499088823`.
- Queue connection: `database`.
- Queue isolada para teste: `externas-real-test`, para nao processar backlog nao relacionado da fila `default`.

Passos executados:

1. Criacao das notificacoes pelo service `ExternalEventWhatsAppNotificationService::handleEventCreated`.
2. Processamento da fila `externas-real-test` com `php artisan queue:work database --queue=externas-real-test --stop-when-empty`.
3. Forca dos lembretes `two_hours_before` pendentes para `due now`.
4. Despacho pelo command `externas:dispatch-due-whatsapp-reminders --limit=10` com `EXTERNAS_WHATSAPP_QUEUE=externas-real-test`.
5. Novo processamento da fila `externas-real-test`.
6. Consulta final dos logs em `external_event_whatsapp_notifications`.

Resultado:

- `created` para colaborador: `success`, com `provider_message_id` gravado.
- `created` para grupo padrao: `success`, com `provider_message_id` gravado.
- `two_hours_before` para colaborador: `success`, com `provider_message_id` gravado.
- `two_hours_before` para grupo padrao: `success`, com `provider_message_id` gravado.
- Total final: `4 success`, `0 failed`, `0 pending`.
- Jobs restantes na queue `externas-real-test`: `0`.

Status Z-API durante a validacao:

- `status(true)`: conectado.
- `connectionState(true)`: `connected = true`, `smartphone_connected = true`, origem `status+device`.

Conclusao operacional: o fluxo real de envio, persistencia de logs, command de due dispatch e processamento por fila `database` funcionaram corretamente para o evento 124.
