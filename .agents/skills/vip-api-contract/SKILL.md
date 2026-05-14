---
name: vip-api-contract
description: Use quando uma alteracao mudar contrato API: endpoint, route, payload, request, resource, response, query params, envelope, OpenAPI, shared types ou client TypeScript gerado. Nao usar para UI pura ou refactor interno sem mudanca de request/response.
---

## Pre-Check Obrigatorio

Antes de alterar contrato:

1. Verifique se `packages/api-client/package.json` existe.
2. Verifique se existe script `generate`.
3. Se o gerador de client ainda nao estiver configurado:
   - rode apenas `pnpm api:generate-spec`;
   - nao afirme client atualizado;
   - crie ou atualize pendencia em `docs/codex/known-failures.md`.

## Passos

1. Validar se endpoint, request, response ou query params mudaram.
2. Atualizar Resource, FormRequest e Controller.
3. Gerar OpenAPI com `pnpm api:generate-spec`.
4. Atualizar `packages/api-contract/openapi.json`.
5. Gerar client TS com `pnpm api:generate-client`.
6. Ajustar imports do frontend.
7. Rodar `pnpm validate:api` e `pnpm validate:web`.
8. Se a geracao de client ainda estiver bloqueada, relatar como pendencia e nao afirmar contrato atualizado.

## Nao Usar Quando

- A mudanca for apenas UI sem alteracao de endpoint ou payload.
- A mudanca for refactor interno que nao altera request, response ou query params.
