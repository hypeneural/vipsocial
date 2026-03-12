# Plano de Execucao - Raspagem de Grupos WhatsApp no News Radar

Este documento transforma `docs/architecture/news_scraper/07_whatsapp_groups_ingestion_spec.md` em backlog executavel.

Objetivo: permitir inicio de implementacao sem perder contexto, com ordem clara de entrega, criterios objetivos de aceite e estrategia de testes suficiente para reduzir regressao na entrega.

## 1. Decisoes ja fechadas

Estas decisoes devem ser tratadas como baseline do V1.

### 1.1 Modelo operacional

- O fluxo principal do produto e `grupo -> timeline -> selecao manual -> bundle -> noticia`.
- A unidade primaria de navegacao do usuario e o grupo monitorado.
- A timeline por grupo e o modo principal.
- A inbox global de eventos e secundaria e opcional no V1.

### 1.2 Recebimento bruto vs evento canonicamente normalizado

- O sistema deve separar receipt bruto de evento operacional.
- `whatsapp_webhook_receipts` e a trilha tecnica e a base de replay.
- `whatsapp_inbound_events` e a unidade operacional da timeline.
- O sistema nao deve mesclar duas mensagens do provider em um unico evento canonicamente persistido.

### 1.3 Contrato do provider Z-API

- `phone` identifica o grupo bruto no provider.
- `participantPhone` identifica o autor da mensagem dentro do grupo.
- `senderName` e `senderPhoto` sao snapshot de exibicao.
- `chatName` nao pode ser usado como chave de dominio.
- `messageId` deve ser tratado como estavel dentro da instancia.
- A deduplicacao do evento e composta por `provider + instance_id + message_id`.

### 1.4 Estado global vs estado por usuario

- `whatsapp_inbound_events` guarda apenas estado global do sistema e do provider.
- Estado operacional individual deve ficar em `user_whatsapp_event_states`.
- `ignore`, `unignore`, `star`, `unstar`, `mark-reviewed` e leitura nao podem alterar a visibilidade global do evento para outros usuarios.

### 1.5 Midia

- Midia vai para `whatsapp_inbound_event_media`.
- `whatsapp_inbound_events.download_status` existe apenas como resumo derivado do conjunto de midias.
- Falha de download nao impede exibicao do evento na timeline.
- URL externa da Z-API nunca pode ser tratada como ativo permanente.

### 1.6 Bundle editorial

- Bundle e um recorte manual da timeline que representa uma potencial materia.
- Bundle nunca nasce sem grupo.
- Qualquer usuario com permissao pode editar o bundle.
- Concorrencia e resolvida por `lock_version`.
- `assigned_to` e opcional e serve como sinalizacao operacional, nao como bloqueio duro no V1.

### 1.7 Promocao para `news_item`

- Promocao so ocorre por acao explicita do operador.
- Um bundle nao pode promover mais de um `news_item`.
- A promocao precisa registrar:
  - `news_item_whatsapp_origins`
  - `whatsapp_bundle_promotion_snapshots`
- `news_source` deve ser criado sob demanda na primeira promocao.

### 1.8 Exportacao para I.A.

- O markdown para I.A. deve usar snapshot textual, nunca bundle resolvido ao vivo para link externo.
- O link do snapshot deve ser assinado e expirar.
- O modulo atual de prompts deve ser reutilizado com contexto `whatsapp-bundle`.

### 1.9 Fora do V1

- OCR de imagem.
- transcricao de audio.
- agrupamento automatico completo.
- publicacao automatica sem operador.
- suporte completo a multiplos providers, embora o contrato ja deva nascer preparado.

### 1.10 Tenant

- Se o ambiente for multi-tenant, a decisao deve entrar antes da primeira migration.
- Se aplicavel, todas as tabelas precisam de `tenant_id` ou escopo equivalente.
- Toda resolucao de grupo, replay, auditoria e promocao deve respeitar tenant.

## 2. Ordem de implementacao

Executar nesta ordem:

1. Fase 0 - contratos e endurecimento do dominio.
2. Fase 1 - infraestrutura inbound e receipts.
3. Fase 2 - backend editorial base.
4. Fase 3 - timeline por grupo e estado por usuario.
5. Fase 4 - bundles e promocao.
6. Fase 5 - frontend core.
7. Fase 6 - timeline operacional no feed.
8. Fase 7 - bundles, I.A. e promocao no frontend.
9. Fase 8 - endurecimento final, observabilidade e QA.

Motivo:

- o frontend depende de contratos estaveis do backend
- a timeline depende de modelagem correta do receipt, evento e estado por usuario
- bundle e promocao dependem da timeline estar consistente
- os testes precisam congelar contrato antes de integracao visual mais ampla

## 3. Mapa de arquivos provaveis

### 3.1 Backend

- `apps/api/app/Modules/WhatsAppInbound/`
- `apps/api/app/Modules/NewsRadarWhatsApp/`
- `apps/api/app/Modules/WhatsApp/`
- `apps/api/app/Modules/NewsRadar/`
- `apps/api/app/Modules/VipGallery/`
- `apps/api/app/Support/Traits/Auditable.php`
- `apps/api/database/migrations/`
- `apps/api/database/seeders/RoleAndPermissionSeeder.php`
- `apps/api/tests/Feature/`
- `apps/api/tests/Unit/`

### 3.2 Frontend

- `apps/web/src/features/news-radar-whatsapp/`
- `apps/web/src/features/ai-prompts/`
- `apps/web/src/pages/raspagem/Feed.tsx`
- `apps/web/src/pages/raspagem/feed/`
- `apps/web/src/services/newsRadar.service.ts`
- `apps/web/src/services/whatsapp.service.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/components/layout/DesktopSidebar.tsx`
- `apps/web/src/components/layout/MobileNav.tsx`

## 4. Fase 0 - Contratos e endurecimento de dominio

Objetivo: congelar o que muda schema, semantica e comportamento antes de abrir migration e controller.

### Task 0.1: Congelar enums e invariantes

Subtasks:

- Congelar enums de `processing_status`, `ignored_reason`, `download_status`, `bundle status` e `creation_mode`.
- Congelar invariantes:
  - bundle nunca nasce sem grupo
  - evento canonico representa uma unica mensagem do provider
  - promocao nao cria mais de um `news_item` por bundle
  - falha de midia nao impede exibicao
  - reply quebrado nao impede persistencia
- Registrar explicitamente quais campos sao globais e quais sao por usuario.

Criterio de aceite:

- O time consegue abrir migrations e services sem rediscutir semantica central do modulo.

### Task 0.2: Decidir tenant e auditoria

Subtasks:

- Confirmar se o dominio precisa de `tenant_id`.
- Se sim, listar todas as tabelas que recebem o campo.
- Confirmar estrategia oficial de audit trail:
  - preferencia por `Spatie Activity Log`
  - fallback para trilha equivalente, se necessario
- Congelar quais acoes devem entrar em auditoria:
  - ignore
  - unignore
  - star
  - reordenacao
  - troca de capa
  - reopen
  - promote

Criterio de aceite:

- Tenant e auditoria deixam de ser decisoes abertas.

### Task 0.3: Congelar escopo da primeira migration

Subtasks:

- Congelar quais campos entram obrigatoriamente na primeira migration.
- Congelar quais campos podem ficar fora da primeira migration:
  - `forwarded_score`
  - `news_signal_score`
  - `relevance_score`
  - `detected_city`
  - `detected_category`
  - `contains_release_pattern`
  - `participant_display_name`
  - `sender_snapshot_json`
- Registrar isso no backlog tecnico para evitar aumento de escopo na Fase 1.

Criterio de aceite:

- O time sabe exatamente o que e core do V1 e o que pode ser postergado sem quebrar o fluxo principal.

## 5. Fase 1 - Infraestrutura inbound e receipts

Objetivo: criar a base de recebimento generico da Z-API sem contaminar o dominio editorial.

### Task 1.1: Criar modulo `WhatsAppInbound`

Subtasks:

- Criar `apps/api/app/Modules/WhatsAppInbound/`.
- Registrar `routes.php` do modulo.
- Criar controller do webhook generico.
- Criar normalizador basico do payload.
- Criar job assincrono para processamento.
- Garantir compatibilidade com o endpoint legado de gallery.

Criterio de aceite:

- O projeto consegue receber payload Z-API por endpoint generico sem depender do dominio News Radar.

### Task 1.2: Criar tabela de receipts brutos

Subtasks:

- Criar migration de `whatsapp_webhook_receipts`.
- Adicionar campos de brute log, tentativas e erro.
- Adicionar indices uteis por `provider`, `instance_id`, `received_at` e `processing_status`.
- Se tenant for aplicavel, incluir `tenant_id`.

Criterio de aceite:

- O sistema persiste todo recebimento bruto antes de qualquer decisao editorial.

### Task 1.3: Criar pipeline de replay e dispatch

Subtasks:

- Implementar persistencia do receipt antes da resposta HTTP.
- Responder `202 Accepted` rapidamente.
- Despachar job de normalizacao.
- Registrar resultado de sucesso ou falha no receipt.
- Prever ponto tecnico para replay futuro.

Criterio de aceite:

- O webhook e resiliente e o brute log permite reprocessamento.

### Task 1.4: Compatibilizar com `VipGallery`

Subtasks:

- Manter `POST /api/v1/webhook/zapi/gallery` funcionando.
- Decidir se o controller legado chama o pipeline novo ou se o pipeline novo despacha consumer legado.
- Garantir que a migracao do fluxo nao quebre a galeria atual.
- Criar testes de regressao do fluxo atual da galeria.

Criterio de aceite:

- O novo inbound nao regrede o comportamento do modulo `VipGallery`.

## 6. Fase 2 - Backend editorial base

Objetivo: criar as tabelas e contratos centrais do dominio NewsRadarWhatsApp.

### Task 2.1: Criar modulo `NewsRadarWhatsApp`

Subtasks:

- Criar `apps/api/app/Modules/NewsRadarWhatsApp/`.
- Registrar `routes.php`.
- Criar estrutura de `Http`, `Models`, `Actions`, `Services`, `Resources`, `Policies` ou equivalente adotado no projeto.
- Definir namespace e carregamento do modulo.

Criterio de aceite:

- O dominio editorial WhatsApp existe isolado da camada de provider e do News Radar final.

### Task 2.2: Criar migrations base do dominio

Subtasks:

- Criar `whatsapp_inbound_events`.
- Criar `whatsapp_inbound_event_revisions`.
- Criar `whatsapp_inbound_event_media`.
- Criar `user_whatsapp_news_groups`.
- Criar `user_whatsapp_event_states`.
- Criar `whatsapp_news_bundles`.
- Criar `whatsapp_news_bundle_items`.
- Criar `whatsapp_bundle_markdown_exports`.
- Criar `whatsapp_bundle_promotion_snapshots`.
- Criar `news_item_whatsapp_origins`.

Criterio de aceite:

- As migrations sobem e descem sem ajuste manual e refletem o dominio congelado na especificacao.

### Task 2.3: Modelos, casts e relacoes

Subtasks:

- Criar models do dominio com casts corretos.
- Definir relacoes:
  - event -> medias
  - event -> revisions
  - event -> user states
  - bundle -> items
  - bundle -> cover media
  - bundle -> promoted news item
  - group -> user preferences
- Definir scopes uteis:
  - por grupo
  - por status
  - por usuario
  - por janela temporal

Criterio de aceite:

- O dominio pode ser manipulado sem logica relacional duplicada em controller.

### Task 2.4: Resolver grupo canonico por provider

Subtasks:

- Criar servico de resolucao por `provider + provider_group_id`.
- Garantir que para Z-API a resolucao use `phone`.
- Garantir tolerancia para grupo desconhecido.
- Definir o que acontece quando o grupo existe, mas `news_ingest_enabled = false`.

Criterio de aceite:

- Todo evento editorial fica vinculado de forma objetiva ao grupo correto ou cai em fluxo de ignore tecnico previsivel.

### Task 2.5: Requests, resources e response shape

Subtasks:

- Criar requests de filtros e acoes do modulo.
- Seguir envelope padrao:
  - `success`
  - `data`
  - `message`
  - `meta` quando necessario
- Criar resources para timeline, bundle, group summary e promotion trace.

Criterio de aceite:

- O frontend recebe contratos previsiveis e consistentes com o restante do backend novo.

## 7. Fase 3 - Timeline por grupo e estado por usuario

Objetivo: tornar a timeline funcional e operavel por usuario.

### Task 3.1: Normalizacao de eventos

Subtasks:

- Mapear payload textual para `text_message`, `text_title`, `text_description` e `link_url`.
- Mapear imagem com legenda para:
  - `message_kind = image`
  - `text_message = image.caption`
  - registro em `whatsapp_inbound_event_media`
- Mapear documento, video e audio com metadados basicos.
- Persistir `received_at`, `sent_at`, `group_resolved_at` e `ready_at` quando aplicavel.

Criterio de aceite:

- O evento normalizado preserva contexto suficiente para timeline, busca e bundle.

### Task 3.2: Deduplicacao, edicao e remocao

Subtasks:

- Implementar upsert por `provider + instance_id + message_id`.
- Em `isEdit = true`, atualizar evento principal e criar revisao.
- Se houver remocao ou retratacao, marcar `is_deleted` e `deleted_at` sem apagar registro.
- Persistir erros de provider quando houver.
- Marcar bundles afetados com `has_updated_source_messages = true`.

Criterio de aceite:

- O sistema lida com repeticao, edicao e remocao sem perder rastreabilidade.

### Task 3.3: Download de midia e resumo agregado

Subtasks:

- Criar job de download de midia para storage privado.
- Persistir status por midia em `whatsapp_inbound_event_media`.
- Calcular `whatsapp_inbound_events.download_status` como resumo derivado.
- Persistir `preview_ready_at`, `storage_path`, `thumbnail_storage_path` e erros quando houver.
- Garantir badge operacional quando a midia falhar.

Criterio de aceite:

- O evento continua usavel mesmo se parte da midia falhar.

### Task 3.4: Estado operacional por usuario

Subtasks:

- Implementar `user_whatsapp_event_states`.
- Criar acoes:
  - ignore
  - unignore
  - star
  - unstar
  - mark reviewed
- Expor endpoint individual `POST /events/{id}/mark-reviewed`.
- Garantir que o estado e isolado por usuario.
- Definir defaults para primeira visualizacao.

Criterio de aceite:

- Dois usuarios podem operar a mesma timeline sem sobrescrever preferencia um do outro.

### Task 3.5: Timeline e resumo do grupo

Subtasks:

- Implementar `GET /groups/{groupFk}/timeline`.
- Implementar `GET /groups/{groupFk}/summary`.
- Implementar `POST /groups/{groupFk}/mark-as-read`.
- Permitir filtros por janela temporal, tipo, texto e visibilidade.
- Garantir paginacao por cursor.
- Retornar:
  - `bundle_usage_state`
  - estado editorial derivado
  - reposicionamento por ultimo ponto visto

Criterio de aceite:

- O frontend consegue montar a coluna de grupos e a timeline do grupo sem chamadas extras improvisadas.

## 8. Fase 4 - Bundles, promocao e rastreabilidade

Objetivo: criar a unidade editorial de trabalho e a passagem segura para `news_item`.

### Task 4.1: CRUD de bundle

Subtasks:

- Implementar create, detail e update de bundle.
- Garantir criacao apenas com eventos do mesmo grupo.
- Persistir `creation_mode`, `assigned_to`, drafts editoriais e notas.
- Preencher `first_message_at`, `last_message_at`, `message_count` e `media_count`.

Criterio de aceite:

- O operador consegue transformar selecao da timeline em bundle editorial valido.

### Task 4.2: Operacoes sobre itens do bundle

Subtasks:

- Implementar add items.
- Implementar remove item.
- Implementar reorder interno.
- Implementar troca de capa.
- Implementar duplicate e reopen.
- Garantir auditoria das mudancas relevantes.

Criterio de aceite:

- O bundle consegue funcionar como rascunho editorial real, e nao apenas agrupamento tecnico.

### Task 4.3: Concorrencia e colaboracao

Subtasks:

- Exigir `lock_version` nas mutacoes destrutivas.
- Retornar conflito quando o bundle estiver desatualizado.
- Atualizar `last_opened_by`, `last_opened_at`, `review_started_at`, `promoted_at` e `archived_at` quando aplicavel.
- Manter `assigned_to` como campo opcional de ownership operacional.

Criterio de aceite:

- Dois operadores nao conseguem sobrescrever bundle silenciosamente.

### Task 4.4: Exportacao para I.A.

Subtasks:

- Implementar preview autenticado do markdown do bundle.
- Implementar exportacao com snapshot.
- Persistir `whatsapp_bundle_markdown_exports`.
- Gerar link assinado e expirado.
- Expor rota publica assinada para leitura do snapshot exportado.
- Registrar usuario que exportou e versao do bundle.

Criterio de aceite:

- A I.A. recebe sempre um snapshot estavel do bundle.

### Task 4.5: Promocao para News Radar

Subtasks:

- Criar `PromoteWhatsAppBundleToNewsItemAction`.
- Implementar politica objetiva de fallback para titulo, excerpt e capa.
- Criar `news_source` sob demanda quando necessario.
- Criar `news_item`.
- Registrar `news_item_whatsapp_origins`.
- Registrar `whatsapp_bundle_promotion_snapshots`.
- Garantir idempotencia retornando o `news_item` existente quando o bundle ja estiver promovido.
- Atualizar `promoted_news_item_id`.

Criterio de aceite:

- O bundle vira `news_item` de forma idempotente, auditavel e reproduzivel.

## 9. Fase 5 - Frontend core

Objetivo: preparar a base reutilizavel da feature sem acoplar tudo ao `Feed.tsx`.

### Task 5.1: Estrutura da feature

Subtasks:

- Criar `apps/web/src/features/news-radar-whatsapp/`.
- Estruturar:
  - `api/`
  - `components/`
  - `hooks/`
  - `types/`
  - `utils/`
- Deixar `pages/raspagem/Feed.tsx` como consumidor, nao como dono da logica.

Criterio de aceite:

- O modulo novo existe desacoplado da pagina principal.

### Task 5.2: Tipos e contratos de frontend

Subtasks:

- Criar tipos para:
  - group summary
  - timeline event
  - user event state
  - bundle
  - bundle item
  - markdown export
  - promotion origin
- Representar explicitamente:
  - estado global
  - estado por usuario
  - `bundle_usage_state`
  - estado editorial derivado

Criterio de aceite:

- O TypeScript impede mistura de estado global do evento com estado individual do operador.

### Task 5.3: API client e hooks

Subtasks:

- Criar client de grupos.
- Criar client de timeline.
- Criar client de estados por usuario.
- Criar client de bundles.
- Criar client de exportacao e promocao.
- Criar hooks com query keys dedicadas.
- Invalidar cache correto apos mutacoes.

Criterio de aceite:

- O frontend consegue montar a experiencia inteira sem chamadas ad hoc espalhadas.

### Task 5.4: Integracao com Prompt Templates

Subtasks:

- Estender o compile context do modulo de prompts para `whatsapp-bundle`.
- Garantir mapeamento correto das variaveis existentes.
- Garantir que `{{md_url}}` use o snapshot assinado do bundle.
- Adicionar testes do prompt context para bundle.

Criterio de aceite:

- O bundle abre no composer atual sem criar um segundo sistema de prompts.

## 10. Fase 6 - Timeline operacional no feed

Objetivo: materializar a aba WhatsApp dentro de `/raspagem/feed`.

### Task 6.1: Navegacao e shell

Subtasks:

- Adicionar tab `WhatsApp` em `/raspagem/feed`.
- Preservar tab `Web`.
- Reusar shell, empty states e padroes de dialog do feed atual.

Criterio de aceite:

- O operador navega entre feed web e feed WhatsApp no mesmo lugar.

### Task 6.2: Coluna de grupos e resumo

Subtasks:

- Implementar sidebar de grupos monitorados.
- Exibir:
  - nome
  - nao lidas
  - contagem de novas
  - ultima mensagem
  - favorito ou ativo
- Implementar `mark-as-read`.
- Implementar reposicionamento pelo ultimo ponto visto.

Criterio de aceite:

- A coluna de grupos funciona como entrada primaria da operacao.

### Task 6.3: Timeline do grupo

Subtasks:

- Implementar timeline cronologica.
- Carregar por blocos com cursor.
- Renderizar texto, remetente, horario e preview de midia.
- Indicar:
  - usada em bundle
  - removida na origem
  - anexo indisponivel
- Suportar reordenacao visual quando eventos atrasados chegarem.

Criterio de aceite:

- O operador consegue entender o contexto do grupo sem abrir telas paralelas.

### Task 6.4: Operacoes por usuario

Subtasks:

- Implementar `ignore`, `unignore`, `star`, `unstar` e `mark-reviewed`.
- Garantir atualizacao de UI sem impactar outro usuario.
- Implementar barra de selecao fixa.
- Implementar busca e filtros.

Criterio de aceite:

- A timeline fica operacional para triagem real.

## 11. Fase 7 - Bundles, I.A. e promocao no frontend

Objetivo: fechar o fluxo editorial completo.

### Task 7.1: Drawer de bundle

Subtasks:

- Implementar drawer lateral do bundle.
- Permitir editar:
  - titulo
  - resumo
  - capa
  - ordem das mensagens
  - notas editoriais
- Mostrar avisos de `has_updated_source_messages`.

Criterio de aceite:

- O bundle se comporta como rascunho de materia utilizavel pelo redator.

### Task 7.2: Integracao com I.A.

Subtasks:

- Abrir bundle no composer de prompt.
- Oferecer preview do markdown.
- Gerar exportacao assinada para I.A.
- Manter historico consistente com snapshot.

Criterio de aceite:

- O bundle reaproveita o investimento de I.A. ja feito no projeto.

### Task 7.3: Promocao visual para News Radar

Subtasks:

- Implementar CTA de promover bundle.
- Tratar conflitos de `lock_version`.
- Mostrar resultado da promocao e referencia ao `news_item` criado.
- Permitir navegar do bundle promovido para o feed web quando aplicavel.

Criterio de aceite:

- O operador fecha o ciclo editorial do WhatsApp ate o News Radar sem sair do fluxo.

## 12. Fase 8 - Endurecimento final

Objetivo: preparar merge e deploy sem debito obvio.

### Task 8.1: Permissoes

Subtasks:

- Adicionar permissao dedicada no backend e no frontend:
  - `news_radar_whatsapp.view`
  - `news_radar_whatsapp.bundle`
  - `news_radar_whatsapp.promote`
  - `news_radar_whatsapp.manage_groups`
- Garantir fallback visual para usuario sem permissao.

Criterio de aceite:

- O modulo nao fica acessivel indevidamente por rota, UI ou API.

### Task 8.2: Observabilidade e filas

Subtasks:

- Criar fila dedicada para inbound.
- Criar fila dedicada para download de midia.
- Definir retries controlados.
- Definir dead-letter para falhas persistentes.
- Instrumentar metricas tecnicas e editoriais da especificacao.

Criterio de aceite:

- O pipeline nao depende de adivinhacao para troubleshooting em producao.

### Task 8.3: Documentacao final

Subtasks:

- Atualizar a especificacao se algum contrato final mudar.
- Registrar payloads finais dos endpoints.
- Registrar comandos de teste e verificacao.
- Registrar decisao final de tenant, se aplicavel.

Criterio de aceite:

- Codigo, API e documentacao entregues ficam alinhados.

## 13. Estrategia de testes

Objetivo: sair de implementacao "parece funcionar" para entrega verificavel.

### 13.1 Testes unitarios backend

Cobrir:

- normalizacao do payload Z-API
- resolucao de grupo por `phone`
- derivacao de `download_status`
- fallback editorial de promocao
- snapshot de exportacao e promocao
- regras de colaboracao do bundle

Criterio de aceite:

- As regras mais sensiveis do dominio ficam cobertas sem depender de controller.

### 13.2 Feature tests backend

Cobrir:

- webhook generico aceita e persiste receipt
- replay e deduplicacao por chave composta
- imagem com legenda vira `text_message`
- edicao cria revisao
- remocao marca evento como removido
- reply quebrado persiste sem bloquear ingestao
- timeline por grupo
- `mark-as-read`
- `ignore`, `unignore`, `star`, `unstar`, `mark-reviewed`
- create/update/archive/reopen/duplicate bundle
- exportacao de markdown
- promocao idempotente
- ownership por usuario no estado operacional

Criterio de aceite:

- O contrato HTTP do modulo fica congelado por testes.

### 13.3 Testes de regressao de integracao

Cobrir:

- compatibilidade do endpoint legado da galeria
- contrato do feed web nao quebrado apos introduzir o modulo novo
- integracao do bundle com `ai-prompts`
- criacao lazy de `news_source`

Criterio de aceite:

- O novo fluxo nao regrede modulos ja existentes.

### 13.4 Testes frontend

Cobrir:

- hooks de grupos e timeline
- barra de selecao
- estado por usuario
- render de timeline com eventos fora de ordem
- drawer de bundle
- conflito de `lock_version`
- composer de I.A. com bundle
- filtro, busca e `mark-as-read`

Criterio de aceite:

- O core da experiencia pode ser validado sem QA manual pesado em cada alteracao pequena.

### 13.5 Testes de carga e resiliencia minima

Cobrir:

- repeticao do mesmo webhook
- rajada de eventos no mesmo grupo
- falha intermitente de download de midia
- mensagem atrasada entrando em bloco temporal ja carregado
- exportacao de markdown enquanto bundle sofre edicao concorrente

Criterio de aceite:

- O fluxo nao quebra nos cenarios mais provaveis de producao.

## 14. QA manual obrigatorio

Checklist minimo:

1. Receber texto puro em grupo monitorado.
2. Receber imagem sem legenda.
3. Receber imagem com legenda e link.
4. Receber documento.
5. Receber mensagem duplicada.
6. Receber mensagem editada ja usada em bundle.
7. Receber mensagem removida na origem.
8. Abrir grupo, selecionar mensagens e criar bundle.
9. Reordenar bundle e trocar capa.
10. Abrir bundle no composer de I.A.
11. Exportar markdown do bundle.
12. Promover bundle para `news_item`.
13. Confirmar rastreio em `news_item_whatsapp_origins`.
14. Confirmar `mark-as-read` e reposicionamento.
15. Confirmar que ignore e estrela sao individuais por usuario.

Criterio de aceite:

- O fluxo fecha ponta a ponta sem depender de ajuste manual no banco.

## 15. Definicao de pronto do V1

O V1 esta pronto quando:

- o sistema recebe webhook Z-API por pipeline generico
- cada mensagem do provider vira no maximo um evento canonico
- o operador navega por grupo e timeline, nao por webhook bruto
- `ignore`, `star`, `reviewed` e leitura funcionam por usuario
- o operador cria bundle, edita bundle, exporta bundle e promove bundle
- a promocao e auditavel, idempotente e rastreavel
- o modulo de prompts funciona com contexto de bundle
- os testes unitarios, feature, regressao e frontend cobrem os contratos principais
- o QA manual obrigatorio fecha sem regressao aberta bloqueante

## 16. Checklist de inicio rapido

Se a implementacao comecar agora, a ordem pratica recomendada e:

1. Criar `WhatsAppInbound` e `NewsRadarWhatsApp`.
2. Congelar tenant, auditoria e primeira migration.
3. Implementar receipts, eventos, midia e user states.
4. Implementar normalizacao e deduplicacao.
5. Implementar timeline por grupo e `mark-as-read`.
6. Implementar bundles e concorrencia.
7. Implementar exportacao para I.A.
8. Implementar promocao com origem e snapshot.
9. Criar feature frontend `news-radar-whatsapp`.
10. Integrar no `Feed.tsx`.
11. Cobrir testes automatizados.
12. Executar QA manual e ajustar regressao.
