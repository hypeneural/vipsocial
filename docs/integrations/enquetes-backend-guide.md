# Enquetes Backend Guide

Data: 2026-03-06  
Escopo: consolidar a estrutura atual de `engajamento/enquetes` no front, registrar os gaps do backend e definir a arquitetura recomendada para um modulo robusto de enquetes com area administrativa, widget publico, voto auditavel, antifraude e metricas.

## 1) Resumo executivo

Hoje o projeto ja possui:

- front com paginas de enquetes:
  - `/engajamento/enquetes`
  - `/engajamento/enquetes/nova`
  - `/engajamento/enquetes/:id/editar`
  - `/engajamento/enquetes/:id/resultados`
- arquitetura modular no backend em `apps/api/app/Modules/*`
- `BaseController` com padrao de resposta JSON
- fila em banco
- Sanctum para area administrativa
- Spatie Media Library instalada no projeto

Hoje o projeto ainda nao possui:

- modulo formal `Modules/Enquetes` no backend
- persistencia oficial de enquetes, placements, sessoes, tentativas, votos, locks e snapshots
- endpoints administrativos reais de enquetes
- endpoints publicos de widget, boot, voto e resultados
- embed via iframe servido fora do catch-all da SPA
- pipeline oficial de antifraude e enrichment
- metricas consolidadas e logs tecnicos

Conclusao pratica:

- o front atual de enquetes existe como UX, mas ainda esta majoritariamente mockado
- o backend atual nao possui o dominio de enquetes implementado
- a enquete precisa ser tratada como produto completo, nao como script isolado
- o maior risco tecnico nao e CRUD, e sim voto publico com antifraude, auditabilidade e separacao correta entre admin e widget

## 2) Estrutura atual confirmada

## 2.1 Stack atual do front

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
- Recharts

Padrao atual do front:

- `pages/*` para telas
- `components/*` para blocos reutilizaveis
- `services/*.service.ts` para contrato HTTP
- `hooks/use*.ts` para TanStack Query
- `types/*.ts` para contratos de dominio

## 2.2 Estrutura atual do front de enquetes

Arquivos principais:

- `apps/web/src/pages/engajamento/Enquetes.tsx`
- `apps/web/src/pages/engajamento/EnqueteForm.tsx`
- `apps/web/src/pages/engajamento/EnqueteResultados.tsx`
- `apps/web/src/services/enquete.service.ts`

Rotas confirmadas:

- `/engajamento/enquetes`
- `/engajamento/enquetes/nova`
- `/engajamento/enquetes/:id/editar`
- `/engajamento/enquetes/:id/resultados`

## 2.3 Situacao atual real do front

Estado atual:

- `Enquetes.tsx` usa `mockPolls` em memoria
- `EnqueteForm.tsx` usa `setTimeout` para simular leitura e gravacao
- `EnqueteResultados.tsx` usa `pollData`, `timelineData` e `hourlyData` mockados
- o servico `enquete.service.ts` existe, mas as paginas nao o consomem
- nao existe `useEnquetes`

Problemas concretos do front atual:

1. O modelo atual e simples demais para o produto desejado.
2. O formulario atual trabalha com:
   - pergunta
   - opcoes
   - `allowMultiple`
   - datas simples sem horario
   - `channels[]`
3. O front atual nao representa:
   - `selection_type`
   - `max_choices`
   - `vote_limit_mode`
   - `vote_cooldown_minutes`
   - `results_visibility`
   - `after_end_behavior`
   - `starts_at` e `ends_at` com hora
   - placements
   - sites e dominios autorizados
   - widget publico
4. Existem textos com encoding quebrado em arquivos de pagina.
5. A pagina de resultados hoje nao usa dados reais do `id` da rota.

Conclusao:

- a UX atual e aproveitavel como direcao
- o contrato atual do front nao deve ser tratado como contrato final do backend
- o front precisa ser refatorado depois que o dominio novo for fechado

## 2.4 Stack atual do backend

Arquivos relevantes:

- `apps/api/composer.json`
- `apps/api/bootstrap/app.php`
- `apps/api/app/Providers/ModuleServiceProvider.php`
- `apps/api/app/Support/Http/Controllers/BaseController.php`
- `apps/api/routes/web.php`

Stack confirmada:

- Laravel 12
- PHP 8.2+
- Sanctum
- Spatie Activitylog
- Spatie Permission
- Database queue
- Spatie Media Library instalada
- arquitetura modular em `app/Modules/*`

Padrao atual do backend:

- cada modulo possui `routes.php`
- `ModuleServiceProvider` registra modulos em `/api/v1/*`
- providers externos ficam bindados em `AppServiceProvider`
- commands e schedules ficam em `bootstrap/app.php`
- controllers seguem `BaseController`

## 2.5 Restricao estrutural importante

Hoje `ModuleServiceProvider` registra apenas rotas API em `/api/v1/*`.

Isso significa:

- `GET /api/v1/enquetes/*` e viavel no padrao atual
- `GET /api/v1/public/enquetes/*` e viavel no padrao atual
- `GET /embed/enquetes/{placementPublicId}` nao entra naturalmente no padrao atual do modulo

Tambem existe um catch-all da SPA em `apps/api/routes/web.php` para toda rota nao-API.

Conclusao pratica:

- o widget publico em iframe precisa de rota web explicita fora do registro automatico do modulo
- sem isso, `/embed/enquetes/...` vai cair no `index.html` da SPA

## 3) Principios de arquitetura

## 3.1 Separacao obrigatoria entre admin e publico

O sistema precisa ter duas superfices:

1. API administrativa autenticada
2. API/widget publico

Admin:

- CRUD de enquetes
- CRUD de opcoes
- upload de imagem
- CRUD de placements
- CRUD de sites e dominios
- metricas
- logs
- moderacao
- invalidacao de votos

Publico:

- boot do widget
- sessao publica do widget
- tracking de eventos
- voto
- resultados publicos quando permitido

## 3.2 O embed deve usar iframe como base

Recomendacao objetiva:

- usar iframe como implementacao oficial do widget
- opcionalmente expor script loader para facilitar inclusao

Exemplo:

```html
<script
  src="https://widget.tvvip.social/enquetes/embed.js"
  data-placement="plc_01J..."
  async
></script>
```

Esse script injeta um iframe.

Motivos:

- isolamento de CSS/JS
- menor conflito com CMS externo
- melhor versionamento
- menor acoplamento com pagina externa
- superficie publica mais controlada

## 3.3 O sistema deve separar tentativa, voto aceito e bloqueio

Separar obrigatoriamente:

- tentativa de voto
- voto aceito
- bloqueio
- invalidacao futura

Motivo:

- antifraude
- forense
- troubleshooting
- auditoria
- moderacao futura

## 3.4 O sistema nao deve confiar em dados do client como verdade primaria

O backend deve capturar por conta propria:

- IP real
- user-agent
- origin
- referrer
- horario
- dominio
- contexto do placement

O cliente pode mandar sinais auxiliares, mas nao pode ser fonte primaria para:

- provider
- browser
- cidade
- dispositivo
- origem confiavel

## 3.5 O voto deve passar por um service unico e transacional

Toda a logica de voto deve passar por:

- `PollVoteService`

Esse service deve coordenar:

- validacao da enquete
- validacao das opcoes
- resolucao do estado
- resolucao da sessao
- criacao da tentativa
- aplicacao do bloqueio
- criacao dos votos
- criacao dos locks
- disparo de enrichment
- resposta final do widget

## 4) Modelagem de dados recomendada

## 4.1 Principio

Separar:

- definicao da enquete
- opcoes
- sites/dominios autorizados
- placement
- sessao tecnica
- tentativa
- voto aceito
- locks
- eventos
- snapshots

## 4.2 Tabelas recomendadas

### 1. `polls`

Campos recomendados:

- `id`
- `public_id` ulid unique
- `title`
- `question`
- `slug`
- `status` enum `draft|scheduled|live|paused|closed|archived`
- `selection_type` enum `single|multiple`
- `max_choices`
- `vote_limit_mode` enum `once_ever|once_per_day|once_per_window`
- `vote_cooldown_minutes`
- `results_visibility` enum `live|after_vote|after_end|never`
- `after_end_behavior` enum `hide_widget|show_closed_message|show_results_only`
- `starts_at`
- `ends_at`
- `timezone` default `America/Sao_Paulo`
- `settings` json
- `created_by`
- `updated_by`
- timestamps
- soft deletes

Constraints e indices criticos:

- unique(`public_id`)
- index(`status`)
- index(`starts_at`)
- index(`ends_at`)

### 2. `poll_options`

Campos recomendados:

- `id`
- `poll_id`
- `public_id` ulid unique
- `label`
- `description`
- `sort_order`
- `is_active`
- timestamps

Observacao:

- a imagem da opcao deve ser feita via Spatie Media Library
- colecao recomendada: `option_image`

Constraints e indices criticos:

- unique(`public_id`)
- index(`poll_id`, `sort_order`)
- index(`poll_id`, `is_active`)

### 3. `poll_sites`

Campos recomendados:

- `id`
- `name`
- `public_key`
- `secret_key_hash`
- `is_active`
- `settings`
- timestamps

Observacao:

- `secret_key_hash` pode permanecer `nullable` e opcional no MVP
- ele prepara o caminho para autenticacao mais forte de parceiro externo no futuro, sem virar bloqueio para a primeira entrega

### 4. `poll_site_domains`

Campos recomendados:

- `id`
- `poll_site_id`
- `domain_pattern`
- `is_active`
- timestamps

### 5. `poll_placements`

Campos recomendados:

- `id`
- `public_id` ulid unique
- `poll_id`
- `poll_site_id`
- `placement_name`
- `article_external_id`
- `article_title`
- `canonical_url`
- `page_path`
- `embed_token_hash`
- `is_active`
- `last_seen_at`
- timestamps

Constraints e indices criticos:

- unique(`public_id`)
- index(`poll_id`, `is_active`)
- index(`poll_site_id`, `is_active`)
- index(`last_seen_at`)

### 6. `poll_sessions`

Campos recomendados:

- `id` ulid
- `poll_id`
- `poll_placement_id`
- `session_token_hash`
- `fingerprint_hash`
- `external_user_hash`
- `ip_hash`
- `user_agent_hash`
- `referrer_url`
- `referrer_domain`
- `origin_domain`
- `first_seen_at`
- `last_seen_at`
- `meta`
- timestamps

Constraints e indices criticos:

- `id` em ULID
- index(`id`)
- unique(`session_token_hash`)
- index(`poll_id`, `last_seen_at`)
- index(`poll_placement_id`, `last_seen_at`)
- index(`fingerprint_hash`)
- index(`ip_hash`)

Observacao:

- `session_token_hash` e o identificador tecnico persistido da sessao do widget
- ele nao deve ser armazenado nem tratado como token reutilizavel em claro

### 7. `poll_vote_attempts`

Campos recomendados:

- `id` ulid
- `poll_id`
- `poll_placement_id`
- `poll_session_id`
- `status` enum `accepted|blocked|invalid|error`
- `block_reason`
- `risk_score`
- `ip_hash`
- `fingerprint_hash`
- `external_user_hash`
- `user_agent`
- `browser_family`
- `os_family`
- `device_type`
- `country`
- `region`
- `city`
- `asn`
- `provider`
- `meta`
- `created_at`
- `updated_at`

Constraints e indices criticos:

- index(`poll_id`, `status`, `created_at`)
- index(`poll_session_id`, `created_at`)
- index(`ip_hash`, `created_at`)
- index(`poll_placement_id`, `created_at`)

Observacao:

- no caso de voto multiplo, `meta.option_ids[]` deve ser obrigatorio
- isso preserva o payload original da tentativa, mesmo quando apenas parte dela for bloqueada ou invalidada no futuro

### 8. `poll_votes`

Campos recomendados:

- `id` ulid
- `poll_id`
- `option_id`
- `poll_placement_id`
- `poll_session_id`
- `vote_attempt_id`
- `status` enum `valid|invalidated`
- `ip_hash`
- `fingerprint_hash`
- `external_user_hash`
- `accepted_at`
- `invalidated_at`
- `invalidated_reason`
- `geo_snapshot`
- `device_snapshot`
- timestamps

Constraints e indices criticos:

- index(`poll_id`, `status`, `accepted_at`)
- index(`poll_id`, `option_id`, `status`)
- index(`poll_placement_id`, `accepted_at`)
- unique(`vote_attempt_id`, `option_id`)

Observacao critica para multipla escolha:

- a constraint `unique(vote_attempt_id, option_id)` impede a mesma opcao ser gravada duas vezes dentro da mesma tentativa aceita

### 9. `poll_vote_locks`

Campos recomendados:

- `id`
- `poll_id`
- `lock_scope` enum `session|fingerprint|external_user|ip_window`
- `lock_key`
- `vote_id`
- `locked_until`
- timestamps

Constraint critica:

- unique(`poll_id`, `lock_scope`, `lock_key`)

### 10. `poll_events`

Campos recomendados:

- `id` ulid
- `poll_id`
- `poll_placement_id`
- `poll_session_id`
- `event_type`
- `option_id`
- `meta`
- `created_at`

Tipos uteis:

- `widget_loaded`
- `widget_visible`
- `option_selected`
- `vote_clicked`
- `vote_submitted`
- `vote_accepted`
- `vote_blocked`
- `results_viewed`
- `share_clicked`

Constraints e indices criticos:

- index(`poll_id`, `event_type`, `created_at`)
- index(`poll_placement_id`, `created_at`)
- index(`poll_session_id`, `created_at`)

### 11. `poll_result_snapshots`

Campos recomendados:

- `id`
- `poll_id`
- `bucket_type` enum `hour|day`
- `bucket_at`
- `impressions`
- `unique_sessions`
- `votes_accepted`
- `votes_blocked`
- `conversion_rate`
- `payload`
- timestamps

Constraint critica:

- unique(`poll_id`, `bucket_type`, `bucket_at`)

## 4.3 Fonte de verdade e denormalizacao

Esta regra deve ser tratada como contrato tecnico do modulo:

- `poll_votes` = fonte de verdade
- `poll_result_snapshots` = agregado/cache

Decisoes explicitas:

- nao criar `votes_count` autoritativo em `poll_options`
- nao confiar em contador incremental isolado como verdade final
- toda reconciliacao deve partir de `poll_votes` com `status = valid`
- snapshots existem para leitura rapida, nao para substituir o historico real

Motivo:

- evita drift estrutural
- simplifica auditoria
- permite invalidacao futura de votos sem quebrar a consistencia do sistema

## 5) Regras de negocio obrigatorias

## 5.0 Politica de exclusao e inativacao

Esta politica deve ser tratada como decisao formal do modulo:

- `polls`: usar soft delete
- `poll_options`: preferir inativacao via `is_active`
- `poll_votes`: nunca apagar em fluxo normal, apenas invalidar
- `poll_vote_attempts`: nao apagar em fluxo normal
- `poll_placements`: preferir toggle/inativacao

Motivo:

- preservar trilha de auditoria
- evitar perda de historico tecnico
- manter consistencia entre widget, logs e metricas

## 5.1 Escolha unica ou multipla

Single:

- deve aceitar exatamente 1 opcao
- `max_choices` deve ser `null` ou `1`

Multiple:

- pode aceitar varias opcoes
- deve respeitar `max_choices`
- o backend deve validar a quantidade enviada

## 5.2 Politica de limite de voto

Campos:

- `vote_limit_mode`
- `vote_cooldown_minutes`
- `timezone`

Modos:

- `once_ever`
- `once_per_day`
- `once_per_window`

## 5.3 Estado operacional calculado do widget

Persistencia:

- `draft`
- `scheduled`
- `live`
- `paused`
- `closed`
- `archived`

Estado calculado para widget:

- `not_started`
- `accepting_votes`
- `paused`
- `ended_hide`
- `ended_closed_message`
- `ended_results_only`

Esse estado deve ser resolvido por:

- `PollStateResolver`

## 5.4 Visibilidade de resultados

Campo:

- `results_visibility`

Valores:

- `live`
- `after_vote`
- `after_end`
- `never`

## 5.5 Comportamento apos o fim

Campo:

- `after_end_behavior`

Valores:

- `hide_widget`
- `show_closed_message`
- `show_results_only`

## 6) Endpoints recomendados

## 6.1 Admin autenticado

Enquetes:

- `GET /api/v1/enquetes`
- `GET /api/v1/enquetes/{id}`
- `POST /api/v1/enquetes`
- `PUT /api/v1/enquetes/{id}`
- `DELETE /api/v1/enquetes/{id}`
- `PATCH /api/v1/enquetes/{id}/status`
- `POST /api/v1/enquetes/{id}/duplicate`
- `POST /api/v1/enquetes/{id}/close`
- `POST /api/v1/enquetes/{id}/pause`
- `POST /api/v1/enquetes/{id}/reopen`

Dashboard/admin view:

- `GET /api/v1/enquetes/dashboard/overview`
- `GET /api/v1/enquetes/{id}/dashboard`

Opcoes / imagem:

- `POST /api/v1/enquetes/options/{id}/image`
- `DELETE /api/v1/enquetes/options/{id}/image`

Sites e dominios:

- `GET /api/v1/enquetes/sites`
- `POST /api/v1/enquetes/sites`
- `PUT /api/v1/enquetes/sites/{id}`
- `GET /api/v1/enquetes/sites/{id}/domains`
- `POST /api/v1/enquetes/sites/{id}/domains`
- `PUT /api/v1/enquetes/domains/{id}`
- `DELETE /api/v1/enquetes/domains/{id}`

Placements:

- `GET /api/v1/enquetes/{id}/placements`
- `POST /api/v1/enquetes/{id}/placements`
- `PUT /api/v1/enquetes/placements/{placementId}`
- `PATCH /api/v1/enquetes/placements/{placementId}/toggle`

Metricas:

- `GET /api/v1/enquetes/{id}/metrics/overview`
- `GET /api/v1/enquetes/{id}/metrics/timeseries`
- `GET /api/v1/enquetes/{id}/metrics/options`
- `GET /api/v1/enquetes/{id}/metrics/placements`
- `GET /api/v1/enquetes/{id}/metrics/locations`
- `GET /api/v1/enquetes/{id}/metrics/providers`
- `GET /api/v1/enquetes/{id}/metrics/devices`
- `GET /api/v1/enquetes/{id}/metrics/browsers`

Logs:

- `GET /api/v1/enquetes/{id}/vote-attempts`
- `GET /api/v1/enquetes/{id}/votes`
- `GET /api/v1/enquetes/vote-attempts/{attemptId}`
- `GET /api/v1/enquetes/votes/{voteId}`

Moderacao:

- `POST /api/v1/enquetes/votes/{voteId}/invalidate`
- `POST /api/v1/enquetes/{id}/rebuild-snapshots`

Export:

- `GET /api/v1/enquetes/{id}/export/votes.csv`
- `GET /api/v1/enquetes/{id}/export/vote-attempts.csv`
- `GET /api/v1/enquetes/{id}/export/options-summary.csv`
- `GET /api/v1/enquetes/{id}/export/placements-summary.csv`

## 6.2 Publico/widget

Boot/session:

- `GET /api/v1/public/enquetes/placements/{placementPublicId}/boot`
- `POST /api/v1/public/enquetes/widget-sessions`

Resultado publico:

- `GET /api/v1/public/enquetes/{pollPublicId}/results`

Voto:

- `POST /api/v1/public/enquetes/{pollPublicId}/vote`

Eventos:

- `POST /api/v1/public/enquetes/{pollPublicId}/events`

## 6.3 Web/embed

- `GET /embed/enquetes/{placementPublicId}`

Observacao:

- essa rota precisa ser declarada em `routes/web.php` ou em algum mecanismo novo de web routes por modulo

## 7) Shape recomendado de resposta

As respostas devem seguir o padrao de `BaseController`.

Exemplo de voto aceito:

```json
{
  "success": true,
  "data": {
    "accepted": true,
    "message": "Voto registrado com sucesso.",
    "results_available": true,
    "results": {
      "total_votes": 1240,
      "options": [
        {
          "option_id": "01A",
          "label": "Jornal VIP",
          "votes": 760,
          "percentage": 61.29
        }
      ]
    }
  },
  "message": ""
}
```

Exemplo de voto bloqueado:

```json
{
  "success": false,
  "data": {
    "accepted": false,
    "block_reason": "ALREADY_VOTED_TODAY"
  },
  "message": "Voce ja votou nesta enquete hoje."
}
```

## 8) Comandos e agendamento recomendados

Commands:

- `enquetes:sync-status`
- `enquetes:reconcile-results`

Schedule recomendado em `bootstrap/app.php`:

```php
$schedule->command('enquetes:sync-status')
    ->timezone('America/Sao_Paulo')
    ->everyMinute()
    ->withoutOverlapping()
    ->onOneServer();

$schedule->command('enquetes:reconcile-results')
    ->timezone('America/Sao_Paulo')
    ->everyTenMinutes()
    ->withoutOverlapping()
    ->onOneServer();
```

## 9) Tasks e subtasks por epico

## Epico A - Fundacao do modulo

### Task A1 - Criar `Modules/Enquetes`

Subtasks:

1. Criar `apps/api/app/Modules/Enquetes`.
2. Criar `routes.php` do modulo.
3. Criar namespace padrao:
   - `Http/Controllers/Admin`
   - `Http/Controllers/Public`
   - `Http/Requests/Admin`
   - `Http/Requests/Public`
   - `Models`
   - `Services`
   - `Jobs`
   - `Support`
4. Validar que o modulo sobe com o `ModuleServiceProvider`.

Criterio de aceite:

1. O modulo aparece no `route:list`.
2. O padrao do projeto e mantido.

### Task A2 - Preparar infraestrutura de media

Subtasks:

1. Verificar/publicar config da Spatie Media Library.
2. Criar migration da tabela `media` se ainda nao existir.
3. Definir disco para imagens de opcao.
4. Definir limites de mime e tamanho.
5. Definir conversoes:
   - original
   - thumb
   - web otimizada

Criterio de aceite:

1. `PollOption` consegue receber imagem.
2. API devolve `image_url` e `image_thumb_url`.

### Task A3 - Criar migrations base do dominio

Subtasks:

1. Criar migration `polls`.
2. Criar migration `poll_options`.
3. Criar migration `poll_sites`.
4. Criar migration `poll_site_domains`.
5. Criar migration `poll_placements`.
6. Criar migration `poll_sessions`.
7. Criar migration `poll_vote_attempts`.
8. Criar migration `poll_votes`.
9. Criar migration `poll_vote_locks`.
10. Criar migration `poll_events`.
11. Criar migration `poll_result_snapshots`.
12. Adicionar indices, uniques e FKs relevantes.

Criterio de aceite:

1. Todas as migrations sobem/descem sem erro.
2. As constraints refletem a regra de negocio.

### Task A4 - Criar models e relacionamentos

Subtasks:

1. Criar os 11 models.
2. Configurar relacoes principais.
3. Integrar `PollOption` com Media Library.
4. Criar scopes uteis:
   - ativos
   - live
   - publicos
   - placements ativos
   - votos validos

Criterio de aceite:

1. Relacoes e scopes funcionam em teste.

---

## Epico B - CRUD administrativo de enquetes

### Task B1 - CRUD de enquetes

Subtasks:

1. Criar `PollController`.
2. Criar `StorePollRequest` e `UpdatePollRequest`.
3. Implementar create/update suportando opcoes embutidas e reordenacao.
4. Implementar listagem paginada com filtros.
5. Implementar `duplicate`.
6. Implementar `PATCH /status`.
7. Implementar `pause`, `close` e `reopen`.
8. Implementar `DELETE` com soft delete.

Criterio de aceite:

1. CRUD admin funciona com responses do `BaseController`.
2. O front consegue listar, criar, editar e duplicar.

### Task B2 - Regras de validacao de negocio

Subtasks:

1. Validar `selection_type`.
2. Validar `max_choices`.
3. Validar `vote_limit_mode`.
4. Validar `vote_cooldown_minutes`.
5. Validar `starts_at` e `ends_at`.
6. Validar `results_visibility`.
7. Validar `after_end_behavior`.

Criterio de aceite:

1. Nao e possivel persistir combinacoes incoerentes.

### Task B3 - Upload/remocao de imagem por opcao

Subtasks:

1. Criar endpoints de upload.
2. Criar endpoint de remocao.
3. Processar arquivos via Media Library.
4. Retornar URLs publicas no payload admin.

Criterio de aceite:

1. Cada opcao pode ter uma imagem principal.

---

## Epico C - Sites, dominios e placements

### Task C1 - CRUD de sites e dominios autorizados

Subtasks:

1. Criar `PollSiteController`.
2. Criar `PollSiteDomainController`.
3. Implementar `domain_pattern`.
4. Implementar `DomainMatcher`.
5. Adicionar ativacao/inativacao.

Criterio de aceite:

1. O sistema reconhece dominio permitido por site/parceiro.

### Task C2 - CRUD de placements

Subtasks:

1. Criar `PollPlacementController`.
2. Criar `public_id` por placement.
3. Persistir `article_external_id`, `article_title`, `canonical_url`, `page_path`.
4. Persistir `last_seen_at`.
5. Criar toggle de placement.

Criterio de aceite:

1. A mesma enquete pode ter varios placements.

### Task C3 - Token assinado de embed

Subtasks:

1. Criar `PollEmbedTokenService`.
2. Gerar token com:
   - `poll_public_id`
   - `placement_public_id`
   - `site_public_key`
   - `canonical_url` opcional
   - `exp`
3. Validar token no boot do widget.

Criterio de aceite:

1. O embed nao depende de segredo exposto no front.

---

## Epico D - Widget publico e sessao

### Task D1 - Criar rota web do iframe

Subtasks:

1. Adicionar rota explicita em `routes/web.php` para `/embed/enquetes/{placementPublicId}`.
2. Criar `EmbedController`.
3. Servir HTML do widget/loader sem colidir com a SPA admin.

Criterio de aceite:

1. `/embed/enquetes/{placementPublicId}` nao cai no `index.html` do painel.

### Task D2 - Boot do widget

Subtasks:

1. Criar `GET /api/v1/public/enquetes/placements/{placementPublicId}/boot`.
2. Resolver:
   - enquete
   - placement
   - estado calculado
   - permissao de exibir resultado
   - configuracoes do widget
3. Retornar payload consolidado para o iframe.

Criterio de aceite:

1. O widget inicializa com uma unica chamada.

### Task D3 - Sessao publica do widget

Subtasks:

1. Criar `WidgetSessionController`.
2. Criar `PollWidgetSessionService`.
3. Resolver ou criar sessao tecnica.
4. Persistir:
   - `session_token_hash`
   - `fingerprint_hash`
   - `ip_hash`
   - `user_agent_hash`
   - `origin_domain`
   - `referrer_domain`

Criterio de aceite:

1. O widget tem contexto tecnico estavel para voto e metricas.

### Task D4 - Tracking de eventos do widget

Subtasks:

1. Criar `WidgetEventController`.
2. Criar `poll_events`.
3. Registrar:
   - `widget_loaded`
   - `widget_visible`
   - `option_selected`
   - `vote_clicked`
   - `results_viewed`
4. Disparar agregacao posterior.

Criterio de aceite:

1. O sistema mede impressoes e funil do widget.

### Task D5 - Rate limit de endpoints publicos

Subtasks:

1. Configurar rate limit para `boot`.
2. Configurar rate limit para `widget-sessions`.
3. Configurar rate limit para `vote`.
4. Configurar rate limit para `events`.
5. Garantir resposta padronizada em excesso de requisicoes.

Criterio de aceite:

1. Endpoints publicos nao ficam expostos sem contencao minima.

---

## Epico E - Voto robusto

### Task E1 - Criar `PollStateResolver`

Subtasks:

1. Resolver `not_started`.
2. Resolver `accepting_votes`.
3. Resolver `paused`.
4. Resolver `ended_hide`.
5. Resolver `ended_closed_message`.
6. Resolver `ended_results_only`.

Criterio de aceite:

1. O widget e o voto obedecem a mesma regra de estado.

### Task E2 - Criar `VoteContextResolver`

Subtasks:

1. Resolver IP real.
2. Resolver user-agent.
3. Resolver origin e referrer.
4. Normalizar dominio efetivo.
5. Gerar hashes tecnicos.
6. Validar configuracao de trusted proxies / IP real no ambiente Laravel.

Criterio de aceite:

1. O backend nao depende do client para os sinais principais.
2. `ip_hash` nasce a partir do IP real esperado, nao de proxy incorreto.

Observacao tecnica:

- `ip_hash`
- `fingerprint_hash`
- `external_user_hash`
- `session_token_hash`

devem ser gerados com hash deterministico usando segredo da aplicacao.

### Task E3 - Criar `PollAntiFraudService`

Subtasks:

1. Implementar bloqueio por sessao.
2. Implementar bloqueio por fingerprint.
3. Implementar bloqueio por `external_user_hash` quando existir.
4. Implementar uso de IP como trava secundaria.
5. Calcular `risk_score`.
6. Definir `block_reason`.

Criterio de aceite:

1. O sistema bloqueia repeticoes de acordo com a politica configurada.

### Task E4 - Criar `PollVoteService` transacional

Subtasks:

1. Validar enquete e estado.
2. Validar placement e dominio.
3. Validar opcoes recebidas.
4. Criar `poll_vote_attempt`.
5. Rodar antifraude.
6. Se bloqueado:
   - marcar tentativa como `blocked`
   - registrar motivo
   - registrar evento `vote_blocked`
7. Se aceito:
   - marcar tentativa como `accepted`
   - criar um ou varios `poll_votes`
   - criar `poll_vote_locks`
   - registrar evento `vote_accepted`
8. Enfileirar jobs posteriores.
9. Responder resultado conforme `results_visibility`.

Criterio de aceite:

1. Todo voto publico passa por esse service.
2. Nao existe caminho alternativo gravando voto direto em controller.

### Task E5 - Politicas de limite de voto

Subtasks:

1. Implementar `once_ever`.
2. Implementar `once_per_day`.
3. Implementar `once_per_window`.
4. Calcular `locked_until` corretamente.

Criterio de aceite:

1. O comportamento de limite respeita a configuracao da enquete.

---

## Epico F - Resultados, metricas e snapshots

### Task F1 - Endpoint de resultados publicos

Subtasks:

1. Criar `WidgetResultController`.
2. Respeitar `results_visibility`.
3. Retornar:
   - `total_votes`
   - opcoes
   - `percentage`
   - imagem da opcao

Criterio de aceite:

1. O publico so ve resultado quando a regra permitir.

### Task F2 - Servico de agregacao

Subtasks:

1. Criar `PollResultAggregator`.
2. Agregar votos validos por opcao.
3. Agregar totais por placement.
4. Agregar por bucket hora/dia.

Criterio de aceite:

1. Os resultados do admin nao dependem de contadores soltos em opcao.

### Task F3 - `PollMetricsService`

Subtasks:

1. Criar overview.
2. Criar timeseries.
3. Criar breakdown por opcao.
4. Criar breakdown por placement.
5. Criar breakdown por localizacao.
6. Criar breakdown por provider.
7. Criar breakdown por device.
8. Criar breakdown por browser.
9. Suportar export consolidado para uso administrativo.

Criterio de aceite:

1. A pagina de resultados admin consegue sair do mock atual.

### Task F4 - Snapshots e reconciliacao

Subtasks:

1. Criar `RecomputePollStatsJob`.
2. Criar `RebuildPollSnapshotsJob`.
3. Criar command `enquetes:reconcile-results`.
4. Detectar drift entre `poll_votes` e `poll_result_snapshots`.

Criterio de aceite:

1. O sistema consegue se autocorrigir sem confiar em contadores incrementais.

---

## Epico G - Enrichment e operacao

### Task G1 - Enrichment assicrono de contexto

Subtasks:

1. Criar `EnrichVoteContextJob`.
2. Resolver:
   - cidade
   - provider
   - ASN
3. Atualizar `poll_vote_attempts`.
4. Atualizar snapshots derivados.

Criterio de aceite:

1. O hot path do voto continua curto.

### Task G2 - Sincronizacao de status

Subtasks:

1. Criar command `enquetes:sync-status`.
2. Atualizar `status` persistido conforme janela:
   - `scheduled`
   - `live`
   - `closed`
3. Registrar schedule em `bootstrap/app.php`.

Criterio de aceite:

1. O status operacional se mantem coerente automaticamente.

### Task G3 - Detecao de atividade suspeita

Subtasks:

1. Criar `DetectSuspiciousVotingJob`.
2. Definir regras simples de volume e repeticao.
3. Persistir sinalizacao para revisao futura.

Criterio de aceite:

1. O sistema ja fica preparado para moderacao avancada.

---

## Epico H - Front administrativo

### Task H1 - Refatorar lista de enquetes

Arquivos impactados:

- `apps/web/src/pages/engajamento/Enquetes.tsx`
- `apps/web/src/services/enquete.service.ts`
- novo `apps/web/src/hooks/useEnquetes.ts`

Subtasks:

1. Remover `mockPolls`.
2. Integrar listagem real.
3. Integrar filtros e stats.
4. Integrar acoes:
   - editar
   - duplicar
   - pausar
   - fechar
   - excluir
   - abrir resultados

Criterio de aceite:

1. A listagem usa API real.

### Task H2 - Refatorar formulario admin

Arquivos impactados:

- `apps/web/src/pages/engajamento/EnqueteForm.tsx`
- novos componentes de formulario

Subtasks:

1. Trocar modelo antigo por schema novo.
2. Adicionar campos:
   - titulo interno
   - pergunta
   - opcoes
   - imagem por opcao
   - `selection_type`
   - `max_choices`
   - `vote_limit_mode`
   - `vote_cooldown_minutes`
   - `starts_at`
   - `ends_at`
   - `timezone`
   - `results_visibility`
   - `after_end_behavior`
3. Validar UX para escolha unica e multipla.

Criterio de aceite:

1. O formulario representa o dominio final do backend.

### Task H3 - Refatorar tela de resultados

Arquivos impactados:

- `apps/web/src/pages/engajamento/EnqueteResultados.tsx`

Subtasks:

1. Remover `pollData` e series mockadas.
2. Consumir `dashboard` ou endpoints granulares.
3. Mostrar:
   - overview
   - distribuicao por opcao
   - serie temporal
   - serie por hora
   - placements top
   - bloqueios
4. Integrar export real.

Criterio de aceite:

1. `/engajamento/enquetes/:id/resultados` reflete a enquete real.

### Task H4 - Separar clients admin e publico

Subtasks:

1. Manter `api.ts` para admin autenticado.
2. Criar client publico dedicado para widget.
3. Evitar dependencia de Bearer token no widget.

Criterio de aceite:

1. O embed publico nao depende da sessao do painel.

---

## Epico I - Testes e hardening

### Task I1 - Testes de backend

Subtasks:

1. Testar CRUD admin.
2. Testar upload de imagem.
3. Testar placements e dominios.
4. Testar boot do widget.
5. Testar voto single.
6. Testar voto multiple.
7. Testar `once_ever`.
8. Testar `once_per_day`.
9. Testar `once_per_window`.
10. Testar resultados publicos.
11. Testar snapshots.
12. Testar reconciliacao.

Criterio de aceite:

1. O modulo novo tem cobertura minima de fluxo critico.

### Task I2 - Testes de front

Subtasks:

1. Testar hooks de listagem.
2. Testar formulario.
3. Testar resultados admin.
4. Testar estados de loading/erro/vazio.

Criterio de aceite:

1. O front deixa de depender de mocks silenciosos.

## 10) Ordem recomendada de implementacao

## Fase 1 - base tecnica

1. Criar `Modules/Enquetes`
2. Preparar Media Library
3. Criar migrations base
4. Criar models
5. Criar rota web explicita do embed

## Fase 2 - admin core

1. CRUD de enquetes
2. CRUD de opcoes
3. Upload de imagem por opcao
4. CRUD de sites/dominios
5. CRUD de placements

## Fase 3 - widget publico

1. Boot do widget
2. Sessao publica
3. Tracking de eventos
4. Embed iframe

## Fase 4 - voto robusto

1. `PollStateResolver`
2. `VoteContextResolver`
3. `PollAntiFraudService`
4. `PollVoteService`
5. `poll_vote_locks`

## Fase 5 - metricas

1. resultados publicos
2. `PollMetricsService`
3. snapshots
4. `enquetes:sync-status`
5. `enquetes:reconcile-results`

## Fase 6 - front

1. lista real
2. formulario real
3. resultados reais
4. client publico separado

## 11) Riscos tecnicos que precisam ser tratados

1. Rota `/embed/*` nao cabe no registro modular atual.
2. Media Library esta instalada, mas ainda precisa ser operacionalizada no app.
3. O hot path de voto nao pode depender de enrichment.
4. O sistema nao pode confiar em dados enviados pelo browser como verdade primaria.
5. A tela atual de resultados do front esta muito distante do contrato final.

## 12) Recomendacao final

Baseado na stack atual, eu faria assim:

1. criar `Modules/Enquetes`
2. fechar primeiro o dominio e os endpoints admin/publicos
3. resolver o problema estrutural do iframe em `routes/web.php`
4. implementar `PollVoteService` como unico ponto de voto
5. tratar `poll_votes` como fonte de verdade
6. usar `poll_result_snapshots` apenas como agregado/cache
7. refatorar o front atual apenas depois de estabilizar o contrato do backend

Essa abordagem respeita a estrutura real do projeto e evita dois erros comuns:

- adaptar o backend ao mock atual do front
- tratar enquete como contador simples em opcao

## 13) Decisoes ja congeladas

Estas decisoes nao devem ser reabertas no meio da implementacao sem motivo tecnico forte:

1. O widget oficial sera via iframe.
2. O embed sera servido por rota web explicita fora do catch-all da SPA.
3. O backend tera um modulo dedicado `Modules/Enquetes`.
4. Todo voto publico passara obrigatoriamente por `PollVoteService`.
5. `poll_votes` sera a fonte de verdade.
6. `poll_result_snapshots` sera agregado/cache.
7. `channels[]` nao fara parte do nucleo do dominio.
8. Imagem por opcao sera feita via Spatie Media Library.
9. O front atual sera refatorado somente apos estabilizacao do contrato novo.
10. O hot path do voto nao dependera de enrichment externo.
