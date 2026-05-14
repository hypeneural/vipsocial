---
name: vip-ai-prompts-feature
description: Use para implementar ou alterar Prompt Templates de I.A. no News Radar: CRUD backend, starter, favorite, reorder, track-use, variables, public_token, Prompt Manager, compilePrompt e modal operacional.
---

## Fonte De Verdade

- `docs/ai_prompts_templates_execution_plan.md` vence para o V1.
- Se `docs/ai_prompts_templates_architecture.md` divergir, atualize a arquitetura ao final.

## Decisoes V1

- Sem `slug`.
- Sem `is_active`.
- Arquivamento via SoftDeletes.
- `provider_target`: `generic`, `chatgpt`, `claude`.
- Backend nao compila prompt no V1.
- `public_token` obrigatorio no feed e no frontend.
- `track-use` apenas em acao final explicita.
- Deeplink acima de 1800 chars deve cair para copiar prompt.

## Backend

- Modulo `UserAiPrompts`.
- CRUD com ownership.
- Starter template com conflito 409 quando ja existir template ativo.
- Favorite transacional.
- Reorder 1..N.
- Variables e track-use testados.

## Frontend

- Feature em `src/features/ai-prompts`.
- Hooks TanStack Query.
- `prompt-template-utils.ts` central.
- Testes de `compilePrompt`.
- Manager em `/raspagem/config/prompts-ia`.
- Modal operacional integrado ao feed.

## Validacao

- `pnpm validate:api`
- `pnpm validate:web`
- Testes focados enquanto desenvolver.

## Nao Usar Quando

- A mudanca for em outro modulo de IA sem relacao com Prompt Templates do News Radar.
