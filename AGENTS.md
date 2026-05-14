# AGENTS.md - VIPSocial Hub

## Objetivo

Este repositorio e o monorepo do VIPSocial Hub. Antes de implementar, entenda o escopo, localize o modulo existente mais parecido e siga os padroes do projeto.

## Stack

- Monorepo: pnpm workspaces + Turborepo.
- Backend: Laravel 12, PHP 8.2+, Sanctum, Spatie Permission, Spatie Activity Log, Spatie Query Builder, MySQL e filas.
- Frontend: React 18, Vite 5, TypeScript, TanStack Query, React Hook Form, Zod, shadcn/ui, Radix e Tailwind.
- API contract: Laravel Scramble/OpenAPI e client TypeScript quando configurado.

## Leia Antes De Criar Modulo Novo

- `docs/AI_GUIDE.md`
- `docs/codex/context-map.md`
- `docs/codex/known-failures.md`
- `docs/codex/decision-hierarchy.md`
- `docs/codex/validation-matrix.md`
- `docs/codex/review-checklist.md`

## Mapa De Contexto

Antes de explorar o repo inteiro, leia:

- `docs/codex/context-map.md` para localizar modulos, padroes e contratos.
- `docs/codex/known-failures.md` para separar divida conhecida de regressao nova.

## Hierarquia De Decisao

Se houver conflito entre docs, siga:

1. Pedido explicito da tarefa.
2. `AGENTS.md` mais proximo do diretorio alterado.
3. Plano de execucao especifico da feature, se existir.
4. `docs/AI_GUIDE.md`.
5. `docs/codex/*`.
6. README geral.
7. Codigo existente no modulo mais parecido.

## Baseline De Falhas

Antes de corrigir validacoes amplas, consulte `docs/codex/known-failures.md`.
Nao misture limpeza de divida legada com feature sem pedido explicito.

## Regras Globais

- Use pnpm para dependencias JavaScript. Nao crie novos `package-lock.json`, `yarn.lock` ou `bun.lock`.
- `apps/web/dist` e versionado para hospedagem. Nao edite arquivos gerados manualmente; se rodar build frontend como parte da tarefa, mantenha as mudancas de `dist` somente quando elas forem intencionais.
- Nao adicionar dependencia nova sem justificar no resumo final.
- Nao mascarar falha de teste, lint, typecheck ou build. Relate o comando e o erro.
- Antes de alterar arquitetura, procure o padrao existente no modulo mais proximo.
- Ao finalizar, liste arquivos alterados, validacoes executadas, falhas restantes e riscos.

## Comandos De Validacao

- Tudo: `pnpm validate`
- Web: `pnpm validate:web`
- Gallery: `pnpm validate:gallery`
- API: `pnpm validate:api`
- Contrato API: `pnpm validate:contract`

## Definicao De Pronto

Uma tarefa so esta pronta quando:

- A alteracao segue o padrao do modulo.
- Ha teste novo ou justificativa objetiva para nao ter teste.
- Lint, typecheck, testes e build relevantes foram executados ou a nao execucao foi justificada.
- O resumo final informa o que passou, o que falhou e o que nao foi executado.
