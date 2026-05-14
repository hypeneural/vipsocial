# Context Map - VIPSocial Hub

Use este arquivo para localizar rapidamente padroes, modulos e contratos antes de sair procurando pelo monorepo inteiro.

## Monorepo

- `apps/api`: Laravel API.
- `apps/web`: React/Vite frontend principal.
- `gallery`: app gallery incluido no workspace e validado separadamente.
- `packages/api-contract`: OpenAPI gerado pelo Scramble.
- `packages/api-client`: client TypeScript gerado por Orval quando configurado.
- `packages/shared-types`: tipos compartilhados entre apps quando houver contrato estavel.

## Backend

Golden Module:

- `apps/api/app/Modules/Roteiros`

Padrao de modulo:

- `Actions/`
- `DTOs/` quando necessario
- `Http/Controllers`
- `Http/Requests`
- `Http/Resources`
- `Models/`
- `Policies/`
- `routes.php`
- `README.md`

Regras centrais:

- Controller fino.
- Regra de negocio em Action ou Service.
- Envelope `{ success, data, message, meta }`.
- Auth via Sanctum.
- Permissoes via Spatie/Policy.
- Nunca usar `if role === admin`.

## Frontend

Padrao de feature:

- `src/features/{feature}/api`
- `src/features/{feature}/hooks`
- `src/features/{feature}/types`
- `src/features/{feature}/utils`
- `src/features/{feature}/components`

Server state:

- TanStack Query.

Formularios:

- React Hook Form + Zod quando houver validacao.

## Contrato API

- OpenAPI: `packages/api-contract/openapi.json`
- Client TS: `packages/api-client`
- Geracao de spec: `pnpm api:generate-spec`
- Geracao de client: `pnpm api:generate-client`

## Validacao

- Matriz oficial: `docs/codex/validation-matrix.md`
- Falhas conhecidas: `docs/codex/known-failures.md`
- Checklist review: `docs/codex/review-checklist.md`

## Artefatos Versionados

- `apps/web/dist` e versionado para hospedagem.
- Nao editar manualmente.
- Manter mudancas de `dist` apenas quando build frontend for intencional.
