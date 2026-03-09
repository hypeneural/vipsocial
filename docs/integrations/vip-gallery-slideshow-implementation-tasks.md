# Plano de Execucao - VIP Gallery Telao Slideshow

Data inicial: 2026-03-09  
Contexto: implementar a arquitetura definida em `docs/integrations/vip-gallery-slideshow-integration-guide.md`, reaproveitando a estrutura atual da Cobertura VIP em `docs/integrations/vip-gallery-status-guide.md`.

## Regras do plano

- Este plano assume como decisoes fechadas:
  - mesmo dominio `adm.tvvip.social`
  - backend Laravel 12
  - frontend no `apps/web`
  - realtime via Pusher Channels
  - sem Node no servidor
  - `slideshow_code` separado de `gallery_slug`
  - `slideshow.media-updated` no MVP
- O time deve usar este arquivo como backlog vivo, atualizando status a cada entrega.
- Nenhuma tarefa deve alterar a arquitetura fechada sem atualizar primeiro a especificacao tecnica.

## Status legend

- `[ ]` pendente
- `[/]` em progresso
- `[x]` concluido
- `[!]` bloqueado

## Referencias obrigatorias

- `docs/integrations/vip-gallery-slideshow-integration-guide.md`
- `docs/integrations/vip-gallery-status-guide.md`
- `docs/integrations/vip-gallery-slideshow-qa-checklist.md`
- `docs/integrations/vip-gallery-slideshow-deploy-checklist.md`
- especificacao visual do player/telao recebida em 2026-03-09
- `apps/api/app/Modules/VipGallery`
- `apps/api/app/Modules/Externas`
- `apps/web/src/pages/externas/VipCoverageDashboard.tsx`

## Premissas visuais incorporadas ao backlog

- O player deve ser desenhado primeiro para TVs e teloes em viewport `16:9`.
- Fotos verticais sao o caso principal do produto e nao excecao.
- O player precisa parecer premium em tela grande, com a midia como protagonista.
- O frontend deve tratar a composicao visual em camadas:
  - background base
  - midia principal
  - overlay de texto
  - branding fixo
  - estados de sistema
- O layout nao pode deixar foto vertical pequena e perdida no centro da tela.
- O sistema visual precisa ser resiliente para:
  - foto vertical sem texto
  - foto horizontal sem texto
  - foto clara/escura
  - baixa resolucao
  - fila vazia
- Safe area minima do player:
  - horizontal: `max(16px, 2vw)`
  - vertical: `max(16px, 2vh)`
- O MVP visual passa a incluir `cinematic` como layout oficial junto de:
  - `polaroid`
  - `fullscreen`
  - `split`
- O player deve usar transicoes suaves, com foco em `opacity`, preload e baixo flicker.
- O frontend deve usar tokens visuais e evitar CSS global acoplado por IDs.

## Premissas de cache e resiliencia incorporadas ao backlog

- O player deve seguir arquitetura `offline-first`, limitada ao que ja foi sincronizado localmente.
- `localStorage` sozinho nao e suficiente para o modulo.
- O cache do player deve ser organizado em camadas:
  - app shell via Service Worker
  - estado local via IndexedDB
  - midias HTTP via Cache Storage
  - runtime do player com fila local e controle de readiness
- O player deve tocar prioritariamente midias `ready`.
- A rede deve atualizar estado e sinalizar mudancas, nao ser a fonte primaria de render.
- `boot` e `state` devem seguir `network first` com fallback local.
- Midias devem seguir `cache first` com revalidacao controlada.
- O player precisa distinguir ao menos:
  - `ready`
  - `loading`
  - `error`
  - `stale`
- O prefetch deve priorizar:
  - slide atual
  - proximo slide
  - proximos 3 a 10 itens
  - branding do player
- Videos devem ter politica de cache propria e mais restritiva que imagens.
- O backlog deve prever politica de retencao/LRU para nao deixar o cache crescer sem controle.
- O MVP atual nao usa QR code no player, porque o envio inicial e interno ao grupo do evento.

## Ordem recomendada

1. Fase 0 - seguranca e prerequisitos
2. Fase 1 - base tecnica de broadcasting
3. Fase 2 - modelagem de banco e dominio
4. Fase 3 - APIs de boot/state
5. Fase 4 - pipeline de eventos realtime
6. Fase 5 - administracao no painel
7. Fase 6 - player publico
8. Fase 7 - hardening, QA e deploy

## Fase 0 - Seguranca e prerequisitos

- [!] `SLD-000` Rotacionar o `PUSHER_APP_SECRET`.
  - Entregavel:
    - novo secret provisionado no painel do Pusher
    - ambientes atualizados
  - Criterio de aceite:
    - nenhum ambiente continua usando o secret exposto
  - Dependencia:
    - nenhuma
  - Observacao:
    - bloqueado por acesso operacional ao painel do Pusher

- [!] `SLD-001` Confirmar acesso operacional do ambiente para broadcast.
  - Entregavel:
    - `BROADCAST_CONNECTION=pusher`
    - credenciais Pusher configuradas em desenvolvimento e producao
    - Horizon/queue worker ativos no ambiente alvo
  - Criterio de aceite:
    - ambiente apto a publicar eventos sem erro de credencial
  - Dependencia:
    - `SLD-000`
  - Observacao:
    - localmente o smoke test do broadcast passou; pendente apenas validacao operacional do ambiente final

- [x] `SLD-002` Confirmar fallback de rotas do frontend para `/slideshow/*`.
  - Entregavel:
    - estrategia definida para Nginx/SPA fallback
  - Criterio de aceite:
    - abrir `adm.tvvip.social/slideshow/qualquer-codigo` nao retorna 404 de servidor web
  - Dependencia:
    - nenhuma

## Fase 1 - Base tecnica de broadcasting no backend

- [x] `SLD-100` Instalar broadcasting pelo fluxo oficial do Laravel 12.
  - Acao principal:
    - rodar `php artisan install:broadcasting --pusher`
  - Arquivos alvo:
    - `apps/api/config/broadcasting.php`
    - `apps/api/routes/channels.php`
    - `apps/api/composer.json`
  - Criterio de aceite:
    - broadcasting instalado
    - driver `pusher` funcional no projeto
  - Dependencia:
    - `SLD-001`

- [x] `SLD-101` Atualizar ambiente de exemplo do projeto para o slideshow.
  - Arquivos alvo:
    - `apps/api/.env.example`
    - `apps/web/.env.example` se existir, ou doc equivalente
  - Variaveis backend:
    - `BROADCAST_CONNECTION`
    - `PUSHER_APP_ID`
    - `PUSHER_APP_KEY`
    - `PUSHER_APP_SECRET`
    - `PUSHER_HOST`
    - `PUSHER_PORT`
    - `PUSHER_SCHEME`
    - `PUSHER_APP_CLUSTER`
  - Variaveis frontend:
    - `VITE_PUSHER_APP_KEY`
    - `VITE_PUSHER_HOST`
    - `VITE_PUSHER_PORT`
    - `VITE_PUSHER_SCHEME`
    - `VITE_PUSHER_APP_CLUSTER`
  - Criterio de aceite:
    - setup novo documentado sem segredo commitado
  - Dependencia:
    - `SLD-100`

- [x] `SLD-102` Configurar cache em camadas do player no frontend buildado.
  - Escopo minimo:
    - shell offline via Service Worker/PWA
    - runtime caching para `/api/v1/slideshow/*`
    - runtime caching para midias do slideshow
    - nomes de cache separados por finalidade
  - Criterio de aceite:
    - base de cache preparada para operacao resiliente em baixa conectividade
  - Dependencia:
    - `SLD-100`

- [x] `SLD-103` Validar a fila como requisito operacional do modulo.
  - Entregavel:
    - checklist operacional para queue worker/Horizon
    - fila de broadcast escolhida
    - fila oficial definida em `vip-gallery-broadcast`
    - smoke test local validado com `QUEUE_CONNECTION=sync` e broadcast Pusher sem erro
  - Criterio de aceite:
    - time sabe em qual fila os eventos do telao vao rodar
  - Dependencia:
    - `SLD-100`

## Fase 2 - Modelagem de banco e dominio

- [x] `SLD-200` Criar migration da tabela `vip_gallery_slideshows`.
  - Campos minimos:
    - `external_event_id`
    - `slideshow_code`
    - `is_enabled`
    - `status`
    - `layout`
    - `interval_ms`
    - `queue_limit`
    - `background_url`
    - `partner_logo_path`
    - `show_neon`
    - `neon_text`
    - `instructions_text`
    - `expires_at`
  - Arquivos alvo:
    - `apps/api/database/migrations/*create_vip_gallery_slideshows_table.php`
  - Criterio de aceite:
    - tabela criada com unique em `external_event_id` e `slideshow_code`
  - Dependencia:
    - `SLD-001`

- [x] `SLD-201` Alterar `vip_gallery_photos` para suportar o player.
  - Campos novos:
    - `media_type`
    - `short_text`
    - `highlight_score`
    - `slideshow_visible_at`
  - Arquivos alvo:
    - `apps/api/database/migrations/*add_slideshow_fields_to_vip_gallery_photos_table.php`
  - Criterio de aceite:
    - tabela apta para contrato do slideshow
  - Dependencia:
    - `SLD-001`

- [x] `SLD-202` Criar model `VipGallerySlideshow`.
  - Arquivos alvo:
    - `apps/api/app/Modules/VipGallery/Models/VipGallerySlideshow.php`
  - Relacoes minimas:
    - `event()`
  - Criterio de aceite:
    - model funcional com casts corretos
  - Dependencia:
    - `SLD-200`

- [x] `SLD-203` Atualizar dominio existente para relacionar slideshow.
  - Arquivos alvo:
    - `apps/api/app/Modules/Externas/Models/ExternalEvent.php`
    - `apps/api/app/Modules/VipGallery/Models/VipGalleryPhoto.php`
  - Ajustes esperados:
    - relacao `vipGallerySlideshow()`
    - helpers de elegibilidade para o telao
    - helper para payload de slide
  - Criterio de aceite:
    - dominio central conhece slideshow sem acoplamento incorreto
  - Dependencia:
    - `SLD-200`
    - `SLD-201`
    - `SLD-202`

- [x] `SLD-204` Definir enum/constantes de layout e status do slideshow.
  - Status minimos:
    - `draft`
    - `active`
    - `paused`
    - `archived`
    - `expired`
  - Layouts MVP:
    - `polaroid`
    - `fullscreen`
    - `split`
  - Criterio de aceite:
    - backend nao usa strings soltas espalhadas
  - Dependencia:
    - `SLD-202`

## Fase 3 - APIs publicas de boot e state

- [x] `SLD-300` Criar resource/DTO do slideshow.
  - Arquivos alvo:
    - `apps/api/app/Modules/VipGallery/Http/Resources/SlideshowResource.php`
    - `apps/api/app/Modules/VipGallery/Http/Resources/SlideMediaResource.php`
  - Criterio de aceite:
    - payload de `boot` e `state` sai padronizado
  - Dependencia:
    - `SLD-203`
    - `SLD-204`

- [x] `SLD-301` Criar controller publico de boot/state.
  - Arquivos alvo:
    - `apps/api/app/Modules/VipGallery/Http/Controllers/SlideshowBootController.php`
  - Endpoints:
    - `GET /api/v1/slideshow/{slideshowCode}/boot`
    - `GET /api/v1/slideshow/{slideshowCode}/state`
  - Criterio de aceite:
    - `boot` devolve `event + files + settings`
    - `state` devolve snapshot consistente para ressync
  - Dependencia:
    - `SLD-300`

- [x] `SLD-302` Adicionar rotas do slideshow.
  - Arquivos alvo:
    - `apps/api/app/Modules/VipGallery/routes.php`
  - Criterio de aceite:
    - rotas publicas expostas no modulo VIP
  - Dependencia:
    - `SLD-301`

- [x] `SLD-303` Implementar regra de elegibilidade das fotos para o telao.
  - Regra:
    - `is_approved = true`
    - `processing_status` em `published_original` ou `processed`
    - evento VIP ativo
    - slideshow habilitado
  - Criterio de aceite:
    - `boot/state` nunca devolvem foto indevida
  - Dependencia:
    - `SLD-301`

- [x] `SLD-304` Garantir que o payload devolve `url` pronta.
  - Regra:
    - frontend nao monta URL com `fileName`
  - Criterio de aceite:
    - `SlideMediaResource` entrega URL final e estavel
  - Dependencia:
    - `SLD-300`

## Fase 4 - Pipeline de eventos realtime

- [x] `SLD-400` Criar eventos de broadcast do modulo.
  - Arquivos alvo:
    - `apps/api/app/Modules/VipGallery/Events/SlideshowNewMedia.php`
    - `apps/api/app/Modules/VipGallery/Events/SlideshowMediaUpdated.php`
    - `apps/api/app/Modules/VipGallery/Events/SlideshowMediaDeleted.php`
    - `apps/api/app/Modules/VipGallery/Events/SlideshowSettingsUpdated.php`
    - `apps/api/app/Modules/VipGallery/Events/SlideshowExpired.php`
  - Regra:
    - todos usam `broadcastAs()`
    - todos usam `broadcastWith()`
  - Criterio de aceite:
    - contratos estaveis e sem serializacao automatica acidental
  - Dependencia:
    - `SLD-300`

- [x] `SLD-401` Criar servico central de emissao do slideshow.
  - Sugestao:
    - `VipGallerySlideshowBroadcaster` ou similar
  - Responsabilidade:
    - montar payload padrao
    - decidir qual evento emitir
  - Criterio de aceite:
    - jobs/controllers nao constroem payload manualmente em varios lugares
  - Dependencia:
    - `SLD-400`

- [x] `SLD-402` Emitir `slideshow.new-media` ao publicar foto elegivel.
  - Pontos provaveis:
    - `IngestVipGalleryImageJob`
    - aprovacao administrativa quando a foto volta a ser elegivel
  - Criterio de aceite:
    - nova foto entra no player sem reload
  - Dependencia:
    - `SLD-401`

- [x] `SLD-403` Emitir `slideshow.media-updated` quando a foto mudar.
  - Casos minimos:
    - original -> processed
    - alteracao de `short_text`
    - alteracao de `highlight_score`
  - Criterio de aceite:
    - mesma midia pode atualizar sem duplicar no player
  - Dependencia:
    - `SLD-401`

- [x] `SLD-404` Emitir `slideshow.media-deleted` ao retirar foto do telao.
  - Casos minimos:
    - `PATCH /photos/{photo}/approval` para `false`
    - delete command via WhatsApp
    - delete completo da Cobertura VIP
  - Criterio de aceite:
    - midia sai do player imediatamente
  - Dependencia:
    - `SLD-401`

- [x] `SLD-405` Emitir `slideshow.settings-updated` quando settings mudarem.
  - Casos minimos:
    - layout
    - intervalo
    - limite
    - background
    - partner logo
    - neon
    - status que afete o player
  - Criterio de aceite:
    - alteracao administrativa reflete sem reload
  - Dependencia:
    - `SLD-401`

- [x] `SLD-406` Emitir `slideshow.event-expired`.
  - Casos minimos:
    - expiracao por data/hora
    - encerramento manual
    - arquivamento
  - Criterio de aceite:
    - player troca para estado final corretamente
  - Dependencia:
    - `SLD-401`

## Fase 5 - Administracao no painel

- [x] `SLD-500` Criar backend administrativo do slideshow.
  - Arquivos alvo:
    - `apps/api/app/Modules/VipGallery/Http/Controllers/VipGallerySlideshowController.php`
  - Endpoints minimos:
    - `GET /api/v1/vip-gallery/events/{event}/slideshow`
    - `PATCH /api/v1/vip-gallery/events/{event}/slideshow`
    - `POST /api/v1/vip-gallery/events/{event}/slideshow/background`
    - `POST /api/v1/vip-gallery/events/{event}/slideshow/partner-logo`
    - `POST /api/v1/vip-gallery/events/{event}/slideshow/expire`
    - `POST /api/v1/vip-gallery/events/{event}/slideshow/reset`
  - Criterio de aceite:
    - API admin pronta para o painel
  - Dependencia:
    - `SLD-301`

- [x] `SLD-501` Integrar toggle `Ativar Telao` em `externas/cobertura-vip`.
  - Arquivos alvo:
    - `apps/web/src/pages/externas/VipCoverageDashboard.tsx`
    - hooks/services de externas
  - Criterio de aceite:
    - usuario ativa/desativa slideshow por evento
  - Dependencia:
    - `SLD-500`

- [x] `SLD-502` Criar painel de configuracao do slideshow no admin.
  - Campos MVP:
    - `is_enabled`
    - `status`
    - `layout`
    - `interval_ms`
    - `queue_limit`
    - `show_neon`
    - `neon_text`
    - `instructions_text`
    - `background`
    - `partner_logo`
    - `expires_at`
  - Criterio de aceite:
    - painel salva e recarrega configuracoes corretamente
  - Dependencia:
    - `SLD-501`

- [x] `SLD-503` Expor acoes de operador no admin.
  - Acoes:
    - abrir telao
    - copiar link
    - encerrar telao
    - resetar configuracoes
  - Criterio de aceite:
    - operacao diaria do telao possivel pelo painel
  - Dependencia:
    - `SLD-502`

- [x] `SLD-504` Registrar auditoria do slideshow em `event_activity_logs`.
  - Eventos minimos:
    - ativou/desativou telao
    - mudou layout
    - mudou velocidade
    - mudou limite
    - mudou background/logo/neon
    - encerrou telao
  - Criterio de aceite:
    - trilha administrativa completa no evento
  - Dependencia:
    - `SLD-500`

## Fase 6 - Player publico no `apps/web`

- [x] `SLD-600` Criar rota publica `/slideshow/:code`.
  - Arquivos alvo:
    - `apps/web/src/App.tsx`
    - `apps/web/src/pages/public/SlideshowPage.tsx` ou estrutura equivalente
  - Criterio de aceite:
    - rota publica abre sem layout administrativo
  - Dependencia:
    - `SLD-302`

- [x] `SLD-600A` Definir shell visual base do player para TV/telao.
  - Responsabilidades:
    - viewport `16:9` como caso principal
    - fullscreen sem navbar/sidebar
    - safe area visual padrao
    - camadas visuais base do player
  - Arquivos alvo:
    - `apps/web/src/features/vip-gallery/slideshow/components/SlideshowRoot.tsx`
    - `apps/web/src/features/vip-gallery/slideshow/components/PlayerShell.tsx`
    - tokens/estilos compartilhados do modulo
  - Criterio de aceite:
    - shell do player funciona bem em `1366x768`, `1600x900` e `1920x1080`
    - overlays e branding respeitam safe area
  - Dependencia:
    - `SLD-600`

- [x] `SLD-601` Criar cliente de API do slideshow.
  - Arquivos alvo:
    - `apps/web/src/features/vip-gallery/slideshow/api/getSlideshowBoot.ts`
    - `apps/web/src/features/vip-gallery/slideshow/api/getSlideshowState.ts`
  - Criterio de aceite:
    - boot/state consumidos via contrato tipado
  - Dependencia:
    - `SLD-301`

- [x] `SLD-601B` Criar camada local de persistencia do player.
  - Escopo minimo:
    - IndexedDB para estado do slideshow
    - persistencia de `settings`, `items`, `currentIndex`, `timestamp`
    - helper para `navigator.storage.persist()`
    - helper para `navigator.storage.estimate()`
  - Criterio de aceite:
    - player reabre com ultimo estado local mesmo sem resposta imediata da rede
  - Dependencia:
    - `SLD-601`

- [x] `SLD-601A` Tipar o contrato visual consumido pelo player.
  - Tipos minimos:
    - `SlideMedia`
    - `SlideSettings`
    - `MediaOrientation`
    - `PlayerVisualState`
  - Regras:
    - orientation deve suportar `vertical`, `horizontal`, `squareish`
    - settings devem prever branding e estados visuais
  - Criterio de aceite:
    - o renderer nao depende de shape solto vindo do backend
  - Dependencia:
    - `SLD-601`

- [x] `SLD-602` Criar bootstrap do Echo/Pusher no frontend.
  - Arquivos alvo:
    - `apps/web/src/features/vip-gallery/slideshow/lib/echo.ts`
  - Requisitos:
    - usar `laravel-echo`
    - usar `pusher-js`
    - usar variaveis `VITE_PUSHER_*`
  - Criterio de aceite:
    - player assina canal publico `slideshow.{code}`
  - Dependencia:
    - `SLD-101`

- [x] `SLD-603` Criar engine local do player.
  - Arquivos alvo:
    - `apps/web/src/features/vip-gallery/slideshow/engine/reducer.ts`
    - `selectors.ts`
    - `storage.ts`
  - Responsabilidades:
    - fila
    - indice atual
    - timer
    - `playedIds`
    - persistencia local
    - regras de prioridade da midia nova
  - Criterio de aceite:
    - engine funciona sem depender da UI
  - Dependencia:
    - `SLD-601`

- [x] `SLD-603A` Implementar classificacao de orientacao da midia.
  - Regras:
    - `vertical` quando altura > largura
    - `horizontal` quando largura > altura
    - `squareish` quando proporcao estiver proxima de `1:1`
  - Uso:
    - influenciar escolha de layout
    - influenciar `object-fit`
    - influenciar composicao visual
  - Criterio de aceite:
    - a engine e o renderer conseguem tratar orientacao sem heuristica espalhada
  - Dependencia:
    - `SLD-603`

- [x] `SLD-603C` Implementar modelo `ready-first` para assets.
  - Escopo minimo:
    - status `ready/loading/error/stale`
    - motor escolhe o proximo slide apenas entre itens prontos
    - fallback para repetir item atual ou idle quando necessario
  - Criterio de aceite:
    - player nao quebra nem tenta renderizar item ainda nao pronto
  - Dependencia:
    - `SLD-603`

- [x] `SLD-603D` Implementar fila de prefetch com prioridade.
  - Escopo minimo:
    - prioridade 0: atual/proximo/branding
    - prioridade 1: proximos 3 a 5
    - prioridade 2: aquecimento restante ate o limite
  - Criterio de aceite:
    - novas midias entram no fluxo somente depois de prontas
  - Dependencia:
    - `SLD-603C`

- [x] `SLD-603B` Implementar estrategia de escolha automatica de layout.
  - Regras minimas:
    - vertical prioriza `cinematic`, `split`, `polaroid`, `fullscreen`
    - horizontal prioriza `fullscreen`, `cinematic`
    - `squareish` prioriza `fullscreen`, `polaroid`
    - quando `texto_curto` existir, priorizar layouts com overlay mais forte
    - quando `highlight_score >= 80`, permitir layout de maior impacto
  - Criterio de aceite:
    - modo automatico fica previsivel e aderente a regra de produto
  - Dependencia:
    - `SLD-603A`

- [x] `SLD-604` Implementar hooks do player.
  - Hooks minimos:
    - `useSlideshowBoot`
    - `useSlideshowRealtime`
    - `useSlideshowEngine`
  - Criterio de aceite:
    - boot, realtime e engine ficam desacoplados
  - Dependencia:
    - `SLD-602`
    - `SLD-603`

- [x] `SLD-604A` Criar `MediaSurface` como componente base de midia.
  - Responsabilidades:
    - imagem x video
    - preload
    - fade in
    - fallback de erro
    - callbacks de `ready` e `complete`
  - Criterio de aceite:
    - layouts nao repetem logica de preload/renderizacao de midia
  - Dependencia:
    - `SLD-604`

- [x] `SLD-604B` Criar `LayoutRenderer` desacoplado da engine.
  - Responsabilidades:
    - escolher layout pelo setting atual
    - considerar orientacao da midia
    - considerar presenca de `texto_curto`
    - considerar estado visual do player
  - Criterio de aceite:
    - troca de layout nao exige reescrever hooks/engine
  - Dependencia:
    - `SLD-603B`
    - `SLD-604A`

- [x] `SLD-605` Implementar tela idle e tela expired.
  - Componentes minimos:
    - `IdleScreen`
    - `ExpiredScreen`
  - Criterio de aceite:
    - player tem fallback sem fotos e apos expiracao
  - Dependencia:
    - `SLD-604`

- [x] `SLD-605A` Implementar onboarding visual do estado idle.
  - Elementos minimos:
    - instrucao clara e grande
    - branding ativo
    - background bonito
  - Regras:
    - boa leitura a distancia
    - saida suave do idle quando a primeira midia chegar
    - sem dependencia de QR no MVP interno
  - Criterio de aceite:
    - o estado vazio parece parte do produto e nao placeholder tecnico
  - Dependencia:
    - `SLD-605`

- [x] `SLD-605B` Implementar estados visuais tecnicos do player.
  - Estados minimos:
    - `expired`
    - erro de boot
    - reconnect/ressync
  - Criterio de aceite:
    - o player nao cai em tela branca quando houver falha
  - Dependencia:
    - `SLD-605`

- [x] `SLD-606` Implementar layouts MVP.
  - Layouts:
    - `PolaroidLayout`
    - `FullscreenLayout`
    - `SplitLayout`
    - `CinematicLayout`
  - Regra:
    - layout so cuida de apresentacao visual
  - Criterio de aceite:
    - os 4 layouts renderizam corretamente a mesma midia
  - Dependencia:
    - `SLD-604`

- [x] `SLD-606A` Implementar `FullscreenLayout` como fallback visual universal.
  - Regras:
    - `object-fit: contain`
    - fundo base escuro
    - overlay inferior legivel
  - Criterio de aceite:
    - fotos horizontais e verticais funcionam sem deformacao
  - Dependencia:
    - `SLD-606`

- [x] `SLD-606B` Implementar `CinematicLayout` priorizando fotos verticais.
  - Regras:
    - backdrop blur derivado da propria imagem
    - card central premium
    - overlay inferior com gradiente
    - forte presenca visual em `16:9`
  - Criterio de aceite:
    - foto vertical nao parece sobra no meio da tela
  - Dependencia:
    - `SLD-606`

- [x] `SLD-606C` Implementar `SplitLayout` para texto relevante.
  - Regras:
    - midia ocupa aproximadamente `60%`
    - painel textual ocupa aproximadamente `40%`
    - boa hierarquia entre `texto_curto` e `sender_name`
  - Criterio de aceite:
    - fotos verticais com texto ficam equilibradas e legiveis
  - Dependencia:
    - `SLD-606`

- [x] `SLD-606D` Implementar `PolaroidLayout` com linguagem emocional.
  - Regras:
    - moldura branca
    - linguagem social/afetiva
    - badge de destaque opcional
  - Criterio de aceite:
    - o layout fica visualmente distinto e coerente com festa/casamento
  - Dependencia:
    - `SLD-606`

- [x] `SLD-606E` Padronizar regras de `object-fit` por layout/orientacao.
  - Regras:
    - `contain` para hero/vertical/premium
    - `cover` apenas quando o layout justificar crop
  - Criterio de aceite:
    - o player nao corta retratos de forma agressiva no MVP
  - Dependencia:
    - `SLD-606`

- [x] `SLD-606F` Implementar overlays de leitura resilientes.
  - Recursos minimos:
    - gradiente inferior
    - overlay escuro translúcido
    - `text-shadow` leve
    - blur local apenas quando necessario
  - Criterio de aceite:
    - texto permanece legivel em fotos claras e escuras
  - Dependencia:
    - `SLD-606`

- [x] `SLD-606G` Implementar branding fixo do player.
  - Elementos:
    - logo principal
    - partner logo
    - neon
  - Regras:
    - logo principal no canto inferior direito por padrao
    - partner logo no canto inferior esquerdo por padrao
    - neon no canto superior esquerdo por padrao
    - nenhum elemento concorre com a midia
  - Criterio de aceite:
    - branding fica consistente e nao invade areas criticas da foto
  - Dependencia:
    - `SLD-606`

- [x] `SLD-606H` Criar sistema de tokens visuais do player.
  - Tokens minimos:
    - cores de overlay
    - cores de texto
    - cor de acento
    - radii
    - sombras
    - blur strength
    - safe area
    - tamanhos de logo
    - opacidades padrao
  - Criterio de aceite:
    - layouts compartilham linguagem visual sem CSS duplicado
  - Dependencia:
    - `SLD-600A`

- [x] `SLD-607` Implementar regra de `new-media`.
  - Regra:
    - entra no topo da fila
    - nao interrompe slide atual
    - ganha prioridade no proximo ciclo
  - Criterio de aceite:
    - comportamento bate com o produto alvo
  - Dependencia:
    - `SLD-604`

- [x] `SLD-607A` Garantir transicao visual suave na troca de slide.
  - Regras:
    - preferir `opacity`
    - usar preload antes de exibir
    - evitar flicker
  - Criterio de aceite:
    - o player parece estavel em exibicao continua
  - Dependencia:
    - `SLD-607`

- [x] `SLD-608` Implementar regra de `media-deleted`.
  - Regra:
    - remover por `id`
    - se era a midia atual, avancar corretamente
  - Criterio de aceite:
    - delecao nao quebra player nem deixa item fantasma
  - Dependencia:
    - `SLD-604`

- [x] `SLD-609` Implementar regra de `media-updated`.
  - Regra:
    - atualizar item existente por `id`
    - trocar URL/processado sem duplicacao
  - Criterio de aceite:
    - original -> processed nao cria slide duplicado
  - Dependencia:
    - `SLD-604`

- [x] `SLD-610` Implementar ressync defensivo.
  - Regras:
    - no reconnect
    - ao detectar inconsistencia
    - opcionalmente a cada 60-120s
  - Criterio de aceite:
    - player recupera estado apos falha de conexao
  - Dependencia:
    - `SLD-601`
    - `SLD-604`

- [x] `SLD-611` Aplicar tipografia de longa distancia no player.
  - Regras:
    - usar `clamp()` para tamanhos
    - peso forte em `texto_curto`
    - contraste alto
    - truncamento controlado para layouts compactos
  - Criterio de aceite:
    - texto continua legivel em TV/telao sem poluir o slide
  - Dependencia:
    - `SLD-606`

- [x] `SLD-612` Implementar modo de performance visual do player.
  - Regras:
    - permitir reduzir blur pesado
    - reduzir glow exagerado
    - simplificar efeitos simultaneos
  - Criterio de aceite:
    - o player tem caminho de degradacao visual controlada para hardware fraco
  - Dependencia:
    - `SLD-606`

## Fase 7 - Testes, hardening e deploy

- [x] `SLD-700` Cobrir backend com testes de feature.
  - Casos minimos:
    - boot
    - state
    - toggle slideshow
    - update settings
    - broadcast de new/update/delete/expire
  - Arquivos alvo:
    - `apps/api/tests/Feature/VipGallery/*`
  - Criterio de aceite:
    - contratos principais cobertos
  - Dependencia:
    - `SLD-406`
    - `SLD-500`

- [x] `SLD-701` Cobrir frontend com testes de engine.
  - Casos minimos:
    - inserir nova midia
    - atualizar midia
    - remover midia
    - reconnect com ressync
  - Criterio de aceite:
    - engine do player validada sem depender do DOM final
  - Dependencia:
    - `SLD-610`

- [x] `SLD-701A` Criar checklist de QA visual do player.
  - Casos obrigatorios:
    - foto vertical sem texto
    - foto vertical com texto
    - foto vertical com nome grande
    - foto horizontal sem texto
    - foto horizontal com texto
    - foto muito clara
    - foto muito escura
    - foto com baixa resolucao
    - fila vazia em modo idle interno
    - partner logo presente/ausente
    - neon ligado/desligado
  - Verificacoes obrigatorias:
    - legibilidade
    - branding nao invade midia
    - layout nao quebra em `1366x768`
    - layout continua forte em `1920x1080`
    - transicao sem flicker perceptivel
  - Criterio de aceite:
    - QA visual deixa de ser subjetivo e vira checklist repetivel
  - Dependencia:
    - `SLD-606`

- [x] `SLD-701B` Validar fotos verticais como caso principal do MVP.
  - Regra:
    - a maior parte dos cenarios de QA deve usar midia vertical de celular
  - Criterio de aceite:
    - o time nao aprova layout que fique bom apenas para fotos horizontais
  - Dependencia:
    - `SLD-701A`

- [x] `SLD-702` Validar build e roteamento do `apps/web`.
  - Comandos:
    - build do frontend
    - validacao da rota `/slideshow/:code`
  - Criterio de aceite:
    - build serve admin + player no mesmo bundle
  - Dependencia:
    - `SLD-606`

- [x] `SLD-703` Validar operacao realtime em ambiente integrado.
  - Casos minimos:
    - foto nova entra no player
    - desativacao remove
    - alteracao de settings reflete
    - expiracao troca a tela
  - Criterio de aceite:
    - fluxo ponta a ponta validado
  - Dependencia:
    - `SLD-702`

- [x] `SLD-704` Checklist de deploy e rollback.
  - Itens minimos:
    - migracoes
    - env Pusher
    - queue/Horizon
    - cache/config clear
    - fallback do frontend
    - rollback desabilitando slideshow
  - Criterio de aceite:
    - time consegue publicar e voltar sem improviso
  - Dependencia:
    - `SLD-703`

## Criterios de aceite globais

- [x] O admin consegue ativar o telao em `externas/cobertura-vip`.
- [x] O sistema gera `slideshow_code` e URL publica valida.
- [x] `GET /api/v1/slideshow/{code}/boot` responde com `event + files + settings`.
- [x] `GET /api/v1/slideshow/{code}/state` suporta ressync defensivo.
- [x] O player abre em `/slideshow/{code}` sem layout administrativo.
- [x] O player recebe `slideshow.new-media` sem reload.
- [x] O player recebe `slideshow.media-updated` e atualiza a mesma midia sem duplicar.
- [x] O player recebe `slideshow.media-deleted` e remove a midia imediatamente.
- [x] O player recebe `slideshow.settings-updated` e aplica alteracoes sem reload.
- [x] O player recebe `slideshow.event-expired` e troca para a tela final.
- [x] Fotos verticais tem presenca visual forte em tela `16:9`.
- [x] O estado vazio do player e visualmente consistente com o restante do produto.
- [x] Logos e branding nao competem com a midia principal.
- [x] O texto continua legivel em fotos claras e escuras.
- [x] Os layouts `fullscreen`, `cinematic`, `split` e `polaroid` ficam visualmente distintos e coerentes.
- [x] As transicoes do player sao suaves e sem flicker perceptivel.
- [!] O ambiente de producao tem queue worker/Horizon adequados para o broadcast.

## Primeira entrega recomendada

Se o time quiser comecar agora sem abrir varias frentes ao mesmo tempo, a melhor primeira entrega e:

- `SLD-100`
- `SLD-101`
- `SLD-200`
- `SLD-201`
- `SLD-202`
- `SLD-203`
- `SLD-204`
- `SLD-300`
- `SLD-301`
- `SLD-302`

Objetivo dessa primeira entrega:

- deixar o banco pronto
- deixar o dominio pronto
- deixar `boot/state` prontos
- destravar o frontend do player sem ainda depender do realtime

## Segunda entrega recomendada

- `SLD-400` ate `SLD-406`
- `SLD-500` ate `SLD-504`

Objetivo:

- ligar realtime e administracao operacional

## Terceira entrega recomendada

- `SLD-600` ate `SLD-612`
- `SLD-700` ate `SLD-704`
- `SLD-701A`
- `SLD-701B`

Objetivo:

- fechar o player publico
- validar ponta a ponta
- fechar o visual premium do player para TV/telao
