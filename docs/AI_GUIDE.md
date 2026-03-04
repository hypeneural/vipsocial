# AI Guide — VIPSocial Hub

> Mapa para IA e desenvolvedores navegarem o codebase.

## Estrutura de Módulos (Backend)

Cada módulo em `apps/api/app/Modules/{Module}/` segue a estrutura:
```
{Module}/
├─ Actions/       # Regra de negócio (1 ação = 1 classe)
├─ DTOs/          # Data Transfer Objects
├─ Http/
│  ├─ Controllers/
│  ├─ Requests/   # FormRequests (validação)
│  └─ Resources/  # API Resources (transformação)
├─ Models/
├─ Policies/      # Autorização via Spatie
├─ Events/        # Domain events
├─ Jobs/          # Processamento assíncrono
├─ Services/      # Integrações externas
├─ routes.php     # Rotas do módulo (prefixo /api/v1)
└─ README.md      # Doc do módulo
```

## Golden Module: Roteiros 🏆

`Modules/Roteiros` é o módulo de referência. **Copiar seu padrão** ao criar novos módulos.

## Convenções

### Naming

- Controllers: `{Resource}Controller` (singular)
- Requests: `Create{Resource}Request`, `Update{Resource}Request`
- Resources: `{Resource}Resource`
- Policies: `{Resource}Policy`
- Actions: `{Verbo}{Resource}Action` (ex: `CreateRoteiroAction`)
- Events: `{Resource}{PastTense}` (ex: `RoteiroCreated`)
- Jobs: `{Verbo}{Resource}Job` (ex: `SendAlertJob`)

### Permissões (Spatie)

Formato: `{modulo}.{acao}` — ex: `roteiros.create`, `alertas.publish`

> ⚠️ **NUNCA** autorizar com `if ($user->role === 'admin')`. Usar `$user->can('modulo.acao')` ou Policy.

### API

- Base: `/api/v1`
- Banco: UTC
- Responses: ISO 8601
- Envelope: `{success, data, message, meta}`

## Checklist: Novo CRUD

- [ ] Migration
- [ ] Model (relações, scopes, casts, SoftDeletes, Auditable)
- [ ] Policy (permissões Spatie)
- [ ] FormRequest(s) (Create + Update)
- [ ] Resource (response transformation)
- [ ] Controller (fino, delega para Action)
- [ ] Action/Service (regra de negócio)
- [ ] Routes (`Modules/{Module}/routes.php`)
- [ ] AllowedFilters / AllowedSorts (Spatie QueryBuilder)
- [ ] Domain Events (Created, Updated, etc.)
- [ ] Feature tests (CRUD, filtros, permissões, validações)
- [ ] OpenAPI spec atualizada
- [ ] Orval client regenerado
- [ ] README do módulo atualizado
- [ ] Audit log validado (changes before/after)

## Como rodar

```bash
# Backend
cd apps/api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve

# Frontend
cd apps/web
pnpm install
pnpm dev

# Testes
cd apps/api && php artisan test
cd apps/web && pnpm test
```

## Como gerar OpenAPI + Client

```bash
# 1. Gerar spec do Laravel
cd apps/api && php artisan scramble:export
# Copia para packages/api-contract/openapi.json

# 2. Gerar client TS
cd packages/api-client && pnpm run generate
```
