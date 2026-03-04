# ADR-002: Autenticação com Sanctum + Refresh Token Custom

## Status
Aceito

## Contexto
A API precisa de autenticação stateless com tokens. O frontend é um SPA React que consome a API via Bearer token.

## Decisão
Usar **Laravel Sanctum** para emissão de Bearer tokens + implementação **custom de refresh token**.

### Fluxo
1. Login retorna `token` (1h TTL) + `refresh_token` (30d TTL)
2. Frontend detecta 401 → `POST /api/v1/auth/refresh`
3. Backend valida hash do refresh_token, rotaciona, emite novo par
4. Se refresh inválido → redirect para login

### Tabela
`refresh_tokens`: id, user_id, token_hash (SHA-256), device_name, expires_at, revoked_at, created_at

## Alternativas descartadas
- **Passport (OAuth2):** overhead desnecessário para sistema interno sem third-party clients
- **JWT puro:** sem revogação nativa, complexidade de blacklist
- **Sanctum SPA (cookies):** front e back em domínios diferentes, CORS mais complexo

## Consequências
- Precisa implementar rotação e revogação manual
- Cleanup job para tokens expirados
- Mais controle sobre segurança (revogação por device)
