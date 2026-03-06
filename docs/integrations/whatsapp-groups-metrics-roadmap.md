# WhatsApp Groups Metrics Roadmap (Laravel 12 + Z-API)

Data: 2026-03-06  
Status: planejamento tecnico para implementacao robusta de metricas de grupos.

## 1) Analise da estrutura atual (as-is)

Estado atual do modulo WhatsApp no projeto:

- Ja existe integracao base com Z-API para mensagens e operacoes basicas:
  - `send-text`, `send-image`, `send-link`
  - `status`, `qr-code/image`, `device`, `disconnect`
  - `group-metadata`, `light-group-metadata`
  - `contacts`, `chats`
- Arquitetura atual ja segue camadas corretas:
  - `Clients` (provider), `Services`, `Controller`, `Requests`, `Jobs`
- Ja existe cache curto para status/qr/device.
- Ja existe fila para envios async de mensagem.

Gaps para metricas de grupos:

1. Nao existe persistencia de grupos, participantes, memberships e eventos.
2. Nao existe rotina de sync periodica de grupos (command/job/scheduler).
3. Nao existe algoritmo diff `added/removed` para gerar historico `join/leave`.
4. Nao existem endpoints internos de metricas (`overview`, `by-group`, `group detail`).
5. Nao existem testes de sync e metricas.
6. Nao existe observabilidade operacional da sincronizacao (logs de batch, guard rails, etc.).

Conclusao: o modulo atual esta pronto para ser extendido, mas a feature de metricas de grupos ainda esta em nivel zero de persistencia/analytics.

## 2) Decisoes tecnicas recomendadas (to-be)

1. Fonte de sync: `GET /light-group-metadata/{groupId}`.
2. Identidade principal de participante: `lid` (`xxxxx@lid`), fallback para `phone`.
3. Metodologia de crescimento: eventos `join/leave` gerados por diff de snapshots.
4. Frequencia: 2 syncs/dia (09:00 e 21:00 `America/Sao_Paulo`).
5. Endpoints de metricas leem somente banco (nunca chamam Z-API em request do dashboard).
6. Guard rails obrigatorios para evitar falso `leave` em payload incompleto.
7. Escalabilidade inicial: 10 grupos x ~1000 membros e crescimento progressivo.

## 3) Backlog por epico (tasks e subtasks)

## Epico A — Modelo de dados e dominio

### Task A1 — Criar migrations base de metricas de grupos

Subtasks:

1. Criar migration `whatsapp_groups`.
2. Criar migration `whatsapp_participants`.
3. Criar migration `whatsapp_group_memberships`.
4. Criar migration `whatsapp_group_member_events`.
5. Adicionar indices de leitura para janelas por periodo.
6. Validar constraints de unicidade e integridade referencial.

Critério de aceite:

1. Migrations sobem e descem (`migrate`/`rollback`) sem erro.
2. Indices/uniques correspondem ao desenho de metricas.
3. Estrutura suporta os groupIds reais:
   - `120363027326371817-group`
   - `120363027392048120-group`
   - `554898580333-1622125949`
   - `554896318744-1608641074`
   - `554896318744-1598529471`

### Task A2 — Criar models Eloquent e relacionamentos

Subtasks:

1. `WhatsAppGroup` com relacoes `memberships` e `events`.
2. `WhatsAppParticipant` com relacoes `memberships` e `events`.
3. `WhatsAppGroupMembership` com status (`active|left`) e flags admin.
4. `WhatsAppGroupMemberEvent` com `event_type`.
5. Scopes utilitarios:
   - memberships ativas
   - eventos por janela
   - grupos ativos

Critério de aceite:

1. Relacoes retornam dados corretos em testes.
2. Queries principais funcionam com eager loading.

---

## Epico B — Cadastro e governanca de grupos

### Task B1 — Criar fluxo de cadastro de grupos monitorados

Subtasks:

1. Criar endpoint interno para listar grupos cadastrados (`/api/v1/whatsapp/groups`).
2. Criar endpoint para cadastrar/editar grupo monitorado (`group_id`, `is_active` e metadados basicos).
3. Criar endpoint para ativar/desativar monitoramento (`is_active`).
4. Implementar validação de formato de `group_id`.
5. Opcional: seed inicial com os 5 grupos ja conhecidos.

Critério de aceite:

1. Backend consegue definir explicitamente quais grupos serao sincronizados.
2. Nao depende de descoberta automatica do provider para iniciar.

---

## Epico C — Pipeline de sincronizacao (core)

### Task C1 — Expandir client/provider para sync de grupos

Subtasks:

1. Garantir metodo explicito de provider para `light-group-metadata/{groupId}`.
2. Padronizar parsing dos campos de grupo (`subject`, `name`, `creation`, flags).
3. Padronizar parsing de participantes (`lid`, `phone`, `isAdmin`, `isSuperAdmin`).

Critério de aceite:

1. Response da Z-API e mapeada sem perda dos campos relevantes.
2. `lid` e preservado literal (`188407984689186@lid`).

### Task C2 — Implementar `GroupSyncService` com diff e guard rails

Subtasks:

1. Criar metodo `syncGroup(groupId, syncBatchId)` com lock por grupo.
2. Carregar snapshot atual da Z-API.
3. Carregar memberships ativos anteriores do grupo.
4. Normalizar chaves (`lid` preferencial, fallback `phone`).
5. Aplicar guard rails:
   - `current_count == 0 && previous_count > 50` -> abortar diff
   - `current_count < previous_count * 0.4 && previous_count >= 100` -> marcar suspeito e abortar diff
6. Calcular `added` e `removed`.
7. Processar `added`:
   - upsert participante
   - criar/reativar membership
   - incrementar `times_joined` na reativacao
   - registrar event `join`
8. Processar `removed`:
   - marcar membership como `left`
   - registrar event `leave`
9. Atualizar membros presentes:
   - `last_seen_at`
   - `is_admin`, `is_super_admin`
10. Atualizar metadados do grupo (`last_synced_at`, `last_member_count`, flags etc.).

Critério de aceite:

1. Diff gera eventos corretos com cenarios de entrada, saida e retorno.
2. Nao gera falsos `leave` em respostas suspeitas.
3. Processamento e idempotente por `sync_batch_id` quando rerodado no mesmo ciclo.

### Task C3 — Criar Job por grupo + command de sync em lote

Subtasks:

1. Criar `SyncGroupMetadataJob`.
2. Criar `SyncWhatsAppGroupsCommand` que seleciona `groups.is_active=true`.
3. Command despacha job por grupo na fila `whatsapp`.
4. Command aceita parametros:
   - `--group=` para sync unitario
   - `--force` para ignorar guard rails (somente administracao)

Critério de aceite:

1. Sync total roda sem bloquear request HTTP.
2. Sync de grupo unico funciona para diagnostico.

### Task C4 — Agendar sync 2x ao dia

Subtasks:

1. Adicionar scheduler do Laravel para 09:00 e 21:00 (`America/Sao_Paulo`).
2. Garantir que ambiente de producao rode `schedule:run` via cron.
3. Documentar operacao no runbook.

Critério de aceite:

1. Jobs sao disparados automaticamente nos horarios definidos.
2. Time consegue verificar no log do scheduler.

---

## Epico D — Servico de metricas (read model)

### Task D1 — Implementar `GroupMetricsService` (overview)

Subtasks:

1. Resolver janela (`7d|15d|30d`) em `window_start`.
2. Calcular `groups_count`.
3. Calcular `total_memberships_current` (`active` sem dedupe).
4. Calcular `unique_members_current` (`distinct participant_fk` ativo).
5. Calcular `multi_group_members_current` (`participant_fk` ativo em 2+ grupos).
6. Calcular `multi_group_ratio`.
7. Calcular movimento no periodo:
   - `joins`, `leaves`, `net_growth`.

Critério de aceite:

1. Resultado bate com consultas SQL de validacao manual.
2. Retorno segue contrato JSON esperado.

### Task D2 — Implementar metricas por grupo

Subtasks:

1. Query por grupo com:
   - `members_current`
   - `joins_window`
   - `leaves_window`
   - `net_growth_window`
2. Incluir `name`/`subject` e `last_synced_at`.
3. Ordenacao por tamanho atual e/ou crescimento.

Critério de aceite:

1. Endpoint retorna lista consistente para dashboard.

---

## Epico E — API interna de metricas

### Task E1 — Criar requests de validacao de janela

Subtasks:

1. `WindowRequest` com `window in [7d,15d,30d]`.
2. Default `window=7d`.

### Task E2 — Criar controller de metricas de grupos

Subtasks:

1. `GET /api/v1/whatsapp/groups/metrics/overview`
2. `GET /api/v1/whatsapp/groups/metrics/by-group`
3. Opcional: `GET /api/v1/whatsapp/groups/{groupId}/metrics`
4. Resposta padrao `jsonSuccess/jsonError`.
5. Proteger por `auth:sanctum`.

Critério de aceite:

1. Endpoints estaveis, sem dependencia direta de Z-API.
2. Contrato pronto para consumo do React.

---

## Epico F — Confiabilidade e observabilidade

### Task F1 — Logs operacionais de sync

Subtasks:

1. Registrar inicio/fim por grupo e batch.
2. Registrar contadores:
   - `current_count`, `previous_count`
   - `added_count`, `removed_count`
3. Registrar motivo de abort por guard rail.

### Task F2 — Tabela/log de execucao de batch (opcional recomendado)

Subtasks:

1. Criar tabela `whatsapp_group_sync_batches` (status, started_at, finished_at, stats).
2. Relacionar `sync_batch_id` dos eventos.

Critério de aceite:

1. Time consegue auditar exatamente o que aconteceu em cada execucao.

---

## Epico G — Testes automatizados

### Task G1 — Unit tests do algoritmo diff

Subtasks:

1. Cenário `added`.
2. Cenário `removed`.
3. Cenário reentrada (`left -> active` com `times_joined++`).
4. Cenário guard rail (abort sem persistir diff).

### Task G2 — Feature tests dos endpoints de metricas

Subtasks:

1. Overview 7d/15d/30d.
2. By-group 7d/15d/30d.
3. Validacao de window invalida.
4. Auth obrigatoria.

### Task G3 — Tests de job com `Http::fake()`

Subtasks:

1. Payload valido com `lid` e `phone`.
2. Payload com participantes sem key (ignorar corretamente).
3. Falha de provider e comportamento de retry/erro.

Critério de aceite:

1. Pipeline principal coberto por testes deterministas.

---

## Epico H — Entrega para dashboard

### Task H1 — Contrato final para front

Subtasks:

1. Publicar exemplos reais de payload dos endpoints de metricas.
2. Definir nomenclatura final dos campos para cards e tabela.
3. Definir timezone oficial no `meta.generated_at`.

### Task H2 — Cache de leitura de metricas (opcional)

Subtasks:

1. Adicionar cache curto (ex.: 60-120s) nos endpoints de leitura.
2. Invalidação natural via TTL (nao precisa invalidação ativa).

Critério de aceite:

1. Dashboard responde rapido sem carga alta no banco.

## 4) Sequencia recomendada de implementacao

1. Epico A (dados)  
2. Epico B (cadastro de grupos)  
3. Epico C (sync + diff + scheduler)  
4. Epico D e E (metricas + endpoints)  
5. Epico G (testes)  
6. Epico F e H (observabilidade + performance final)

## 5) Riscos e mitigacoes

1. Risco: payload parcial da Z-API gerar saidas falsas.  
Mitigacao: guard rails + retry + abort do diff suspeito.

2. Risco: duplicidade de participantes sem `lid` (apenas phone).  
Mitigacao: priorizar `lid`; phone apenas fallback; marcar confianca baixa em fallback.

3. Risco: crescimento de `events` no longo prazo.  
Mitigacao: indices corretos + politica de arquivamento (futuro) por periodo.

4. Risco: scheduler nao executando em producao.  
Mitigacao: checklist de deploy + monitorar execucao do comando agendado.

## 6) Definicao de pronto (DoD)

1. Migrations + models em producao.
2. Sync automatico 2x/dia funcional.
3. Eventos join/leave persistidos via diff.
4. Endpoints overview/by-group entregando 7d/15d/30d.
5. Testes unit/feature/job passando.
6. Documentacao operacional atualizada.

