# VIP Gallery Telao Slideshow - QA Checklist

Data: 2026-03-09  
Objetivo: padronizar a validacao visual e funcional do player do telao antes de publicar mudancas em producao.

## 1) Ambiente de teste

- Build mais recente do `apps/web` publicado em `apps/api/public`
- API com migrations do slideshow aplicadas
- `BROADCAST_CONNECTION=pusher`
- queue worker/Horizon ativos para filas VIP
- ao menos um evento com Cobertura VIP e telao habilitados

## 2) Casos obrigatorios do player

- foto vertical sem texto
- foto vertical com `texto_curto`
- foto vertical com `sender_name` longo
- foto horizontal sem texto
- foto horizontal com `texto_curto`
- foto muito clara
- foto muito escura
- foto com resolucao baixa
- fila vazia em modo idle interno
- partner logo presente
- partner logo ausente
- neon ligado
- neon desligado
- foto com `highlight_score >= 80`
- troca de original para processed sem duplicacao
- desativacao e reativacao de foto durante a execucao

## 3) Verificacoes visuais obrigatorias

- fotos verticais continuam com presenca visual forte em tela `16:9`
- fotos horizontais nao deformam
- `fullscreen`, `cinematic`, `split` e `polaroid` ficam visualmente distintos
- texto continua legivel em fotos claras e escuras
- overlays nao cobrem rosto em area critica
- logos e branding nao competem com a midia
- safe area continua respeitada em `1366x768`, `1600x900` e `1920x1080`
- transicoes nao apresentam flicker perceptivel
- modo idle parece parte do produto, sem QR no MVP interno
- modo de performance reduz blur/glow sem degradar leitura

## 4) Verificacoes funcionais obrigatorias

- `GET /api/v1/slideshow/{code}/boot` retorna `event + files + settings`
- `GET /api/v1/slideshow/{code}/state` ressinceroniza o player
- `slideshow.new-media` adiciona a midia sem interromper o slide atual
- `slideshow.media-updated` troca a URL sem criar item duplicado
- `slideshow.media-deleted` remove a midia corretamente
- `slideshow.settings-updated` aplica mudancas sem reload
- `slideshow.event-expired` troca para a tela final
- cache local permite reabrir o player com o ultimo estado conhecido
- em modo offline, o player continua tocando apenas midias ja prontas

## 5) Regra de aprovacao do MVP

O MVP so pode ser aprovado se:

- a maior parte dos cenarios de QA usar foto vertical de celular
- nenhuma decisao visual depender de QR code
- a operacao continuar estavel mesmo com reconnect ou rede ruim
- o player parecer telao premium, e nao apenas um site em fullscreen
