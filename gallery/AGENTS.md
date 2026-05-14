# gallery/AGENTS.md

## Gallery

Este app e validado separadamente quando a tarefa tocar `gallery`.

## Regras

- Nao assumir que `pnpm test` raiz cobre apenas gallery; use `pnpm validate:gallery` para validacao completa da area.
- Manter componentes isolados e sem dependencia implicita de `apps/web`.
- Nao introduzir `any` novo sem justificativa.

## Validacao

- `pnpm lint`
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
