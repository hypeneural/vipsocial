# WhatsApp Z-API Integration (Laravel Module)

Data: 2026-03-06  
Escopo: modulo backend `Modules/WhatsApp` para integrar com Z-API via provider client.

> Guia detalhado para backend: `docs/integrations/whatsapp-backend-guide.md`

## Estrutura

- `apps/api/app/Modules/WhatsApp/Clients/WhatsAppProviderInterface.php`
- `apps/api/app/Modules/WhatsApp/Clients/ZApiClient.php`
- `apps/api/app/Modules/WhatsApp/Clients/NullWhatsAppClient.php`
- `apps/api/app/Modules/WhatsApp/Services/WhatsAppService.php`
- `apps/api/app/Modules/WhatsApp/Support/PhoneNormalizer.php`
- `apps/api/app/Modules/WhatsApp/Http/Controllers/WhatsAppController.php`
- `apps/api/app/Modules/WhatsApp/Http/Requests/*`
- `apps/api/app/Modules/WhatsApp/Jobs/*`
- `apps/api/app/Modules/WhatsApp/routes.php`
- `apps/api/config/whatsapp.php`

## Configuracao

`.env`:

```env
WHATSAPP_PROVIDER=zapi
ZAPI_BASE_URL=https://api.z-api.io
ZAPI_INSTANCE=
ZAPI_TOKEN=
ZAPI_CLIENT_TOKEN=
ZAPI_TIMEOUT=30
ZAPI_RETRY_TIMES=3
ZAPI_RETRY_SLEEP_MS=300
WHATSAPP_CACHE_TTL_STATUS=15
WHATSAPP_CACHE_TTL_QRCODE=10
WHATSAPP_CACHE_TTL_DEVICE=30
WHATSAPP_DEFAULT_COUNTRY_CODE=55
```

Base URL final usada no client:

`{ZAPI_BASE_URL}/instances/{ZAPI_INSTANCE}/token/{ZAPI_TOKEN}/`

Header obrigatorio enviado:

`Client-Token: {ZAPI_CLIENT_TOKEN}`

## Endpoints internos

Todos os endpoints estao em `/api/v1/whatsapp/*` com `auth:sanctum`.

- `POST /send-text`
- `POST /send-image`
- `POST /send-link`
- `GET /status`
- `GET /qr-code/image`
- `GET /device`
- `GET /disconnect`
- `GET /groups/{groupId}/metadata`
- `GET /groups/{groupId}/light-metadata`
- `GET /contacts?page=1&pageSize=1000`
- `GET /chats?page=1&pageSize=1000`

Os endpoints de envio aceitam `async=true` para enfileirar Jobs.

## Exemplo: send-text (sync)

Request:

```json
{
  "phone": "(11) 99999-9999",
  "message": "Bem vindo ao VIP",
  "options": {
    "delayMessage": 3,
    "delayTyping": 1
  }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "zaapId": "3999984263738042930CD6ECDE9VDWSA",
    "messageId": "D241XXXX732339502B68",
    "id": "D241XXXX732339502B68"
  },
  "message": ""
}
```

## Exemplo: send-text (async)

Request:

```json
{
  "phone": "5511999999999",
  "message": "Mensagem assinc",
  "async": true,
  "queue": "whatsapp"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "queued": true,
    "channel": "whatsapp"
  },
  "message": "Mensagem enfileirada com sucesso"
}
```

## Tratamento de erro

Falhas do provider geram `WHATSAPP_PROVIDER_ERROR` com status HTTP do provider:

```json
{
  "success": false,
  "message": "Falha na requisicao para Z-API",
  "code": "WHATSAPP_PROVIDER_ERROR",
  "errors": {
    "provider_status": 500,
    "provider_body": {
      "error": "upstream"
    }
  }
}
```

## Testes

- Unit:
  - `tests/Unit/WhatsApp/PhoneNormalizerTest.php`
  - `tests/Unit/WhatsApp/ZApiClientTest.php`
- Feature:
  - `tests/Feature/WhatsAppTest.php`

Testes de provider usam `Http::fake()` para cobrir sucesso/falha, headers e URL final.
