# Especificacao Tecnica - Raspagem de Grupos WhatsApp no News Radar

Data: 2026-03-12
Escopo: definir como o modulo `raspagem/feed` deve evoluir para aceitar ingestao de noticias vindas de grupos de WhatsApp, reaproveitando a infraestrutura atual de Z-API, modulo WhatsApp, News Radar e Prompt Templates de I.A.

## 1. Objetivo

Permitir que o usuario acompanhe em um unico lugar:

- noticias vindas de portais e feeds web
- mensagens e anexos vindos de grupos de WhatsApp monitorados

O objetivo nao e tratar toda mensagem de grupo como noticia automaticamente.

O objetivo correto e:

1. ingerir toda mensagem relevante sem perda de contexto
2. apresentar isso em timeline cronologica por grupo monitorado
3. permitir selecao manual de uma ou varias mensagens relacionadas
4. transformar essa selecao em um bundle editorial
5. reescrever ou promover o bundle para uma nova noticia

Fluxo editorial esperado:

- grupo -> timeline de mensagens -> selecao manual -> bundle -> noticia

O operador deve conseguir abrir um grupo monitorado, visualizar a linha do tempo completa de mensagens recebidas daquele grupo e selecionar manualmente uma ou mais mensagens relacionadas para transforma-las em uma nova noticia.

## 2. Resumo executivo

Decisoes centrais:

- WhatsApp deve entrar no News Radar como inbox editorial com staging, nao como `news_item` direto
- a unidade primaria de navegacao do usuario deve ser o grupo monitorado e sua timeline
- a inbox global de eventos e secundaria e opcional no V1

Arquitetura recomendada em 4 camadas:

1. infraestrutura inbound do provider
2. dominio canonico de grupos WhatsApp
3. dominio editorial de timeline, bundles e exportacao para I.A.
4. promocao opcional para `news_items`

Mudancas mais importantes desta revisao:

- separar recebimento bruto de evento normalizado
- separar estado global da mensagem de estado operacional por usuario
- trocar deduplicacao simples por chave composta
- tornar timeline por grupo o modo principal de operacao
- versionar mensagens editadas
- extrair midia para tabela propria
- introduzir concorrencia e transicoes formais no bundle
- mover o webhook generico para modulo de infraestrutura transversal
- tornar a promocao um servico transacional dedicado
- adotar criacao lazy de `news_source`
- definir snapshot para exportacao de markdown para I.A.
- definir seguranca, retencao, observabilidade e replay desde o V1

## 3. Analise da estrutura atual

## 3.1 Webhook da Z-API hoje

Hoje o webhook ativo da Z-API esta acoplado ao fluxo da Cobertura VIP:

- rota: `apps/api/app/Modules/VipGallery/routes.php`
- controller: `apps/api/app/Modules/VipGallery/Http/Controllers/ZApiGalleryWebhookController.php`
- normalizador: `apps/api/app/Modules/VipGallery/Support/ZApiGalleryPayload.php`
- job de roteamento: `apps/api/app/Modules/VipGallery/Jobs/ProcessVipGalleryWebhookJob.php`

Comportamento atual:

1. valida secret por header
2. persiste payload bruto em `vip_gallery_webhook_logs`
3. responde `202 Accepted`
4. processa assincronamente
5. resolve evento VIP ativo por `whatsapp_group_id`
6. entende apenas:
   - imagem para galeria
   - texto que casa com pause/delete command

Conclusao:

- o parser atual e especifico para galeria
- ele nao foi desenhado para timeline editorial
- ele nao suporta agrupamento de mensagens fracionadas
- ele nao suporta conceito de bundle de noticia
- ele nao deve ser expandido diretamente para o novo caso

## 3.2 Modulo WhatsApp ja existente

O projeto ja possui base util para esse trabalho:

- modulo backend: `apps/api/app/Modules/WhatsApp/`
- model de grupos: `apps/api/app/Modules/WhatsApp/Models/WhatsAppGroup.php`
- CRUD de grupos monitorados: `apps/api/app/Modules/WhatsApp/Http/Controllers/WhatsAppGroupsController.php`
- sync de metadata: `apps/api/app/Modules/WhatsApp/Services/GroupSyncService.php`
- client Z-API: `apps/api/app/Modules/WhatsApp/Clients/ZApiClient.php`

O backend ja suporta:

- grupos persistidos em `whatsapp_groups`
- formatos antigos e novos de `group_id`
- grupos ativos e inativos
- sync de metadata e membros
- metricas de grupos por leitura do banco

Conclusao:

- nao faz sentido criar um cadastro paralelo de grupos so para o News Radar
- `whatsapp_groups` deve seguir como fonte canonica de grupos

## 3.3 News Radar hoje

O News Radar atual trabalha em cima de `news_items`:

- rotas: `apps/api/app/Modules/NewsRadar/routes.php`
- controller do feed: `apps/api/app/Modules/NewsRadar/Http/Controllers/NewsItemController.php`
- model: `apps/api/app/Modules/NewsRadar/Models/NewsItem.php`
- frontend: `apps/web/src/pages/raspagem/Feed.tsx`

Observacoes importantes:

- `news_sources.source_type` ja aceita `whatsapp`
- o feed atual renderiza somente `NewsItem`
- o composer de prompt atual trabalha com contexto de `NewsItem`
- o markdown publico atual foi pensado para noticia promovida e publicada no radar

Conclusao:

- WhatsApp nao deve entrar direto em `news_items` na ingestao
- precisa existir uma camada de staging antes da promocao editorial

## 3.4 Frontend atual do WhatsApp

Hoje existe backend real para grupos, mas a tela administrativa ainda e majoritariamente mock:

- pagina mock: `apps/web/src/pages/automacao/Grupos.tsx`
- servico do front: `apps/web/src/services/whatsapp.service.ts`

Hoje o front cobre:

- status da conexao
- metricas agregadas de grupos

Hoje nao cobre:

- timeline operacional de mensagens por grupo
- CRUD real orientado ao News Radar
- bundles editoriais
- uso de grupos no feed do News Radar

## 3.5 Conclusao da analise

O projeto ja tem infraestrutura util, mas o dominio editorial ainda nao existe.

O caminho recomendado e:

1. manter `Modules/WhatsApp` como camada canonica de grupos e provider
2. criar infraestrutura inbound reutilizavel para mensagens recebidas
3. criar um dominio editorial proprio para WhatsApp dentro do News Radar
4. promover bundle para `news_item` apenas quando o operador decidir

## 4. Decisoes de arquitetura

## 4.1 Timeline-first na UX, inbox-first no pipeline

Mensagem de WhatsApp entra primeiro como item de staging operacional, nao como noticia final.

Mas a experiencia principal do operador nao deve ser "acompanhar eventos" nem "acompanhar webhooks".

O operador deve:

1. escolher um grupo monitorado
2. ver a timeline cronologica daquele grupo
3. selecionar uma ou varias mensagens relacionadas
4. transformar essa selecao em um bundle editorial
5. gerar uma nova noticia a partir desse bundle

Motivo:

- payload pode vir fracionado
- varias fotos podem pertencer a um mesmo release
- o grupo pode misturar noticia, conversa, correcao, audio, documento e contexto

Decisao de UX:

- modo principal: timeline por grupo
- modo secundario: inbox global opcional para triagem transversal

## 4.2 Recebimento bruto e evento operacional sao coisas diferentes

O sistema precisa de duas camadas persistidas:

1. receipt bruto do webhook
2. evento canonicamente normalizado

Motivo:

- permite replay
- permite reprocessar parser
- preserva auditoria
- evita misturar trilha tecnica com dado editorial

## 4.3 Grupos canonicos no backend + assinatura por usuario

Usar dois niveis:

1. `whatsapp_groups` como cadastro canonico do sistema
2. uma pivot por usuario definindo quais grupos aparecem na aba WhatsApp daquele usuario

Motivo:

- o mesmo grupo pode ser util para varios usuarios
- nem todo usuario precisa ver todos os grupos
- evita duplicar grupo por usuario

Se o ambiente rodar em arquitetura multi-tenant:

- todas as tabelas do dominio devem receber `tenant_id` ou escopo equivalente
- toda resolucao de grupo, replay, auditoria e promocao deve respeitar tenant
- essa decisao precisa entrar antes da primeira migration para evitar retrabalho estrutural

## 4.4 Bundle editorial como entidade propria

Bundle deve ser descrito no produto como um recorte manual da timeline do grupo que representa uma potencial materia.

Isso significa:

- uma unica mensagem pode virar bundle
- varias mensagens seguidas podem virar bundle
- texto + foto + correcao + link podem virar bundle
- o bundle nasce da selecao manual do operador dentro do grupo

Motivo:

- precisa existir estado intermediario entre mensagem bruta e `news_item`
- bundle e a unidade correta para reescrita, organizacao e promocao

## 4.5 Promocao para `news_items` e opcional

Fluxos permitidos:

- usar bundle apenas para reescrita e copiar texto
- promover bundle para `news_items`
- arquivar bundle sem promocao

## 4.6 Prompt Templates devem continuar funcionando

O modulo de prompts deve ser reaproveitado.

Decisao recomendada:

- `{{md_url}}` continua existindo
- no feed web ele aponta para `/news/{public_token}.md`
- na aba WhatsApp ele aponta para snapshot assinado de markdown do bundle
- a URL assinada externa do snapshot deve terminar com `.md` para facilitar reconhecimento por ChatGPT, Claude e ferramentas similares

Nao usar URL publica permanente para bundle.

## 4.7 Webhook generico e infraestrutura transversal

O webhook generico da Z-API nao deve morar conceitualmente no News Radar.

Recomendacao:

- criar `apps/api/app/Modules/WhatsAppInbound/`

Responsabilidades:

- endpoint
- autenticacao do provider
- persistencia de receipt bruto
- normalizacao basica
- despacho para consumidores

Consumidores previstos:

- `VipGalleryInboundConsumer`
- `NewsRadarWhatsAppInboundConsumer`

## 5. Arquitetura recomendada

## 5.1 Camada 1 - Infraestrutura inbound

Modulo recomendado:

- `apps/api/app/Modules/WhatsAppInbound/`

Responsabilidades:

- receber webhook
- validar autenticacao
- persistir headers e payload bruto
- deduplicar no nivel de receipt quando aplicavel
- despachar processamento assincrono
- suportar replay operacional

Endpoint recomendado:

- `POST /api/v1/webhook/zapi/inbound-message`

Compatibilidade:

- manter `POST /api/v1/webhook/zapi/gallery` ativo
- internamente esse endpoint deve chamar o mesmo pipeline generico

## 5.2 Camada 2 - Dominio canonico de grupos

Modulo existente e reutilizado:

- `apps/api/app/Modules/WhatsApp/`

Responsabilidades:

- grupos canonicos
- sync de metadata
- sync de membros
- capacidades do grupo
- politicas basicas do grupo

## 5.3 Camada 3 - Dominio editorial WhatsApp

Modulo recomendado:

- `apps/api/app/Modules/NewsRadarWhatsApp/`

Responsabilidades:

- eventos normalizados
- revisoes de mensagem
- midia persistida
- timeline por grupo
- inbox global opcional
- bundles
- exportacao de markdown para I.A.
- promocao para News Radar

## 5.4 Camada 4 - Dominio final do News Radar

Modulo existente:

- `apps/api/app/Modules/NewsRadar/`

Responsabilidades:

- `news_sources`
- `news_items`
- `public_token`
- feed final publicado

## 6. Modelo de dados recomendado

## 6.1 Receipts brutos

Tabela recomendada:

`whatsapp_webhook_receipts`

Campos minimos:

- `id`
- `provider`
- `instance_id`
- `receipt_type`
- `headers_json`
- `payload_json`
- `payload_hash`
- `received_at`
- `processing_status`
- `processing_attempts`
- `last_error`
- `normalized_event_id` nullable
- `created_at`
- `updated_at`

Uso:

- trilha de auditoria do que chegou
- replay
- investigacao tecnica

Observacoes:

- `payload_json` e a fonte de verdade do bruto
- `payload_hash` ajuda a detectar replay identico
- o receipt nao substitui o evento canonicamente normalizado

## 6.2 Eventos canonicos operacionais

Tabela recomendada:

`whatsapp_inbound_events`

Campos minimos:

- `id`
- `provider`
- `instance_id`
- `message_id`
- `provider_message_id` nullable
- `normalized_version`
- `payload_hash`
- `ingested_via_receipt_id`
- `whatsapp_group_fk` nullable
- `group_id_raw`
- `chat_name`
- `is_group`
- `is_newsletter`
- `from_me`
- `is_edit`
- `provider_event_type` nullable
- `status`
- `message_kind`
- `participant_phone`
- `participant_lid`
- `participant_display_name` nullable
- `sender_name`
- `sender_photo`
- `sender_snapshot_json` nullable
- `reference_message_id` nullable
- `reply_to_message_id` nullable
- `reply_to_inbound_event_id` nullable
- `text_message` nullable
- `text_title` nullable
- `text_description` nullable
- `link_url` nullable
- `processing_status`
- `ignored_reason` nullable
- `provider_error_code` nullable
- `provider_error_message` nullable
- `is_deleted`
- `deleted_at` nullable
- `download_status`
- `group_resolved_at` nullable
- `ready_at` nullable
- `has_media`
- `has_caption`
- `is_forwarded`
- `forwarded_score` nullable
- `news_signal_score` nullable
- `relevance_score` nullable
- `suggested_bundle_key` nullable
- `detected_city` nullable
- `detected_category` nullable
- `has_external_link`
- `contains_release_pattern`
- `sent_at`
- `received_at`
- `edited_at` nullable
- `created_at`
- `updated_at`

Indices recomendados:

- `unique(provider, instance_id, message_id)`
- indice por `whatsapp_group_fk, sent_at desc, id desc`
- indice por `processing_status`
- indice por `reply_to_inbound_event_id`
- indice por `ingested_via_receipt_id`

Uso:

- base operacional da timeline cronologica por grupo
- base de filtro, busca, agrupamento e bundle
- nao armazenar blob bruto como responsabilidade primaria

Observacao importante:

- `whatsapp_inbound_events` guarda apenas estado global do sistema e do provider
- acoes individuais do operador, como ignorar, favoritar ou marcar como revisado, nao devem morar nesta tabela
- `ignored_reason` deve ser reservado para ignorar tecnico ou sistemico, nao para preferencia individual de usuario

## 6.3 Revisoes de eventos editados

Tabela recomendada:

`whatsapp_inbound_event_revisions`

Campos:

- `id`
- `inbound_event_id`
- `revision_number`
- `payload_json`
- `text_message` nullable
- `text_title` nullable
- `text_description` nullable
- `link_url` nullable
- `edited_at`
- `created_at`

Uso:

- trilha minima de edicao
- auditoria editorial
- comparacao entre versoes

Regra:

- quando `isEdit = true`, atualizar o evento principal e criar uma revisao

## 6.4 Midia separada por evento

Tabela recomendada:

`whatsapp_inbound_event_media`

Campos:

- `id`
- `inbound_event_id`
- `kind`
- `source_url`
- `thumbnail_source_url` nullable
- `storage_disk` nullable
- `storage_path` nullable
- `storage_visibility` nullable
- `thumbnail_storage_path` nullable
- `file_name` nullable
- `mime_type` nullable
- `file_size` nullable
- `sha256` nullable
- `width` nullable
- `height` nullable
- `duration_ms` nullable
- `page_count` nullable
- `download_status`
- `download_attempts`
- `preview_ready_at` nullable
- `last_error` nullable
- `created_at`
- `updated_at`

Tipos recomendados de `kind`:

- `image`
- `video`
- `document`
- `audio`
- `thumbnail`

Motivo:

- a arquitetura fica preparada para retry, preview, OCR, scan e variantes futuras

## 6.5 Grupo canonico e capacidades

No `whatsapp_groups`, reforcar ou adicionar:

- `provider`
- `provider_group_id`
- `connected_phone` nullable
- `news_ingest_enabled`
- `vip_gallery_enabled`
- `allow_media_download`
- `allow_ai_export`
- `default_label` nullable
- `default_city` nullable
- `default_category` nullable
- `news_source_id` nullable

Regra:

- `provider_group_id` e o identificador bruto do grupo no provider
- para Z-API, `provider_group_id = phone`

Indice recomendado:

- `unique(provider, provider_group_id)`

Motivo:

- evitar regra espalhada
- reduzir dependencia de config estatica
- suportar multiplos providers no futuro

## 6.6 Assinatura de grupos por usuario

Tabela recomendada:

`user_whatsapp_news_groups`

Campos:

- `id`
- `user_id`
- `whatsapp_group_fk`
- `is_active`
- `sort_order`
- `label_override` nullable
- `last_seen_event_at` nullable
- `last_seen_event_id` nullable
- `notification_mode` nullable
- `created_at`
- `updated_at`

Indices recomendados:

- `unique(user_id, whatsapp_group_fk)`
- indice por `user_id, is_active, sort_order`

Uso:

- define quais grupos aparecem na aba WhatsApp daquele usuario
- preserva ordem e preferencia individual

### Estado operacional por usuario nas mensagens

Tabela recomendada:

`user_whatsapp_event_states`

Campos:

- `id`
- `user_id`
- `inbound_event_id`
- `is_ignored`
- `is_starred`
- `reviewed_at` nullable
- `last_seen_at` nullable
- `created_at`
- `updated_at`

Indices recomendados:

- `unique(user_id, inbound_event_id)`
- indice por `user_id, is_ignored`
- indice por `user_id, is_starred`

Uso:

- ignore individual
- estrela individual
- reviewed individual
- leitura individual

Regra:

- acoes como `ignore`, `star`, `unstar` e `mark-reviewed` devem operar aqui
- uma acao individual nunca deve alterar visibilidade global da mensagem para outros usuarios

## 6.7 Bundles editoriais

Tabela recomendada:

`whatsapp_news_bundles`

Campos minimos:

- `id`
- `whatsapp_group_fk`
- `status`
- `creation_mode`
- `assigned_to` nullable
- `title` nullable
- `slug_hint` nullable
- `headline_draft` nullable
- `subheadline_draft` nullable
- `lead_draft` nullable
- `summary` nullable
- `origin_summary` nullable
- `notes` nullable
- `editorial_notes` nullable
- `promotion_notes` nullable
- `city` nullable
- `urgency` nullable
- `category` nullable
- `categories_json` nullable
- `is_starred`
- `cover_media_id` nullable
- `lock_version`
- `last_opened_by` nullable
- `last_opened_at` nullable
- `review_started_at` nullable
- `promoted_at` nullable
- `archived_at` nullable
- `created_by`
- `updated_by`
- `first_message_at`
- `last_message_at`
- `message_count`
- `media_count`
- `primary_sender_name` nullable
- `has_updated_source_messages`
- `promoted_news_item_id` nullable
- `created_at`
- `updated_at`
- `deleted_at`

Status recomendados:

- `open`
- `reviewing`
- `ready`
- `promoted`
- `archived`

Transicoes permitidas:

- `open -> reviewing`
- `reviewing -> ready`
- `ready -> promoted`
- `open -> archived`
- `reviewing -> archived`
- `ready -> archived`

Nao permitir mudanca arbitraria de status.

Valores recomendados para `creation_mode`:

- `manual_selection`
- `manual_plus_suggestions`

Regra minima de colaboracao:

- qualquer usuario com permissao pode editar o bundle
- concorrencia e resolvida por `lock_version`
- `assigned_to` e opcional e serve apenas para sinalizacao operacional, nao para bloqueio tecnico duro no V1

## 6.8 Itens do bundle

Tabela recomendada:

`whatsapp_news_bundle_items`

Campos:

- `id`
- `bundle_id`
- `inbound_event_id`
- `sort_order`
- `is_cover`
- `added_by`
- `created_at`

Indices recomendados:

- `unique(bundle_id, inbound_event_id)`
- indice por `bundle_id, sort_order`

Uso:

- preservar ordem das mensagens no bundle
- registrar inclusao no bundle de forma auditavel

## 6.9 Snapshots de exportacao para I.A.

Tabela recomendada:

`whatsapp_bundle_markdown_exports`

Campos:

- `id`
- `bundle_id`
- `bundle_lock_version`
- `markdown_text`
- `markdown_hash`
- `signed_token`
- `expires_at`
- `created_by`
- `created_at`

Motivo:

- a I.A. deve ler um snapshot estavel
- o bundle nao deve ser resolvido ao vivo em toda chamada externa
- isso melhora rastreabilidade editorial

## 6.10 Rastreamento de origem no `news_item`

Tabela recomendada:

`news_item_whatsapp_origins`

Campos:

- `id`
- `news_item_id`
- `bundle_id`
- `inbound_event_id`
- `created_at`

Motivo:

- auditoria editorial
- rastreio fino de origem
- debugging
- eventual UI de "esta noticia veio destas mensagens"

## 6.11 Snapshot de promocao do bundle

Tabela recomendada:

`whatsapp_bundle_promotion_snapshots`

Campos:

- `id`
- `bundle_id`
- `news_item_id`
- `bundle_lock_version`
- `snapshot_json`
- `created_by`
- `created_at`

Motivo:

- a noticia publicada pode divergir do estado atual do bundle depois de novas edicoes
- a promocao precisa ter rastreabilidade propria, assim como a exportacao para I.A.

Conteudo minimo recomendado em `snapshot_json`:

- dados editoriais do bundle
- lista ordenada dos eventos promovidos
- dados essenciais das midias relacionadas
- `bundle_lock_version`
- usuario que promoveu
- fallbacks editoriais usados na promocao

## 7. Regras de dominio

## 7.1 O que entra no sistema

No V1, ingerir com prioridade:

- texto
- imagem
- video
- documento
- link compartilhado

No V1, registrar mas nao priorizar:

- audio
- location
- contact
- sticker

### Politica de audio e documento no V1

- audio entra sem transcricao no V1
- documento entra com metadados, download e preview basico quando possivel
- OCR de imagem fica fora do escopo inicial
- transcricao de audio fica fora do escopo inicial

## 7.2 Contrato minimo de normalizacao do webhook Z-API

Para mensagens de grupo recebidas da Z-API:

- `phone` deve ser tratado como identificador bruto do grupo no provider
- `participantPhone` representa o remetente da mensagem dentro do grupo
- `senderName` e `senderPhoto` representam a identidade de apresentacao do remetente naquele momento
- `chatName` representa o nome atual do grupo no momento do recebimento

Mapeamento canonico recomendado:

- `provider = 'zapi'`
- `instance_id = instanceId`
- `message_id = messageId`
- `group_id_raw = phone`
- `chat_name = chatName`
- `is_group = isGroup`
- `is_newsletter = isNewsletter`
- `from_me = fromMe`
- `status = status`
- `participant_phone = participantPhone`
- `participant_lid = participantLid`
- `sender_name = senderName`
- `sender_photo = senderPhoto`
- `sent_at = momment`
- `received_at = now()`

Regra pratica:

- grupo = `phone`
- autor da mensagem no grupo = `participantPhone`
- identidade de apresentacao do autor = `senderName + senderPhoto`

Invariante adicional:

- um `whatsapp_inbound_event` representa sempre uma unica mensagem do provider
- o sistema nao deve fundir dois eventos em um unico evento canonico
- agrupamento editorial so acontece no `bundle`

### Quirks e limites do provider

- `chatName` pode mudar ao longo do tempo e nao deve ser chave de nada
- `senderName` pode mudar e deve ser tratado como snapshot de exibicao
- `senderPhoto` pode mudar ou expirar
- `momment` vem em milissegundos e deve ser normalizado com cuidado
- mensagens podem chegar fora de ordem
- webhooks podem repetir o mesmo evento
- a URL de midia pode expirar antes do worker baixar

### Garantias assumidas do provider

- `messageId` e estavel por mensagem dentro da instancia
- `phone` e o identificador bruto do grupo
- `participantPhone` pode ser nulo em alguns cenarios e o sistema deve tolerar isso
- `image.caption` pode ser vazio

## 7.3 Deduplicacao

Chave canonica:

- `provider`
- `instance_id`
- `message_id`

Regra:

- mesmo trio nao cria novo evento
- novo webhook para o mesmo trio atualiza o registro
- receipts continuam existindo para auditoria e replay

## 7.4 Ordenacao temporal da timeline

Regra de persistencia e exibicao:

- a persistencia tecnica considera o momento real de chegada em `received_at`
- a ordenacao editorial primaria da timeline e por `sent_at`
- em empate, desempatar por `id`
- uma mensagem atrasada pode ser inserida retroativamente no bloco temporal correto

Implicacao para frontend:

- a timeline nao deve ser tratada como estrutura imutavel
- o cliente deve suportar reordenacao local quando uma mensagem antiga chegar depois

## 7.5 Estados de processamento

Para `whatsapp_webhook_receipts.processing_status`:

- `received`
- `dispatched`
- `normalized`
- `failed`

Para `whatsapp_inbound_events.processing_status`:

- `received`
- `normalized`
- `group_resolved`
- `media_pending`
- `ready`
- `ignored`
- `failed`

Para `whatsapp_inbound_events.ignored_reason`:

- `group_not_enabled`
- `not_group_message`
- `from_me`
- `unsupported_kind`
- `duplicate`
- `manual_ignore`
- `noise`
- `newsletter_not_allowed`

Para `whatsapp_inbound_event_media.download_status`:

- `pending`
- `downloaded`
- `failed`
- `expired`
- `skipped`

Semantica de `whatsapp_inbound_events.download_status`:

- este campo deve ser tratado como resumo derivado do conjunto de midias do evento
- `pending` se alguma midia estiver pendente
- `failed` se nenhuma estiver pendente, mas alguma falhou
- `downloaded` se todas as midias relevantes baixaram
- `skipped` se nao havia midia relevante

### Estado editorial derivado para UI

Mesmo que seja calculado e nao persistido, a UI deve poder trabalhar com um estado editorial derivado por mensagem:

- `new`
- `reviewed`
- `ignored`
- `bundled`
- `promoted`

## 7.6 Resposta encadeada e contexto

Persistir:

- `reference_message_id`
- `reply_to_message_id`
- `reply_to_inbound_event_id`

Uso:

- mostrar snippet da mensagem respondida
- melhorar heuristica de agrupamento
- reduzir perda de contexto em grupos de imprensa
- se a mensagem referenciada ainda nao existir localmente, persistir o evento mesmo assim e tentar vinculo posterior

## 7.7 Imagem com legenda deve virar texto editorial

Para mensagens de imagem:

- `message_kind = image`
- `text_message = image.caption`
- a midia vai para `whatsapp_inbound_event_media`

Motivo:

- a legenda costuma ser a parte editorial mais importante do release
- o operador precisa conseguir buscar por esse texto
- a I.A. precisa ler esse texto sem depender do binario
- o bundle precisa consolidar isso facilmente

## 7.8 Edicao de mensagem

Se `isEdit = true`:

1. localizar evento pelo trio `provider, instance_id, message_id`
2. atualizar o evento principal
3. criar revisao em `whatsapp_inbound_event_revisions`
4. atualizar `edited_at`
5. se o evento estiver em bundle, marcar `has_updated_source_messages = true`

Motivo:

- bundle pode ja estar montado
- IA pode ter sido usada com a versao anterior
- auditoria precisa da trilha da alteracao

### Mensagem removida, retratada ou invalida

Se o provider sinalizar remocao, retratacao ou erro relevante:

- nao apagar do banco
- marcar o evento com `is_deleted = true` quando aplicavel
- preencher `deleted_at`, `provider_error_code` e `provider_error_message` quando houver
- manter a mensagem em bundles historicos
- exibir badge como `mensagem removida na origem`

Se a midia estiver inacessivel:

- manter o evento visivel
- manter rastreio tecnico do erro
- nao perder o texto, legenda ou metadados associados

## 7.9 Download de midia

Nao confiar na URL da Z-API como fonte permanente.

Regra:

- baixar midia relevante para storage proprio privado
- manter `source_url` externa apenas como referencia temporaria
- se o download falhar, o evento continua visivel na timeline
- o operador deve ver badge explicito como `anexo indisponivel`

Comportamento operacional:

- mensagem textual entra imediatamente
- evento com midia pode nascer em `media_pending`
- worker tenta baixar
- se concluir, evento vai para `ready`
- se falhar, evento pode continuar em `ready` com `download_status = failed`

## 7.10 Sugestao de agrupamento

O sistema pode sugerir agrupamentos, mas nao deve promover automaticamente.

Heuristicas simples recomendadas para o V1:

- destacar mensagens proximas no tempo do mesmo remetente
- sugerir inclusao de replies encadeadas
- sugerir combinar imagem + legenda + link

Campos de apoio opcionais:

- `news_signal_score`
- `relevance_score`
- `suggested_bundle_key`
- `detected_city`
- `detected_category`
- `has_external_link`
- `contains_release_pattern`

Regra do V1:

- o usuario fecha o agrupamento manualmente
- o V1 nao deve depender de score sofisticado para ser util
- esses campos podem ficar fora da primeira migration se o time quiser reduzir escopo

## 7.11 Concorrencia de bundle

Bundles precisam de controle de concorrencia.

Recomendacao:

- usar `lock_version`
- atualizar `last_opened_by` e `last_opened_at`
- usar optimistic locking em update, reorder, capa, promote e archive

Regra:

- se o cliente enviar `lock_version` desatualizado, backend retorna conflito
- promocao nao deve ocorrer sobre bundle desatualizado

Metadado derivado recomendado para a UI:

- `bundle_usage_state` com valores como:
  - `unused`
  - `used_in_open_bundle`
  - `used_in_promoted_bundle`
  - `used_in_multiple_bundles`

## 7.12 Promocao para News Radar

A promocao nao deve ficar espalhada em controller.

Criar servico dedicado:

- `PromoteWhatsAppBundleToNewsItemAction`

Responsabilidades:

- validar status do bundle
- validar `lock_version`
- consolidar markdown
- resolver ou criar `news_source`
- copiar midia principal
- definir qual texto do bundle vira `excerpt`
- definir fallback se nao houver titulo manual
- definir fallback se nao houver capa
- preencher campos do `news_item`
- gerar `public_token`
- registrar auditoria
- marcar `promoted_news_item_id`
- garantir idempotencia

Regra de idempotencia:

- bundle promovido nao pode gerar novo `news_item` por acidente
- chamadas repetidas de promocao para bundle ja promovido devem retornar referencia ao `news_item` existente

Politica objetiva de fallback editorial:

Titulo:

1. `bundle.title`
2. `headline_draft`
3. primeira mensagem textual relevante do bundle
4. fallback generico baseado em grupo + data

Excerpt:

1. `summary`
2. `lead_draft`
3. concatenacao limpa das primeiras mensagens relevantes

Capa:

1. `cover_media_id`
2. primeira imagem valida do bundle
3. sem capa

Audit trail recomendado:

- ignorar mensagem
- designorar mensagem
- marcar estrela
- remover item de bundle
- trocar capa
- reordenar bundle
- reabrir bundle
- promover bundle

Diretriz:

- preferir integracao com `Spatie Activity Log` ou trilha equivalente do sistema

## 7.13 Relacao com `news_sources`

O News Radar ja suporta `source_type = whatsapp`.

Recomendacao:

- nao criar `news_source` para todo grupo no momento em que o grupo e habilitado
- criar `news_source` sob demanda, na primeira promocao

No grupo canonico:

- `news_source_id` nullable
- opcionalmente `is_news_source_enabled`

Observacao:

- evitar `homepage_url` fake com dominio publico inventado
- preferir `homepage_url` nullable ou referencia interna sintetica

## 8. API recomendada

## 8.1 Grupos do usuario

- `GET /api/v1/news-radar/whatsapp/groups`
- `GET /api/v1/news-radar/whatsapp/groups/{groupFk}/summary`
- `POST /api/v1/news-radar/whatsapp/groups/{groupFk}/mark-as-read`
- `PUT /api/v1/news-radar/whatsapp/groups/preferences`

Payload de preferencias:

```json
{
  "items": [
    {
      "whatsapp_group_fk": "01HR...",
      "is_active": true,
      "sort_order": 1,
      "label_override": "PRF SC"
    }
  ]
}
```

Semantica de `mark-as-read`:

- o endpoint deve aceitar do cliente o maior evento efetivamente visto para aquele grupo e usuario
- recomendacao de payload:

```json
{
  "last_seen_event_id": 1234
}
```

- o backend deve persistir `last_seen_event_id` e o `last_seen_event_at` correspondente
- abrir a timeline depois deve reposicionar o usuario perto desse ponto

## 8.2 Timeline por grupo como modo principal

- `GET /api/v1/news-radar/whatsapp/groups/{groupFk}/timeline`
- `GET /api/v1/news-radar/whatsapp/events/{id}`
- `GET /api/v1/news-radar/whatsapp/events/{id}/context`
- `GET /api/v1/news-radar/whatsapp/events/{id}/thread`
- `POST /api/v1/news-radar/whatsapp/events/{id}/ignore`
- `POST /api/v1/news-radar/whatsapp/events/{id}/unignore`
- `POST /api/v1/news-radar/whatsapp/events/{id}/star`
- `POST /api/v1/news-radar/whatsapp/events/{id}/unstar`
- `POST /api/v1/news-radar/whatsapp/events/{id}/mark-reviewed`
- `POST /api/v1/news-radar/whatsapp/events/bulk-add-to-bundle`
- `POST /api/v1/news-radar/whatsapp/events/bulk-ignore`
- `POST /api/v1/news-radar/whatsapp/events/bulk-unignore`
- `POST /api/v1/news-radar/whatsapp/events/bulk-star`
- `POST /api/v1/news-radar/whatsapp/events/bulk-unstar`
- `POST /api/v1/news-radar/whatsapp/events/bulk-mark-reviewed`

Filtros recomendados:

- `cursor`
- `window`
- `from`
- `to`
- `message_kind`
- `search`
- `only_unbundled`
- `include_ignored`

Paginacao recomendada:

- cursor pagination
- ordenacao `sent_at desc, id desc`

Resposta recomendada:

- devolver mensagens do grupo em ordem cronologica de operacao
- devolver metadados derivados como `bundle_usage_state`
- devolver informacoes para reposicionamento perto do ultimo ponto visto
- a lista visual do frontend deve apresentar a mensagem mais recente no topo, em ordem `sent_at desc, id desc`

Semantica operacional:

- `ignore`, `unignore`, `star`, `unstar` e `mark-reviewed` devem atuar em `user_whatsapp_event_states`
- essas acoes nao podem alterar o evento global para outros usuarios

## 8.3 Inbox global opcional

- `GET /api/v1/news-radar/whatsapp/events`

Filtros recomendados:

- `group_fk`
- `message_kind`
- `from`
- `to`
- `bundle_status`
- `only_unbundled`
- `search`
- `processing_status`
- `ignored_reason`

Paginacao recomendada:

- cursor pagination
- ordenacao `sent_at desc, id desc`

Observacao:

- a inbox global e secundaria no produto
- o modo principal continua sendo timeline por grupo

## 8.4 Bundles

- `GET /api/v1/news-radar/whatsapp/bundles`
- `POST /api/v1/news-radar/whatsapp/bundles`
- `GET /api/v1/news-radar/whatsapp/bundles/{id}`
- `PUT /api/v1/news-radar/whatsapp/bundles/{id}`
- `POST /api/v1/news-radar/whatsapp/bundles/{id}/items`
- `DELETE /api/v1/news-radar/whatsapp/bundles/{id}/items/{eventId}`
- `PUT /api/v1/news-radar/whatsapp/bundles/{id}/star`
- `POST /api/v1/news-radar/whatsapp/bundles/{id}/archive`
- `POST /api/v1/news-radar/whatsapp/bundles/{id}/reopen`
- `POST /api/v1/news-radar/whatsapp/bundles/{id}/duplicate`
- `POST /api/v1/news-radar/whatsapp/bundles/{id}/promote`

Criacao de bundle:

```json
{
  "group_fk": "01HR...",
  "title": "Acidente na BR-101 em Palhoca",
  "event_ids": [101, 102, 103, 104],
  "lock_version": 1
}
```

## 8.5 Exportacao para I.A.

Endpoints recomendados:

- `GET /api/v1/news-radar/whatsapp/bundles/{id}/markdown-preview`
- `POST /api/v1/news-radar/whatsapp/bundles/{id}/markdown-export`
- `GET /api/v1/public/news-radar/whatsapp/markdown-exports/{token}`

Contrato minimo recomendado para `markdown-export`:

```json
{
  "lock_version": 3
}
```

Decisao recomendada:

- preview autenticado no painel
- export gera snapshot persistido
- resposta retorna link assinado e expirado para aquele snapshot
- a leitura externa do snapshot ocorre pela rota publica assinada por `token`
- o export deve validar `lock_version` para impedir snapshot sobre bundle desatualizado

## 8.6 Busca e indexacao

A timeline e a inbox devem permitir busca por:

- texto da mensagem
- legenda de imagem
- nome do remetente
- telefone do participante
- nome do grupo
- URL detectada

Diretriz tecnica:

- no stack atual MariaDB ou MySQL, priorizar indices por `participant_phone`, `whatsapp_group_fk`, `sent_at` e avaliar `FULLTEXT` para `text_message`
- se houver migracao futura para Postgres, considerar `full text search` dedicado e trigram para `sender_name` e `chat_name`

## 8.7 Escopo da primeira migration

Campos que podem ficar fora da primeira migration, se o time quiser reduzir escopo inicial:

- `forwarded_score`
- `news_signal_score`
- `relevance_score`
- `detected_city`
- `detected_category`
- `contains_release_pattern`
- `participant_display_name`
- `sender_snapshot_json`

Regra:

- esses campos sao uteis para heuristica e refinamento editorial
- nao sao pre-requisito para o V1 funcional baseado em timeline, selecao manual, bundle e promocao

## 9. Fluxo operacional recomendado

## 9.1 Ingestao

1. webhook recebe mensagem
2. receipt bruto e salvo
3. job de normalizacao processa o payload
4. evento canonico e salvo ou atualizado
5. grupo e resolvido em `whatsapp_groups` a partir de `phone`
6. se grupo nao estiver habilitado para ingest editorial:
   - marcar `ignored_reason = group_not_enabled`
7. se houver midia:
   - criar registros em `whatsapp_inbound_event_media`
   - baixar assincronamente para storage privado
8. evento entra na timeline do grupo mesmo se a midia ainda estiver pendente

## 9.2 Operacao do usuario

1. usuario abre `/raspagem/feed`
2. escolhe aba `WhatsApp`
3. escolhe um grupo monitorado na coluna lateral
4. ve a timeline cronologica daquele grupo
5. marca uma ou varias mensagens relacionadas
6. cria bundle manualmente ou adiciona a bundle existente
7. abre bundle em drawer lateral
8. reordena mensagens, escolhe capa e ajusta resumo
9. envia bundle para I.A. ou promove para feed

## 9.3 Promocao para News Radar

Ao promover um bundle:

1. bundle passa por validacao de status e versao
2. sistema resolve ou cria `news_source` sob demanda
3. sistema cria snapshot consolidado do bundle
4. sistema define fallback editorial para titulo, excerpt e capa
5. sistema cria `news_item`
6. sistema registra rastreio em `news_item_whatsapp_origins`
7. sistema registra `whatsapp_bundle_promotion_snapshots`
8. `news_source_id` aponta para o grupo WhatsApp correspondente
9. `public_token` e gerado normalmente
10. `promoted_news_item_id` e salvo no bundle
11. item promovido passa a aparecer na aba `Web`

## 10. Integracao com Prompt Templates de I.A.

## 10.1 Reaproveitamento do modulo atual

O modulo atual de prompts ja existe:

- `apps/web/src/features/ai-prompts/`

Hoje ele assume `NewsItem`.

Para o novo fluxo, transformar o contexto de compilacao em union type:

```ts
type PromptCompileContext =
  | { kind: "news-item"; newsItem: NewsItem }
  | { kind: "whatsapp-bundle"; bundle: WhatsAppNewsBundle }
```

## 10.2 Variaveis recomendadas

No V1, manter as variaveis existentes e mapear bundle para elas quando possivel:

- `{{md_url}}` -> link assinado do snapshot de markdown do bundle
- `{{item_title}}` -> titulo manual do bundle ou titulo sugerido
- `{{item_source}}` -> nome do grupo
- `{{item_date}}` -> data ou hora da primeira mensagem do bundle
- `{{item_excerpt}}` -> resumo do bundle
- `{{item_city}}` -> cidade manual do bundle ou vazia
- `{{item_urgency}}` -> urgencia manual do bundle ou vazia
- `{{item_category}}` -> categoria manual do bundle ou vazia
- `{{item_categories}}` -> categorias manuais do bundle ou vazias
- `{{item_original_url}}` -> primeiro link detectado, se houver

## 10.3 Exportacao de markdown

Nao gerar markdown externo sempre ao vivo.

Regra:

- ao acionar exportacao para I.A., gerar snapshot textual
- persistir `markdown_hash` e `bundle_lock_version`
- expor apenas link assinado e expirado para aquele snapshot

Motivo:

- rastreabilidade editorial
- reproducao da versao enviada para a I.A.
- isolamento entre edicao posterior do bundle e leitura externa

## 11. Frontend recomendado

## 11.1 Navegacao

Manter a rota:

- `/raspagem/feed`

Adicionar tabs internas:

- `Web`
- `WhatsApp`

Motivo:

- atende a ideia do produto de unificar tudo em um lugar
- evita fragmentar o radar operacional

## 11.2 Estrutura sugerida

Criar feature nova:

- `apps/web/src/features/news-radar-whatsapp/`

Estrutura:

```txt
features/news-radar-whatsapp/
|- api/
|- components/
|- hooks/
|- types/
|- utils/
```

## 11.3 Componentes recomendados

- `WhatsAppFeedTab.tsx`
- `WhatsAppFeedHeader.tsx`
- `WhatsAppGroupSidebar.tsx`
- `WhatsAppGroupTimeline.tsx`
- `WhatsAppTimelineMessageRow.tsx`
- `WhatsAppSelectionBar.tsx`
- `WhatsAppBundleDrawer.tsx`
- `WhatsAppBundlePreview.tsx`

## 11.4 UX do tab WhatsApp

Layout recomendado:

1. coluna esquerda com grupos monitorados
2. painel central com timeline cronologica do grupo selecionado
3. checkbox por mensagem
4. barra inferior fixa quando houver selecao
5. drawer lateral para preview e edicao do bundle

Coluna esquerda:

- nome do grupo
- quantidade de nao lidas
- contagem de mensagens novas
- ultima mensagem
- favorito ou ativo
- acao de marcar grupo como lido

Painel central:

- avatar e nome do remetente
- horario
- texto
- preview de imagem, documento ou link
- indicacao visual se a mensagem ja foi usada em bundle
- indicador de mensagem removida ou alterada na origem

Barra de acao:

- `Criar agrupamento editorial`
- `Destacar`
- `Ignorar`
- `Marcar como revisada`

Dentro do bundle:

- editar titulo
- reordenar mensagens
- escolher imagem principal
- acionar `Gerar o Prompt de I.A.`
- promover para feed

## 11.5 Melhorias de UX recomendadas

- selecao persistente por grupo e filtro
- preview lateral em vez de modal em cascata
- atalhos de teclado:
  - `I` ignorar
  - `B` criar bundle
  - `A` adicionar ao bundle
  - `S` marcar estrela
- virtualizacao de lista para alto volume
- agrupamento visual por janela temporal dentro da timeline
- janelas temporais explicitas:
  - hoje
  - ultimas 24h
  - ultimos 3 dias
  - intervalo customizado
- abrir timeline perto do ultimo ponto visto quando houver `last_seen_event_at`
- carregar blocos em ordem decrescente no backend e renderizar dentro do bloco na ordem mais legivel para o operador

## 11.6 Reaproveitamento visual

Reaproveitar do feed atual:

- `AppShell`
- empty states
- badges
- dialog patterns
- composer de I.A.

Nao reaproveitar diretamente:

- `FeedCard`
- `FeedInfiniteList`

Motivo:

- a unidade visual de WhatsApp nao e noticia pronta
- e timeline de mensagens do grupo

### 11.7 Linguagem de interface recomendada

No backend e na especificacao tecnica, `bundle` pode continuar como nome de entidade interna.

Na interface do usuario, preferir linguagem em portugues e orientada a operacao:

- `agrupamento editorial`
- `abrir agrupamento`
- `criar agrupamento editorial`
- `agrupamentos editoriais do grupo`
- `gerar o prompt de I.A.`

Evitar expor o termo `bundle` na UI final.

## 12. Seguranca, retencao e conformidade

## 12.1 Politica de storage

- storage privado obrigatorio para anexos
- nao expor URL da Z-API como ativo permanente
- signed URLs curtas para preview externo

## 12.2 Retencao recomendada

No V1, definir ao menos a politica conceitual:

- receipts brutos: 30 a 90 dias
- eventos e timelines nao promovidos: conforme necessidade operacional
- midia ignorada ou expirada: purge automatico quando possivel
- bundles arquivados: politica propria alinhada ao uso editorial

## 12.3 Dados sensiveis

O sistema pode ingerir:

- nome de remetente
- telefone
- foto
- documentos
- midia de grupo
- possivel conteudo sensivel

Recomendacoes:

- storage privado
- controle de acesso por permissao
- trilha de auditoria para exportacao assinada
- criptografia em repouso quando aplicavel
- evitar exposicao publica permanente de conteudo

## 13. Observabilidade e operacao

## 13.1 Metricas recomendadas

Recebimento:

- total de webhooks por instancia
- taxa de receipts falhos
- taxa de duplicados

Normalizacao:

- falhas por tipo de payload
- tipos de mensagem mais recebidos
- eventos ignorados por motivo

Midia:

- downloads pendentes
- falhas por MIME
- tempo medio de download
- taxa de expiracao da URL externa antes do fetch

Editorial:

- bundles criados por usuario
- media de mensagens por bundle
- bundles promovidos
- bundles arquivados sem promocao
- grupos mais ativos por periodo
- mensagens com legenda de imagem mais reutilizadas
- tempo medio entre mensagem recebida e inclusao em bundle
- tempo medio entre criacao do bundle e promocao
- taxa de bundles criados por grupo
- taxa de bundles sem promocao por grupo
- distribuicao de noticias promovidas por quantidade de mensagens de origem
- taxa de reaproveitamento de mensagens ja usadas
- grupos com maior conversao em noticia publicada

I.A.:

- snapshots de markdown gerados
- links assinados emitidos
- uso do composer a partir de bundles

## 13.2 Filas e retries

Recomendacao:

- fila dedicada para inbound
- fila dedicada para download de midia
- retries controlados
- dead-letter queue para falhas persistentes

## 13.3 Replay e troubleshooting

Como existe `whatsapp_webhook_receipts`, o sistema deve permitir:

- replay de receipt especifico
- reprocessamento por faixa de tempo
- reprocessamento por versao de normalizador

## 14. Permissoes recomendadas

Backend e frontend devem ter permissao dedicada:

- `news_radar_whatsapp.view`
- `news_radar_whatsapp.bundle`
- `news_radar_whatsapp.promote`
- `news_radar_whatsapp.manage_groups`

## 15. Nao objetivos do V1

- nao fazer agrupamento automatico completo
- nao fazer OCR de imagem no V1
- nao fazer transcricao de audio no V1
- nao suportar multiplos providers no V1, apenas preparar o contrato
- nao fazer publicacao automatica sem operador
- nao suportar conversas 1:1 fora do contrato de `group_id` do provider

## 16. Contratos invariantes e casos de borda

Contratos invariantes:

- bundle nunca nasce sem grupo
- evento nunca pertence a mais de um grupo
- evento canonico sempre representa uma unica mensagem do provider
- promocao nunca cria mais de um `news_item` por bundle
- reply quebrado nao impede persistencia do evento
- falha de midia nao impede exibicao da mensagem
- mensagem removida na origem nao some do historico editorial

Casos de borda obrigatorios de teste:

- imagem sem legenda
- texto puro
- imagem + legenda + link
- mensagem editada ja usada em bundle
- mensagem removida ou retratada
- reply para mensagem ainda nao ingerida
- duplicidade de webhook
- midia expirada antes do download
- grupo desabilitado
- promocao com `lock_version` vencido

## 17. Fases de implementacao

## Fase 0 - Contratos e endurecimento de dominio

- fechar enums
- fechar indices unicos
- definir receipt bruto
- definir politica de storage
- definir retencao
- definir auditoria
- definir estrategia de replay
- definir concorrencia do bundle
- definir estados do pipeline
- congelar contrato do payload Z-API para grupos
- definir invariantes e nao objetivos do V1
- decidir escopo tenant, se aplicavel

## Fase 1 - Base de ingestao

- criar modulo `WhatsAppInbound`
- criar tabela de receipts
- criar tabela de eventos normalizados
- criar tabela de revisoes
- criar tabela de midia
- criar tabela `user_whatsapp_event_states`
- criar webhook generico
- persistir payload bruto
- deduplicar por chave composta
- resolver grupo por `phone`
- tratar remocao, retratacao e reply quebrado
- fechar semantica agregada de `download_status`

## Fase 2 - Timeline operacional por grupo

- listar timeline por grupo
- filtros
- ignore manual
- unignore e star
- reviewed por usuario
- contexto por reply
- resumo do grupo e mark-as-read
- download e preview de anexos
- tab no frontend

## Fase 3 - Bundles

- CRUD de bundle
- selecao em massa
- adicionar e remover mensagens
- duplicate e reopen
- reorder interno
- capa
- estrela
- arquivamento
- optimistic locking

## Fase 4 - Integracao com I.A.

- markdown preview do bundle
- snapshot de exportacao
- link assinado para I.A.
- estender `compilePrompt` para bundle
- abrir bundle no composer atual

## Fase 5 - Promocao para News Radar

- criacao lazy de `news_source`
- promover bundle para `news_item`
- registrar `news_item_whatsapp_origins`
- registrar snapshot de promocao
- registrar audit trail operacional
- vincular `promoted_news_item_id`
- exibir item promovido na aba Web

## 18. Riscos e cuidados

1. Nao usar URL da Z-API como ativo permanente.
2. Nao jogar webhook de grupo direto em `news_items`.
3. Nao acoplar o novo fluxo ao controller de galeria.
4. Nao usar config estatica como fonte principal de grupos monitorados.
5. Nao expor markdown de bundle por URL publica permanente.
6. Nao assumir que uma mensagem = uma noticia.
7. Nao ignorar concorrencia em bundle.
8. Nao perder historico de edicoes.

## 19. Recomendacao final

O caminho mais seguro e reutilizavel e este:

1. criar `Modules/WhatsAppInbound` como infraestrutura transversal
2. manter `Modules/WhatsApp` como camada de provider, grupos e sync
3. criar `Modules/NewsRadarWhatsApp` como timeline editorial
4. usar bundle como entidade central
5. gerar snapshot assinado para exportacao de markdown
6. promover bundle para `news_item` apenas via servico transacional dedicado
7. reaproveitar o modulo de Prompt Templates com contexto novo de bundle

Se o time seguir essa linha, o projeto ganha:

- timeline operacional por grupo
- zero perda de contexto por mensagem fracionada
- agrupamento manual sem gambiarra
- reuso do composer de I.A.
- trilha de auditoria e replay
- caminho limpo para promover bundle para noticia do radar
