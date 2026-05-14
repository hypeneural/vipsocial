---
name: vip-frontend-feature
description: Use para criar ou alterar feature React em apps/web: CRUD, modal, pagina, rota, service, hook TanStack Query, types, utils, formulario React Hook Form/Zod e UX mobile-first. Nao usar para ajuste visual pequeno ou correcao isolada de lint.
---

## Estrutura Preferida

Criar em `src/features/{feature}`:

- `api/`
- `hooks/`
- `types/`
- `utils/`
- `components/`

## Regras

- Pagina consome feature; regra de negocio nao fica espalhada em `pages`.
- Server state via TanStack Query.
- Formularios com React Hook Form + Zod quando houver validacao.
- Tipos explicitos.
- Estados loading, error, empty e success.
- Testes de utils e logica de hooks quando aplicavel.
- UX mobile deve continuar navegavel e eficiente.

## Nao Usar Quando

- A mudanca for apenas backend.
- A mudanca for ajuste visual pequeno sem nova feature, API, rota, formulario ou hook.
- A tarefa for apenas correcao isolada de lint/typecheck.

## Validacao

- `pnpm validate:web`
