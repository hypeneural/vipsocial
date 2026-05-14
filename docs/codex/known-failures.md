# Known Validation Failures

Use este arquivo para separar divida legada de regressao nova.

## Atual Em 2026-05-14

### `pnpm validate:web`

- Falha no lint legado: 76 errors e 44 warnings.
- Principais categorias: `no-explicit-any`, interfaces vazias, `require()` em config e warnings de hooks.
- Nao tratar como regressao se a tarefa nao tocar nos arquivos afetados.
- Se alterar arquivo com erro legado, corrigir apenas o escopo tocado quando viavel.

### `pnpm validate:gallery`

- Falha no lint legado: 4 errors e 7 warnings.

### `pnpm validate:api`

- `composer test` executa 217 tests; baseline observado: 215 passam e 2 falham.
- Falhas conhecidas:
  - `Tests\Feature\RoteirosTest > criar gaveta e adicionar noticia`: teste usa payload/rota antigos de gavetas.
  - `Tests\Feature\SocialTest > social dashboard returns cards with yesterday today and variation metrics`: teste depende da data atual e snapshots antigos.
- `vendor/bin/pint --test` tem baseline legado observado de 292 style issues e deve ser tratado em PR separado.

### `pnpm validate:contract`

- `pnpm api:generate-spec` gera `packages/api-contract/openapi.json`.
- `pnpm api:generate-client` falha porque o gerador de client TypeScript ainda nao esta configurado.

### `pnpm typecheck`

- `apps/api` typecheck passa.
- `gallery` typecheck passa.
- `apps/web` falha com erros TypeScript legados em widgets, testes/mocks, slideshow, feed filters, roteiros e services.

## Regra Para O Agente

- Nunca afirmar validacao completa enquanto houver falhas conhecidas.
- Separar claramente falha existente de falha introduzida.
- Nao limpar divida ampla dentro de PR de feature sem pedido explicito.
- Quando uma falha conhecida for resolvida, atualizar este arquivo no mesmo fechamento.
