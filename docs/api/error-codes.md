# API Error Codes

> Referência fixa — usar em todas as respostas de erro.

| Code | HTTP Status | Quando Usar |
|------|------------|-------------|
| `VALIDATION_ERROR` | 422 | Campos inválidos (Laravel FormRequest) |
| `UNAUTHENTICATED` | 401 | Token ausente, expirado ou inválido |
| `FORBIDDEN` | 403 | Usuário sem permissão para a ação |
| `RESOURCE_NOT_FOUND` | 404 | Recurso não existe |
| `CONFLICT` | 409 | Duplicidade ou estado inconsistente |
| `RATE_LIMITED` | 429 | Limite de requisições excedido |
| `IDEMPOTENCY_REPLAY` | 200 | Resposta cacheada (header Idempotency-Key repetido) |
| `INTERNAL_SERVER_ERROR` | 500 | Erro inesperado no servidor |

## Formato

```json
{
  "success": false,
  "message": "Descrição legível do erro",
  "code": "VALIDATION_ERROR",
  "errors": {
    "email": ["O campo email é obrigatório"]
  },
  "trace_id": "req_01H..."
}
```

> `trace_id` é obrigatório em erros **500**. Opcional nos demais.
> `errors` presente apenas em **422**.
