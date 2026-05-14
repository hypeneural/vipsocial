# apps/web/AGENTS.md

## Frontend React

Frontend em React 18 + Vite 5 + TypeScript + TanStack Query + shadcn/Radix + Tailwind.

## Regras

- Feature nova deve ficar preferencialmente em `src/features/{feature-name}`.
- Separar `api`, `hooks`, `types`, `utils` e `components`.
- Nao duplicar chamada HTTP em pagina se ja existir service ou hook.
- Usar TanStack Query para server state.
- Usar Zod + React Hook Form em formularios relevantes.
- Criar estados loading, error, empty e success.
- Nao introduzir `any` novo sem justificativa.
- Nao usar `require()` em codigo frontend moderno.
- Nao quebrar navegacao mobile.

## Validacao

- `pnpm lint`
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`

## Build Versionado

`dist` e versionado para deploy. Se a tarefa alterar o frontend e exigir build, mantenha os artefatos gerados no diff. Se a tarefa for apenas documentacao, scripts ou analise, nao rode build sem necessidade.
