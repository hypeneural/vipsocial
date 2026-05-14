---
name: vip-review
description: Use para revisar PR ou diff no VIPSocial Hub antes de merge: permissoes, ownership, auth 401/403/422, contrato API, timezone, UX mobile, cache, performance, tests, lint, typecheck e build.
---

## Checklist

- Escopo tenant/user/ownership esta correto?
- 401/403/422 estao testados?
- Rotas especiais colidem com `/{id}`?
- Timezone usa UTC no banco e regra editorial quando necessario?
- API mantem envelope padrao?
- Front trata loading/error/empty?
- Nao ha `any`, `require()` ou hook mal usado novo?
- Tests, lint, typecheck e build relevantes foram executados?
- Mudanca exige atualizacao de docs?

## Severidade

Use `docs/codex/review-checklist.md` para classificar findings como Blocker, Major ou Minor.

## Saida

Liste findings primeiro, ordenados por severidade, com arquivo e linha quando possivel. Depois liste perguntas abertas e resumo curto.
