# apps/api/AGENTS.md

## Backend Laravel

Siga `docs/AI_GUIDE.md`. O modulo de referencia e `apps/api/app/Modules/Roteiros`.

## Estrutura Para Modulo Novo

- `Actions/`
- `DTOs/` quando necessario
- `Http/Controllers`
- `Http/Requests`
- `Http/Resources`
- `Models/`
- `Policies/`
- `Events/` quando houver evento de dominio
- `Jobs/` quando houver processamento assincrono
- `Services/` para integracoes externas
- `routes.php`
- `README.md` do modulo

## Regras

- Controller fino. Regra de negocio vai para Action ou Service.
- Nunca aceitar `user_id` vindo do request quando o escopo for usuario autenticado.
- Autorizacao via Policy ou `$user->can()`. Nunca usar `if ($user->role === 'admin')`.
- API deve usar envelope `{ success, data, message, meta }`.
- Banco em UTC. Responses em ISO 8601.
- Rotas especiais devem vir antes de `/{id}`.
- Use `whereNumber('id')` quando o parametro for numerico.
- Para arquivamento, prefira SoftDeletes quando for exclusao logica.

## Validacao Padrao

- Da raiz: `pnpm validate:api`

## Validacao Focada Durante Desenvolvimento

- Dentro de `apps/api`: `php artisan test --filter=NomeDoTeste`
- Dentro de `apps/api`: `php artisan route:list` quando alterar rotas.
- Dentro de `apps/api`: `vendor/bin/pint --test` para estilo focado ou antes de fechar.
