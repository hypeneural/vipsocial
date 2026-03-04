# ADR-003: Audit Logging com Spatie Activitylog + Trait Custom

## Status
Aceito

## Contexto
Todo módulo precisa de auditoria completa (LGPD + compliance). O sistema rastreia quem fez o quê, quando, e as mudanças antes/depois.

## Decisão
Usar `spatie/laravel-activitylog` como base + trait `Auditable` custom que:
- Registra automaticamente `created`, `updated`, `deleted` via Model Observers
- Inclui campos extras: `request_id`, `trace_id`, `correlation_id`, `origin`, `ip_address`
- Salva `changes` como `{before: {...}, after: {...}}`

### Campos Adicionais (além do Spatie)
- `request_id` (rastreio ponta a ponta)
- `trace_id` (agrupar operações)
- `correlation_id` (encadear send/retry)
- `origin` (web, api, job, scheduler, webhook)
- Mascaramento de PII

### Retenção
- Audit logs: 24 meses → `audit:cleanup`
- Logs de aplicação: 90 dias
- Export: somente admin

## Consequências
- Toda Model usa `use Auditable;`
- Logs JSON estruturados via Monolog
- Laravel Context injeta request_id/trace_id em todos os logs
