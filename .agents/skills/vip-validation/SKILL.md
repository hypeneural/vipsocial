---
name: vip-validation
description: Use para validar alteracoes no VIPSocial Hub: escolher comandos, consultar known-failures, separar falha legada de regressao e montar resumo confiavel de testes, lint, build e typecheck.
---

## Objetivo

Garantir que o agente nao diga que validou o monorepo inteiro quando so validou uma parte.

## Passos

1. Identifique quais areas foram alteradas:
   - `apps/api`
   - `apps/web`
   - `gallery`
   - `packages/api-contract`
   - `packages/api-client`
   - `packages/shared-types`
2. Consulte `docs/codex/known-failures.md`.
3. Rode apenas validacoes relevantes, mas nunca confunda validacao parcial com validacao total.
4. Se a tarefa alterou contrato API, validar backend, spec e client TypeScript.
5. Se algum comando falhar, relate claramente o comando, o erro e se a falha ja existia.
6. No resumo final, use:
   - Validacoes executadas
   - Resultado
   - Falhas restantes
   - O que nao foi executado e por que

## Nao Usar Quando

- A tarefa for apenas leitura/analise sem necessidade de rodar comandos.

## Matriz

Consulte `docs/codex/validation-matrix.md`.
