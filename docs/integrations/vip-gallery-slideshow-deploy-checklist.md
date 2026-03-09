# VIP Gallery Telao Slideshow - Deploy e Rollback

Data: 2026-03-09  
Objetivo: registrar a sequencia minima para publicar, validar e reverter o modulo do telao sem improviso.

## 1) Pre-deploy

- rotacionar o `PUSHER_APP_SECRET` antes de producao, se o secret atual tiver sido exposto
- confirmar `BROADCAST_CONNECTION=pusher`
- confirmar `PUSHER_APP_ID`, `PUSHER_APP_KEY`, `PUSHER_APP_SECRET`, `PUSHER_HOST`, `PUSHER_PORT`, `PUSHER_SCHEME` e `PUSHER_APP_CLUSTER`
- confirmar `VITE_PUSHER_APP_KEY`, `VITE_PUSHER_HOST`, `VITE_PUSHER_PORT`, `VITE_PUSHER_SCHEME` e `VITE_PUSHER_APP_CLUSTER`
- confirmar queue worker/Horizon para:
  - `vip-gallery-webhook`
  - `vip-gallery-processing`
  - `vip-gallery-ack`
  - `vip-gallery-broadcast`

## 2) Deploy backend

```bash
git pull
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 3) Deploy frontend

```bash
pnpm --dir apps/web install --frozen-lockfile
pnpm --dir apps/web build:api-public
```

Validar:

- `apps/api/public/index.html` atualizado
- chunk do player `SlideshowPage-*` presente em `apps/api/public/assets`
- service worker novo publicado

## 4) Fallback de rota

Apache:

- `apps/api/public/.htaccess` precisa manter fallback SPA para `/slideshow/*`

Nginx:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Critico:

- `GET /slideshow/M6NS6M` nao pode retornar `404` do servidor web

## 5) Validacao pos-deploy

- `php artisan route:list --path=slideshow`
- `GET /api/v1/slideshow/{code}/boot`
- `GET /api/v1/slideshow/{code}/state`
- abrir `/slideshow/{code}`
- validar `new-media`, `media-updated`, `media-deleted`, `settings-updated` e `event-expired`
- validar queue backlog e logs de broadcast

## 6) Rollback rapido

Se o problema for apenas o player:

- desativar `is_enabled` do slideshow no admin ou banco
- manter a Cobertura VIP publica funcionando

Se o problema for broadcast:

- manter `BROADCAST_CONNECTION=pusher`
- pausar o telao no admin
- deixar o player cair para estado idle/expired

Se for necessario rollback de codigo:

```bash
git checkout <commit-anterior-estavel>
composer install --no-dev --optimize-autoloader
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
pnpm --dir apps/web build:api-public
```

## 7) Observacoes operacionais

- o player funciona offline-first apenas para midias ja sincronizadas
- novas midias nao aparecem sem conectividade
- o realtime depende do Pusher e da fila de broadcast
- o idle do MVP interno nao usa QR code
