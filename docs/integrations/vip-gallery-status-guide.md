# VIP Gallery Status Guide

Data: 2026-03-08  
Objetivo: registrar o estado exato da Cobertura VIP no repositorio, congelar o contrato tecnico atual e deixar claro o que ja foi entregue, o que ainda falta e quais sao os proximos passos recomendados.

## 1) Resumo executivo

Hoje a Cobertura VIP ja possui base backend funcional e operacao inicial fechada para:

- receber webhook da Z-API
- identificar evento VIP ativo por `whatsapp_group_id`
- baixar imagem com validacao
- salvar original no disk `public`
- publicar o original imediatamente
- processar a imagem com GD nativo
- salvar a imagem processada no disk `public`
- atualizar `processed_image_path`
- expor detalhe e fotos da galeria por API publica
- contar views e downloads com deduplicacao
- apagar foto por comando do WhatsApp via reply com `referenceMessageId`
- reprocessar foto com falha por rota administrativa autenticada
- cadastrar/configurar os campos VIP no formulario de `Externas`

Hoje a feature ainda nao esta pronta para producao final porque ainda faltam:

- CRUD/admin operacional de banners
- upload administrativo de logo customizada
- cleanup automatizado de orfaos e retencao
- backfill de eventos antigos
- integracao real do app `gallery/` com a API
- UX final para estados `draft`, `paused` e `archived` no frontend publico
- hardening com payloads reais da Z-API e storage real

## 2) Contrato tecnico congelado

## 2.1 Storage oficial

Decisao congelada:

- a implementacao oficial atual usa apenas `Storage::disk('public')`
- local e producao seguem a mesma estrategia
- a arquitetura pode ser abstraida no futuro, mas isso nao esta ativo agora
- toda URL publica de midia deve ser montada via `Storage::disk('public')->url(...)`
- a montagem dessas URLs foi centralizada no `VipGalleryMediaManager`

Requisito operacional:

- e obrigatorio executar `php artisan storage:link`

Consequencia pratica:

- as imagens processadas/originais e banners sao servidos pelo disk `public`
- a API nunca devolve URL original da Z-API

## 2.2 Pipeline oficial de imagem

Fluxo oficial atual:

1. receber imagem
2. baixar a imagem
3. validar tamanho, mime type e integridade basica
4. corrigir orientacao JPEG por EXIF quando disponivel
5. salvar original em `public`
6. publicar o original imediatamente
7. processar a imagem com GD nativo
8. salvar a processada em `public`
9. atualizar `processed_image_path`
10. trocar a exibicao publica de forma silenciosa de original para processada

Comportamento visual esperado:

- a troca original -> processed nao muda a ordem da foto
- a troca nao deve quebrar scroll no frontend
- `image_url` sempre aponta para a melhor versao publica disponivel

## 2.3 Contrato oficial de GD nativo

Pipeline documentado e implementado com GD:

- `getimagesizefromstring` para validacao basica da imagem recebida
- `imagecreatefromstring` para abrir a imagem
- `imagecopyresampled` para redimensionar a logo
- `imagejpeg` para gerar a imagem processada final

Detalhes congelados:

- a imagem processada final atual e salva como JPEG
- a logo oficial suportada pelo pipeline atual e PNG com transparencia
- transparencias da logo sao preservadas com `imagealphablending` + `imagesavealpha`
- orientacao EXIF e tratada em JPEG quando a extensao EXIF estiver disponivel

## 2.4 Contrato visual da logo

Direcao oficial atual:

- posicao: canto inferior direito
- margem direita: `24px`
- margem inferior: `24px`
- tamanho padrao: `15%` da largura da imagem
- limite minimo backend: `5%`
- limite maximo backend: `30%`
- se a logo exceder o espaco permitido, ela e reduzida proporcionalmente
- a proporcao original da logo e preservada
- a transparencia da logo PNG e preservada

Fallback oficial atual:

- se nao houver `custom_logo_path` valido, a imagem ainda e processada e salva sem overlay
- nao existe ainda upload administrativo de logo; hoje o campo no painel recebe path manual

## 2.5 Status oficiais do fluxo

Contrato congelado:

- `received`
- `published_original`
- `processed`
- `failed`
- `deleted`

Decisao importante:

- `downloaded` saiu do contrato atual e nao deve mais ser tratado como status ativo da feature

Campos de erro formais:

- `processing_error`
- `processing_attempts`
- `last_processing_attempt_at`

## 2.6 Limites operacionais congelados

Limites atuais:

- timeout de download: `30s`
- tamanho maximo do arquivo: `15 MB`
- mime types aceitos: `image/jpeg`, `image/png`, `image/webp`

Protecoes atuais:

- rejeicao de arquivo vazio
- rejeicao de imagem invalida/corrompida antes do processamento
- rejeicao de mime type nao suportado

## 2.7 Regra de cleanup atual

Hoje ja existe cleanup imediato para o caso de delete command:

- soft delete da foto
- remocao fisica do arquivo original
- remocao fisica do arquivo processado

O que ainda nao existe:

- rotina automatica para arquivos orfaos antigos
- scheduler/command de limpeza recorrente
- politica automatizada de retencao para logs

## 2.8 Comportamento do webhook

Contrato atual:

- endpoint: `POST /api/v1/webhook/zapi/gallery`
- secret por header
- quando o secret esta correto, o webhook responde `202 Accepted`
- payloads validos mas ignorados sao tratados assincronamente via job

Objetivo dessa decisao:

- simplificar a integracao com a Z-API
- evitar acoplamento do tempo de resposta ao processamento interno

## 3) O que esta implementado agora

## 3.1 Banco e dominio

Ja existe:

- expansao de `external_events` com os campos VIP
- tabela `vip_gallery_photos`
- tabela `vip_gallery_banners`
- tabela `vip_gallery_webhook_logs`
- relacoes de galeria VIP no model `ExternalEvent`
- validacoes backend para configuracao VIP em `Externas`

Campos VIP ativos em `external_events`:

- `is_vip_gallery`
- `vip_gallery_status`
- `whatsapp_group_id`
- `gallery_slug`
- `custom_logo_path`
- `logo_size_percent`
- `views_count`
- `allow_delete_command`
- `delete_command_keyword`

## 3.2 Pipeline backend do modulo `VipGallery`

Implementado:

- controller de webhook
- parser resiliente do payload Z-API
- resolucao de evento por grupo
- download da imagem original
- validacao de mime/tamanho
- correcao EXIF JPEG best effort
- processamento GD nativo
- publicacao do original
- publicacao da processada
- URLs publicas centralizadas no `VipGalleryMediaManager`

Status real do processamento:

- foto chega em `received`
- ao salvar/publicar o original vira `published_original`
- quando o processamento termina vira `processed`
- se falhar sem original publicado fica `failed`
- se for removida por comando vira `deleted`

## 3.3 Delete command via WhatsApp

Implementado agora:

- payload de texto e reconhecido como comando
- comparacao com `delete_command_keyword`
- uso de `referenceMessageId` para encontrar a foto alvo
- soft delete da foto
- remocao fisica do original/processado
- log do fluxo em `vip_gallery_webhook_logs`

Comportamento atual:

- se o evento nao permitir delete command, o webhook e ignorado com status de roteamento apropriado
- se a foto alvo nao existir, o log registra isso
- se a foto ja tiver sido apagada, o log registra isso

Nao foi implementado ainda:

- apagar a mensagem no grupo para todos via chamada adicional da Z-API

## 3.4 Reprocessamento administrativo

Implementado agora:

- rota autenticada: `POST /api/v1/vip-gallery/photos/{photo}/reprocess`
- uso do mesmo `VipGalleryMediaManager`
- incremento de `processing_attempts`
- atualizacao de `last_processing_attempt_at`
- enfileiramento do job de processamento

Restricao atual:

- somente fotos com status `failed` podem ser reprocessadas por essa rota

## 3.5 API publica atual

Rotas publicas existentes:

- `GET /api/v1/gallery/{identifier}`
- `GET /api/v1/gallery/{identifier}/photos`
- `POST /api/v1/gallery/track/view`
- `POST /api/v1/gallery/photos/{photo}/download`

### `GET /api/v1/gallery/{identifier}`

Contrato atual:

- `id`
- `slug`
- `status`
- `isActive`
- `is_active`
- `accepting_photos`
- `public_url`
- `hasBanners`
- `has_banners`
- `gallery_title`
- `allow_delete_command`
- `stats`
- `banners`

Decisao atual para estados nao ativos:

- o detalhe responde normalmente
- o frontend deve usar `status`, `is_active` e `accepting_photos` para decidir a UX

### `GET /api/v1/gallery/{identifier}/photos`

Contrato atual:

- `data`
- `next_cursor`
- `has_more`
- `meta.next_cursor`
- `meta.has_more`

Cada foto retorna:

- `id`
- `image_url`
- `is_processed`
- `sender_name`
- `caption`
- `width`
- `height`
- `published_at`

Regra atual:

- a lista retorna vazia quando a galeria nao esta `active`

### Tracking

Implementado:

- `POST /api/v1/gallery/track/view`
- `POST /api/v1/gallery/photos/{photo}/download`
- deduplicacao curta por IP + user-agent
- rate limit dedicado

## 3.6 Painel de Externas

Implementado agora no app administrativo:

- toggle de `Cobertura VIP`
- selecao de `vip_gallery_status`
- campo `whatsapp_group_id`
- campo `gallery_slug`
- campo manual de `custom_logo_path`
- campo `logo_size_percent`
- toggle `allow_delete_command`
- campo `delete_command_keyword`

Validacoes backend agora alinhadas:

- `gallery_slug` unico
- `whatsapp_group_id` unico
- `gallery_slug` obrigatorio quando `is_vip_gallery = true`
- `whatsapp_group_id` obrigatorio quando `is_vip_gallery = true`
- `delete_command_keyword` obrigatorio quando o delete command estiver habilitado
- quando VIP e desligado, os campos VIP sao normalizados/limpos no backend

## 4) O que falta exatamente

## 4.1 Backend

Ainda falta:

- rotina automatica de cleanup de arquivos orfaos
- retencao automatica de `vip_gallery_webhook_logs`
- backfill de eventos antigos
- chamada da Z-API para apagar a mensagem no grupo para todos
- CRUD administrativo de banners
- upload administrativo de logo customizada
- observabilidade operacional mais forte

## 4.2 Frontend publico `gallery/`

Ainda falta:

- trocar mocks por API real
- rota publica por slug
- client HTTP real
- polling leve para novas fotos
- banner/fila visual de novas fotos
- UX final para `draft`, `paused` e `archived`
- tela de vazio para galeria sem fotos
- decisao final sobre hospedar a galeria em app separado ou outra rota

Contrato recomendado para quando essa integracao comecar:

- slug dinamico
- TanStack Query
- cursor pagination
- polling leve
- troca silenciosa original -> processed

## 4.3 Admin operacional

Ainda falta:

- tela/listagem operacional das fotos VIP
- acao visual de reprocessar
- upload de logo ao inves de path manual
- CRUD de banners
- monitoramento de falhas e filas

## 5) Riscos e observacoes reais do estado atual

1. O pipeline esta fechado em `public`, entao qualquer migracao futura para S3/CDN vai exigir etapa dedicada de abstracao.
2. A logo atual depende de PNG transparente; formatos diferentes nao fazem parte do contrato oficial.
3. Ainda nao existe processo recorrente para limpar lixo residual fora do delete command.
4. O frontend publico ainda nao consome a API real, entao o contrato congelado precisa ser respeitado antes de iniciar essa integracao.
5. A chamada para apagar a mensagem no grupo ainda nao foi conectada a Z-API.

## 6) Proximos passos recomendados

Fase recomendada imediata:

1. implementar upload de logo e CRUD de banners no admin
2. criar command/job de cleanup de orfaos e retencao de logs
3. integrar o app `gallery/` com a API publica real
4. validar o fluxo com payloads reais da Z-API
5. fechar a chamada de delete para apagar a mensagem no grupo, se o produto mantiver essa necessidade

## 7) Validacao executada

Validado agora:

- `php artisan test tests/Feature/VipGallery/VipGalleryTest.php`
- resultado: `7 testes passando`
- `npm run build` em `apps/web`
- `php -l` nos arquivos PHP novos/alterados do modulo VIP e de `Externas`

Cobertura dos testes VIP agora inclui:

- rejeicao de secret invalido
- log e enfileiramento do webhook
- schema publico do detalhe/listagem da galeria
- tracking de view/download
- delete command com soft delete e remocao fisica
- tentativa de delete command sem permissao
- reprocessamento administrativo de foto `failed`
