# VIP Gallery + Telao Slideshow - Especificacao Tecnica Revisada com Pusher Channels

Data: 2026-03-09
Objetivo: definir a arquitetura final do modulo de telao/slideshow integrado a Cobertura VIP, usando Laravel + Pusher Channels para realtime, sem Node no servidor.

Execucao detalhada:

- ver `docs/integrations/vip-gallery-slideshow-implementation-tasks.md`

## 0) Alerta imediato de seguranca

Como o `PUSHER_APP_SECRET` ja foi exposto fora desta doc durante a discussao tecnica, a recomendacao imediata e:

- rotacionar o secret do app Pusher antes de qualquer uso em producao
- atualizar o `.env` de todos os ambientes apos a rotacao
- invalidar qualquer configuracao anterior que tenha reutilizado esse secret

Isso nao muda a arquitetura escolhida, mas e uma acao obrigatoria de seguranca.

## 1) Decisoes ja fechadas

Estas decisoes passam a ser consideradas oficiais para a implementacao:

1. O telao sera uma extensao da Cobertura VIP atual, e nao um sistema paralelo.
2. O slideshow ficara no mesmo dominio do admin e da API:
   - `https://adm.tvvip.social`
3. O backend continuara em Laravel 12, usando a estrutura atual do projeto.
4. O frontend do telao sera feito em React buildado, com publicacao de HTML + assets estaticos.
5. Nao sera usado Node no servidor.
6. O realtime sera implementado com:
   - Laravel Broadcasting
   - driver Pusher
   - Pusher Channels
7. A administracao do telao sera integrada ao fluxo atual de:
   - `externas/cobertura-vip`
   - com um botao/toggle `Ativar Telao`
8. Quando o telao estiver ativado, o painel administrativo exibira as opcoes detalhadas do player.
9. O MVP sera image-only, mas o contrato deve nascer preparado para video.
10. O player publico do telao sera uma rota dedicada dentro do mesmo frontend buildado.
11. O telao tera `slideshow_code` proprio e separado de `gallery_slug`.
12. O evento `slideshow.media-updated` faz parte do MVP.

## 2) Arquitetura final recomendada

## 2.1 Visao geral

A arquitetura recomendada passa a ser:

- Laravel (`apps/api`)
  - fonte de verdade do dominio
  - persiste fotos, settings e estado do slideshow
  - expoe endpoints de boot e administracao
  - publica eventos broadcast para o Pusher
- Pusher Channels
  - servico gerenciado de realtime
  - responsavel por distribuir eventos para os players conectados
  - sem necessidade de rodar servidor WebSocket proprio
- React buildado (`apps/web`)
  - mesma base de frontend ja existente
  - inclui:
    - paginas administrativas
    - rota publica do telao
  - deploy como HTML + assets no mesmo dominio

## 2.2 Por que essa e a melhor abordagem

Essa abordagem e a melhor porque:

- reaproveita o dominio e backend ja existentes
- evita criar uma stack paralela so para o telao
- evita Node
- evita rodar e manter um gateway WebSocket proprio
- mantem o fluxo operacional dentro do admin atual
- reduz complexidade de infra
- permite um link publico simples para abrir o telao
- mantem a experiencia do player proxima do comportamento ja analisado

## 3) Realtime oficial do projeto

## 3.1 Tecnologia escolhida

O realtime do telao deve ser implementado com:

- Laravel Broadcasting
- driver `pusher`
- Pusher Channels
- Laravel Echo + `pusher-js` no frontend

Isso substitui totalmente a proposta anterior com Reverb.

## 3.2 Implicacao pratica

Mesmo sem Node, o projeto tera realtime porque:

- o Laravel emite os eventos de dominio via broadcasting
- o driver `pusher` envia esses eventos para o Pusher Channels
- o player React se conecta ao Pusher usando `pusher-js`
- o player recebe os eventos em tempo real

Nao sera necessario:

- subir gateway Socket.IO
- manter processo Node
- manter servidor WebSocket proprio

## 3.3 Configuracao de backend

O backend deve usar o driver `pusher` no broadcasting.

Fluxo preferencial no Laravel 12:

```bash
php artisan install:broadcasting --pusher
```

Esse comando deve ser tratado como caminho oficial primeiro, porque ele:

- habilita broadcasting
- cria/publica `config/broadcasting.php`
- cria `routes/channels.php`
- instala os pacotes necessarios
- orienta o setup das credenciais do Pusher

Se a equipe optar por setup manual:

```bash
composer require pusher/pusher-php-server
```

`.env` recomendado:

Usar as credenciais do app Pusher ja provisionado:

```env
BROADCAST_CONNECTION=pusher

PUSHER_APP_ID=...
PUSHER_APP_KEY=...
PUSHER_APP_SECRET=...
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=us2
```

`config/broadcasting.php`:

```php
'pusher' => [
    'driver' => 'pusher',
    'key' => env('PUSHER_APP_KEY'),
    'secret' => env('PUSHER_APP_SECRET'),
    'app_id' => env('PUSHER_APP_ID'),
    'options' => [
        'host' => env('PUSHER_HOST') ?: null,
        'port' => env('PUSHER_PORT', 443),
        'scheme' => env('PUSHER_SCHEME', 'https'),
        'cluster' => env('PUSHER_APP_CLUSTER'),
        'useTLS' => true,
    ],
],
```

Observacao importante:

As credenciais do Pusher:

- nunca devem ir para o Git
- nunca devem ser hardcoded no frontend
- a unica informacao publica no frontend sera a `app key`, o que e normal no modelo do Pusher

## 3.4 Fila e Horizon

O broadcasting do slideshow deve continuar seguindo o fluxo padrao do projeto:

- persistir no banco
- disparar evento
- enviar broadcast via queue

Ou seja, o modulo continua dependente de:

- queue worker
- Redis/Horizon

Isso deve ser tratado como requisito operacional, nao detalhe opcional.

Regra do modulo:

- todo broadcast do slideshow deve sair por fila
- o ambiente de producao precisa ter worker ativo
- o Horizon precisa estar saudavel

Motivo:

- nao travar request administrativa
- garantir envio assincrono
- manter padrao do sistema ja existente
- o Laravel envia broadcasts via jobs enfileirados por padrao

## 4) Topologia de rotas e dominio

Tudo ficara sob `adm.tvvip.social`.

## 4.1 Rotas administrativas ja existentes

Mantidas no frontend/admin atual:

- `https://adm.tvvip.social/externas/cobertura-vip`

## 4.2 Nova rota publica do telao

Recomendacao oficial:

- `https://adm.tvvip.social/slideshow/{slideshowCode}`

Exemplo:

- `https://adm.tvvip.social/slideshow/M6NS6M`

## 4.3 Rotas da API

Recomendadas:

- `GET /api/v1/slideshow/{slideshowCode}/boot`
- `GET /api/v1/slideshow/{slideshowCode}/state`

Admin:

- `GET /api/v1/vip-gallery/events/{event}/slideshow`
- `PATCH /api/v1/vip-gallery/events/{event}/slideshow`
- `POST /api/v1/vip-gallery/events/{event}/slideshow/background`
- `POST /api/v1/vip-gallery/events/{event}/slideshow/partner-logo`
- `POST /api/v1/vip-gallery/events/{event}/slideshow/expire`
- `POST /api/v1/vip-gallery/events/{event}/slideshow/reset`

## 5) Canais e eventos de realtime

## 5.1 Canal publico do slideshow

Como o telao e uma tela publica, a recomendacao e usar canal publico.

Nome do canal:

- `slideshow.{slideshowCode}`

Exemplo:

- `slideshow.M6NS6M`

Isso evita autenticacao de canal no player publico.

Decisao de projeto:

- canal publico para o player do telao no MVP
- canal privado apenas se no futuro existir preview restrito, monitoramento interno ou controle por operador

Consequencia pratica:

- `routes/channels.php` nao precisa de regra de autorizacao para o player publico neste MVP

## 5.2 Nome dos eventos

Eventos recomendados:

- `slideshow.new-media`
- `slideshow.media-updated`
- `slideshow.media-deleted`
- `slideshow.settings-updated`
- `slideshow.event-expired`

Essa padronizacao facilita:

- leitura no frontend
- debug no painel do Pusher
- consistencia do dominio

Regra adicional do modulo:

- todos os eventos do slideshow devem implementar `broadcastAs()`
- todos os eventos do slideshow devem implementar `broadcastWith()`

Motivo:

- nao confiar em serializacao automatica de propriedades publicas
- manter o contrato do player estavel
- evitar payload acidental
- facilitar versionamento do frontend

## 6) Decisao de frontend

## 6.1 Nao criar um frontend separado agora

A recomendacao e nao criar outro projeto frontend so para o telao.

O certo e evoluir o `apps/web` atual para suportar:

- area administrativa existente
- rota publica de player

## 6.2 Como organizar no React

O player deve existir como uma rota publica fora do layout administrativo.

Estrutura sugerida:

```txt
apps/web/src/
  features/vip-gallery/slideshow/
    api/
    engine/
    hooks/
    layouts/
    components/
  pages/
    admin/
    public/
      SlideshowPage.tsx
```

## 6.3 Como buildar e subir

O fluxo continua sendo:

1. buildar React
2. gerar HTML + assets
3. subir os arquivos buildados em `adm.tvvip.social`

A diferenca e que o build agora precisa incluir a rota:

- `/slideshow/:code`

## 6.4 Recomendacao de UX tecnica

O player deve ser:

- fullscreen
- sem navbar admin
- sem sidebar
- sem autenticacao
- carregamento isolado
- lazy-loaded para nao pesar o admin

## 7) Administracao dentro do painel atual

## 7.1 Entrada no fluxo

Na tela ja existente de:

- `externas/cobertura-vip`

deve haver o controle:

- `Ativar Telao` (`boolean`)

## 7.2 Comportamento do toggle

Quando desligado:

- o evento nao tem slideshow ativo
- o player publico retorna estado desabilitado ou 404/410 conforme regra
- nao ha emissao de eventos do slideshow

Quando ligado:

- cria ou ativa o registro do slideshow
- libera painel de configuracao
- libera URL publica do telao
- habilita o boot e o realtime

## 7.3 Campos que aparecem ao ativar

No admin, ao ativar o telao, o usuario deve conseguir configurar:

- status do telao
- layout
- intervalo em ms
- limite da fila
- mostrar neon
- texto do neon
- texto das instrucoes
- background
- logo do parceiro
- data/hora de expiracao
- habilitado/desabilitado

## 7.4 Secao sugerida no admin

### Bloco: Telao / Slideshow

Campos:

- `Ativar Telao`
- `Codigo do Telao`
- `URL Publica`
- `Layout`
- `Velocidade`
- `Limite de Fotos`
- `Mostrar Placa Neon`
- `Texto da Placa`
- `Texto de Instrucao`
- `Background`
- `Logo do Parceiro`
- `Expira em`
- botao `Abrir Telao`
- botao `Copiar Link`
- botao `Encerrar Telao`

## 8) Modelagem de banco recomendada

## 8.1 Nova tabela `vip_gallery_slideshows`

Essa tabela passa a existir como entidade propria do telao.

Decisao fechada:

- `slideshow_code` e o identificador publico do telao
- `gallery_slug` continua sendo identificador da galeria publica
- os dois conceitos nao devem ser acoplados

Schema sugerido:

```sql
vip_gallery_slideshows
- id
- external_event_id (unique)
- slideshow_code (string, unique)
- is_enabled (boolean)
- status (draft|active|paused|archived|expired)
- layout (string)
- interval_ms (unsigned integer)
- queue_limit (unsigned integer)
- background_url (nullable string)
- partner_logo_path (nullable string)
- show_neon (boolean)
- neon_text (nullable string)
- instructions_text (nullable text)
- expires_at (nullable timestamp)
- created_at
- updated_at
```

## 8.2 Novos campos em `vip_gallery_photos`

Adicionar:

```sql
- media_type (string default 'image')
- short_text (nullable string)
- highlight_score (unsigned integer default 0)
- slideshow_visible_at (nullable timestamp)
```

## 8.3 Justificativa

Esses campos resolvem:

- `media_type`
  - prepara para video sem quebrar contrato depois
- `short_text`
  - separa texto do telao da `caption` original
- `highlight_score`
  - permite badge tipo `DESTAQUE`
- `slideshow_visible_at`
  - opcional para auditoria

## 9) Contrato oficial do boot

## 9.1 Endpoint

- `GET /api/v1/slideshow/{slideshowCode}/boot`

## 9.2 Resposta recomendada

```json
{
  "success": true,
  "data": {
    "event": {
      "id": 1,
      "title": "Casamento VIP",
      "slug": "casamento-vip",
      "slideshow_code": "M6NS6M",
      "status": "active"
    },
    "files": [
      {
        "id": "photo_123",
        "url": "https://adm.tvvip.social/storage/vip-gallery/events/1/processed/msg-1.jpg",
        "type": "image",
        "sender_name": "Anderson Marques",
        "texto_curto": "",
        "highlight_score": 70,
        "created_at": "2026-03-09T10:00:00-03:00"
      }
    ],
    "settings": {
      "intervalo": 10000,
      "limite": 100,
      "layout": "polaroid",
      "background": null,
      "partnerLogo": null,
      "showNeon": true,
      "neonText": "Casamento Teste",
      "instructionsText": "Aponte a camera para o QR Code e envie suas fotos do evento!"
    }
  }
}
```

## 9.3 Regra importante

O backend deve devolver `url` pronta.

O frontend do player nao deve montar URL com `fileName`.

## 10) Contrato oficial do realtime

## 10.1 Evento `slideshow.new-media`

Emitir quando:

- foto aprovada/publicada passa a ser elegivel ao telao
- foto reativada volta a aparecer

Payload:

```json
{
  "id": "photo_123",
  "url": "https://adm.tvvip.social/storage/vip-gallery/events/1/processed/msg-1.jpg",
  "type": "image",
  "sender_name": "Anderson Marques",
  "texto_curto": "",
  "highlight_score": 70,
  "created_at": "2026-03-09T10:00:00-03:00"
}
```

## 10.2 Evento `slideshow.media-updated`

Emitir quando:

- a mesma midia muda de original para processed
- muda `short_text`
- muda `highlight_score`

Payload:

```json
{
  "id": "photo_123",
  "url": "https://adm.tvvip.social/storage/vip-gallery/events/1/processed/msg-1.jpg",
  "highlight_score": 85,
  "texto_curto": "Entrada dos noivos"
}
```

## 10.3 Evento `slideshow.media-deleted`

Emitir quando:

- foto for desativada
- delete command apagar a foto
- cobertura for removida

Payload:

```json
{
  "id": "photo_123"
}
```

## 10.4 Evento `slideshow.settings-updated`

Emitir quando:

- layout mudar
- intervalo mudar
- limite mudar
- neon mudar
- logo/background mudar
- pausa/retomada do telao afetar o player

Payload:

```json
{
  "intervalo": 10000,
  "limite": 100,
  "layout": "polaroid",
  "background": null,
  "partnerLogo": null,
  "showNeon": true,
  "neonText": "Casamento Teste",
  "instructionsText": "Aponte a camera para o QR Code e envie suas fotos do evento!"
}
```

## 10.5 Evento `slideshow.event-expired`

Emitir quando:

- expirar
- arquivar
- encerrar manualmente

Payload:

```json
{
  "reason": "expired",
  "expired_at": "2026-03-09T18:30:00-03:00"
}
```

## 11) Exemplo de implementacao backend com Laravel Broadcasting

## 11.1 Event de broadcast

Exemplo de event para nova midia:

```php
<?php

namespace App\Modules\VipGallery\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SlideshowNewMedia implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public string $slideshowCode,
        public array $payload
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel("slideshow.{$this->slideshowCode}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'slideshow.new-media';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
```

Regra do modulo:

- todos os eventos devem usar `broadcastAs()`
- todos os eventos devem usar `broadcastWith()`
- nenhum evento deve expor o contrato do player apenas por propriedades publicas serializadas automaticamente

## 11.2 Disparo do evento

Depois de persistir e confirmar que a foto esta elegivel ao telao:

```php
event(new SlideshowNewMedia($slideshow->slideshow_code, [
    'id' => (string) $photo->id,
    'url' => $photo->publicImageUrl(),
    'type' => $photo->media_type ?? 'image',
    'sender_name' => $photo->sender_name,
    'texto_curto' => $photo->short_text ?: ($photo->caption ?? ''),
    'highlight_score' => (int) ($photo->highlight_score ?? 0),
    'created_at' => optional($photo->received_at ?? $photo->created_at)?->toIso8601String(),
]));
```

## 12) Cliente realtime no frontend

## 12.1 Dependencias

No frontend do player, usar:

```bash
npm install pusher-js laravel-echo
```

## 12.2 Bootstrap do Echo

Exemplo:

```ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

(window as any).Pusher = Pusher;

export function createSlideshowEcho() {
  return new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    wsHost: import.meta.env.VITE_PUSHER_HOST || undefined,
    wsPort: Number(import.meta.env.VITE_PUSHER_PORT || 443),
    wssPort: Number(import.meta.env.VITE_PUSHER_PORT || 443),
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: (import.meta.env.VITE_PUSHER_SCHEME || 'https') === 'https',
  });
}
```

## 12.3 Assinatura do canal

Exemplo:

```ts
const echo = createSlideshowEcho();

echo.channel(`slideshow.${slideshowCode}`)
  .listen('.slideshow.new-media', (payload) => {
    // inserir na fila
  })
  .listen('.slideshow.media-updated', (payload) => {
    // atualizar item existente
  })
  .listen('.slideshow.media-deleted', (payload) => {
    // remover por id
  })
  .listen('.slideshow.settings-updated', (payload) => {
    // aplicar settings
  })
  .listen('.slideshow.event-expired', (payload) => {
    // mostrar tela final
  });
```

Observacao:

- como os eventos do slideshow usam `broadcastAs()`, os listeners do Echo devem usar prefixo `.` no nome do evento
- exemplo correto: `.slideshow.new-media`

## 12.4 Variaveis do frontend

No build do React, expor:

```env
VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="${PUSHER_HOST}"
VITE_PUSHER_PORT="${PUSHER_PORT}"
VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
```

Nao expor o secret.

## 13) Motor do player no frontend

O player nao deve depender so de requests.

Ele precisa de uma engine propria com:

- fila em memoria
- indice atual
- timer
- controle de midia ja tocada
- prioridade para midia nova
- resync
- persistencia local

## 13.1 Estado recomendado

```ts
type SlideshowState = {
  status: 'idle' | 'playing' | 'expired';
  items: SlideMedia[];
  currentIndex: number;
  settings: SlideSettings;
  playedIds: string[];
  renderVersion: number;
};
```

## 13.2 Persistencia local

Usar `localStorage` por slideshow code:

- `slideshow_cache_{code}`

Salvar:

- items
- currentIndex
- settings minimos
- timestamp de sync

## 13.3 Regra de boot

1. tenta ler cache local
2. chama `/boot`
3. sincroniza estado
4. conecta no Pusher via Echo
5. assina o canal do slideshow
6. comeca a tocar

## 13.4 Regra de resync

O resync defensivo do player e requisito obrigatorio do MVP.

Deve acontecer:

- no reconnect
- ao detectar inconsistencia entre fila local e backend
- opcionalmente a cada 60s ou 120s
- usando `GET /api/v1/slideshow/{code}/state`

Motivo:

- o player pode ficar aberto por horas
- o navegador pode entrar em sleep
- pode haver perda visual de algum evento sem que o operador perceba

## 14) Layouts do player

## 14.1 MVP de layouts

Entregar primeiro:

- `polaroid`
- `fullscreen`
- `split`

## 14.2 Segunda fase

Depois:

- `cinematic`
- `ken-burns`
- `spotlight`
- `gallery`
- `mosaic`
- `grid`
- `carousel`

## 14.3 Regra tecnica

Cada layout deve cuidar apenas da composicao visual.

Nao deve cuidar de:

- Pusher/Echo
- timer
- fila
- boot
- reconnect

Esses pontos ficam em:

- hooks
- engine
- container do player

## 15) Implementacao backend

## 15.1 Componentes novos

No Laravel, criar:

- `VipGallerySlideshow` model
- migration `vip_gallery_slideshows`
- migration alterando `vip_gallery_photos`
- `SlideshowBootController`
- `VipGallerySlideshowController` admin
- `SlideshowResource`
- `SlideMediaResource`
- events broadcast do slideshow

## 15.2 Events de dominio recomendados

Criar eventos proprios, por exemplo:

- `SlideshowNewMedia`
- `SlideshowMediaUpdated`
- `SlideshowMediaDeleted`
- `SlideshowSettingsUpdated`
- `SlideshowExpired`

Todos devem implementar broadcasting.

## 15.3 Regra de emissao

Emitir somente depois da persistencia.

Ideal:

- salvar no banco
- commit
- disparar evento broadcast

## 15.4 Queue/Horizon

Como o broadcasting vai trafegar pelo fluxo assincrono da aplicacao, o modulo deve assumir:

- queue worker ativo
- Horizon saudavel
- retry policy adequada

Isso deve ser considerado criterio operacional minimo para qualquer deploy do slideshow.

## 16) Implementacao frontend

## 16.1 Estrutura sugerida

```txt
features/vip-gallery/slideshow/
  api/
    getSlideshowBoot.ts
    getSlideshowState.ts
  hooks/
    useSlideshowBoot.ts
    useSlideshowRealtime.ts
    useSlideshowEngine.ts
  engine/
    reducer.ts
    selectors.ts
    storage.ts
  components/
    SlideshowRoot.tsx
    IdleScreen.tsx
    MediaSurface.tsx
    LayoutRenderer.tsx
  layouts/
    PolaroidLayout.tsx
    FullscreenLayout.tsx
    SplitLayout.tsx
```

## 16.2 Cliente realtime

No frontend, usar:

- Laravel Echo
- `pusher-js`

## 16.3 Tela idle

Se nao houver fotos:

- mostrar QR
- mostrar instrucao
- aplicar background e neon se habilitados

## 16.4 Regra para midia nova

Midia recebida em realtime:

- entra no topo da fila
- nao interrompe o slide atual
- ganha prioridade no proximo ciclo

## 16.5 Regra de delecao

Ao receber `mediaDeleted`:

- remove por `id`
- se era a midia atual:
  - interrompe render atual
  - avanca corretamente
- nao usar `fileName` como identificador principal

## 17) Administracao no painel

## 17.1 Fluxo esperado

Dentro de `externas/cobertura-vip`:

1. usuario abre um evento
2. habilita `Ativar Telao`
3. sistema cria/configura slideshow
4. usuario define layout, velocidade, limite etc.
5. usuario salva
6. backend persiste
7. backend emite `slideshow.settings-updated`
8. player reflete sem reload

## 17.2 Acoes adicionais

No painel, incluir:

- copiar link do telao
- abrir telao
- encerrar telao
- pausar telao
- resetar configuracoes
- pre-visualizar layout

## 17.3 Logs administrativos

Registrar em `event_activity_logs`:

- ativou telao
- desativou telao
- mudou layout
- mudou intervalo
- mudou limite
- mudou background/logo/neon
- encerrou telao

## 18) Infra e deploy

## 18.1 Processo do app

Operacao minima em producao:

- PHP-FPM / Nginx
- queue worker / Horizon
- credenciais validas do Pusher
- `BROADCAST_CONNECTION=pusher`

## 18.2 Nginx

Necessario configurar:

- SPA fallback do frontend
- proxy de `/api`
- rota `/slideshow/*` servindo o mesmo build

Nao sera necessario proxy WebSocket local para um gateway proprio, porque a conexao realtime sera feita contra o Pusher.

## 18.3 Monitoramento

Monitorar no minimo:

- queue backlog
- falhas de broadcast
- erros de boot do player
- reconnect do player
- saude geral da API

## 19) MVP oficial recomendado

Entregar no MVP:

- ativacao do telao no admin
- tabela `vip_gallery_slideshows`
- campos novos em `vip_gallery_photos`
- endpoint `/boot`
- endpoint `/state`
- realtime com Pusher Channels
- layouts:
  - `polaroid`
  - `fullscreen`
  - `split`
- eventos:
  - `slideshow.new-media`
  - `slideshow.media-updated`
  - `slideshow.media-deleted`
  - `slideshow.settings-updated`
  - `slideshow.event-expired`
- `localStorage`
- resync de reconnect

Fica para fase 2:

- video real no pipeline
- layouts premium restantes
- multiplos telaos por evento
- settings por telao em vez de por evento
- CDN/dominio de midia dedicado
- score automatico por IA

## 20) Criterios de aceite

O modulo sera considerado pronto quando:

1. Ao ativar o telao no admin, o sistema gerar uma URL publica utilizavel.
2. O player abrir em `adm.tvvip.social/slideshow/{code}`.
3. O boot inicial retornar `files + settings`.
4. O player tocar fotos aprovadas sem reload.
5. Nova foto aprovada entrar no telao em tempo real.
6. Mudanca de layout/velocidade/limite refletir em tempo real.
7. Desativacao de foto remover a midia do player imediatamente.
8. Encerramento/expiracao substituir o player por tela final.
9. Em reconnect do realtime, o player conseguir se ressincronizar.
10. O admin conseguir gerenciar tudo pelo fluxo ja existente de Cobertura VIP.

## 21) Recomendacao final para o time

A orientacao final e:

- nao criar sistema paralelo
- nao usar Node
- nao rodar gateway Socket.IO proprio
- usar Pusher Channels como realtime oficial
- manter o telao no mesmo dominio `adm.tvvip.social`
- integrar a administracao no fluxo atual de `externas/cobertura-vip`
- subir o player como rota publica do mesmo frontend buildado
- fazer o MVP image-only, mas com contrato preparado para video

Em resumo:

> o telao deve nascer como um submodulo formal da Cobertura VIP, com backend dedicado no Laravel, realtime via Pusher Channels, administracao embutida no painel existente e player publico servido no mesmo dominio do admin. O contrato do player deve ser estavel, orientado por `boot + state + broadcast events`, com fila local no frontend e resync defensivo para operacao prolongada.

Se quiser, no proximo passo eu transformo isso em um handoff tecnico em formato de tarefas, com:

- migrations Laravel
- controllers e requests
- events de broadcast
- resources/DTOs
- estrutura React
- checklist por fase para o time executar
