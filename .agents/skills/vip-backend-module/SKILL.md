---
name: vip-backend-module
description: Use ao criar ou alterar modulo Laravel em apps/api/app/Modules: CRUD, migration, model, policy, permission, request, resource, controller, action, route, job, service ou Pest/PHPUnit tests.
---

## Padrao Obrigatorio

1. Leia `docs/AI_GUIDE.md`.
2. Procure padrao em `apps/api/app/Modules/Roteiros`.
3. Crie controller fino.
4. Coloque regra de negocio em Action ou Service.
5. Crie FormRequests.
6. Crie Resource.
7. Crie Policy ou use permissoes Spatie existentes.
8. Garanta envelope `{ success, data, message, meta }`.
9. Crie testes de CRUD, validacao 422, autorizacao 401/403, ownership/escopo e rotas especiais antes de `/{id}`.

## Nao Usar Quando

- A mudanca for apenas frontend.
- A mudanca for apenas documentacao sem alterar comportamento Laravel.

## Validacao

- `pnpm validate:api`
- `php artisan route:list` quando mexer em rotas
- Teste focado com `php artisan test --filter=NomeDoTeste` durante desenvolvimento.
