---
name: vip-monorepo-workspace
description: Use para alterar pnpm-workspace, package.json raiz, turbo.json, scripts validate, packages/*, nomes de pacotes, lockfile ou integracao de gallery no workspace.
---

## Objetivo

Manter o monorepo previsivel para agentes e CI.

## Regras

- Usar pnpm.
- Nao criar `package-lock.json`, `yarn.lock` ou `bun.lock`.
- Preservar scripts existentes quando possivel.
- Scripts de validacao nao devem afirmar cobertura que nao executam.
- Se adicionar package ao workspace, garantir nome e scripts minimos coerentes.

## Validacao

- `pnpm list -r --depth -1`
- `pnpm typecheck`
- Validacoes focadas das areas impactadas.

## Nao Usar Quando

- A mudanca for apenas feature dentro de `apps/api` ou `apps/web`.
- A mudanca nao tocar workspace, scripts, packages ou lockfile.
