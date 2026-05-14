# Validation Matrix

Use esta matriz para escolher validacoes sem afirmar cobertura maior que a executada.

## Antes De Validar

- Consultar `docs/codex/known-failures.md`.
- Separar falhas conhecidas de falhas introduzidas.
- Se a validacao falhar por divida conhecida, registrar no resumo final sem afirmar sucesso total.

## Alterou Apenas Docs

- Revisar links, caminhos e consistencia com `AGENTS.md`.
- Nao precisa build.
- Resumo final deve informar que nenhum teste tecnico foi necessario.

## Alterou `apps/api`

- `pnpm validate:api`
- `php artisan route:list` se alterou rotas
- `php artisan migrate:fresh --seed` se alterou migration critica e houver ambiente seguro para isso

## Alterou `apps/web`

- `pnpm validate:web`
- Se build alterar `apps/web/dist`, manter os artefatos quando a mudanca frontend for intencional.

## Alterou `gallery`

- `pnpm validate:gallery`

## Alterou Contrato API

- `pnpm validate:api`
- `pnpm api:generate-spec`
- `pnpm api:generate-client`
- `pnpm validate:web`
- Se `pnpm api:generate-client` falhar por gerador ainda nao configurado, nao afirmar client atualizado; registrar como pendencia conhecida.

## Alterou Permissoes Ou Autenticacao

- Testes de 401/403.
- Testes de ownership.
- Revisar `RoleAndPermissionSeeder`.
- Revisar Policy correspondente.

## Alterou Datas Ou Timezone

- Congelar tempo no teste ou calcular expectativa de forma deterministica.
- Banco em UTC.
- UI e regras editoriais usam `America/Sao_Paulo` quando aplicavel.

## Alterou Build, Workspace Ou Scripts

- `pnpm list -r --depth -1`
- `pnpm typecheck`
- Rodar validacoes focadas que nao gerem artefatos desnecessarios.
