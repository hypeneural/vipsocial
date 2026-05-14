---
name: vip-fix-validation
description: Use para corrigir falhas de validacao no VIPSocial Hub: lint, typecheck, Pint, Pest, PHPUnit, Vitest ou build em apps/api, apps/web ou gallery, separando divida legada de regressao nova.
---

## Objetivo

Corrigir gates sem misturar feature nova.

## Regras

- Nao implementar feature nova.
- Corrigir o menor escopo possivel.
- Consultar `docs/codex/known-failures.md` antes de alterar.
- Separar falha existente de falha introduzida.
- Atualizar `docs/codex/known-failures.md` quando uma falha conhecida for resolvida.

## Fluxo

1. Rodar ou ler a validacao falhando.
2. Identificar se a falha esta no baseline.
3. Corrigir somente arquivos necessarios.
4. Rodar comando focado.
5. Rodar gate da area quando viavel.

## Nao Usar Quando

- O pedido for implementar feature nova.
- A falha vier de dependencia ausente e exigir decisao de stack.
