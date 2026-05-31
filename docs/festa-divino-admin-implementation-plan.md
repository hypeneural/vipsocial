# Plano De Implementacao - Modulo Admin Festa Do Divino

## Objetivo

Criar no VIPSocial Hub um modulo administrativo para gerir o site externo Festa do Divino, publicado em `festadodivinovip.com.br`, usando o banco MariaDB remoto do proprio site como fonte operacional.

O modulo deve entregar CRUDs organizados, com escrita protegida, auditoria local no VIP, testes por TDD e uma primeira fase read-only antes de qualquer mutacao no banco publico.

## Escopo Confirmado

Entram no modulo administrativo:

- Edicao da festa.
- Programacao, dias, categorias, locais, atracoes e vinculos evento-atracao.
- Cardapio: categorias e produtos.
- Noticias.
- Videos e shorts.
- Textos editoriais: Historia e Voce Sabia.
- FAQ: categorias e perguntas.
- Brinquedos do parque.
- Dashboard operacional, health check e auditoria das escritas.

Ficam fora:

- Galeria de fotos, porque sera integrada depois na estrutura da Cobertura VIP.
- Sorteios.
- Radio.
- Cameras.
- Barracas.
- Qualquer fluxo legado removido do banco remoto atual.

## Fontes Analisadas

- Repositorio VIPSocial Hub em `C:\laragon\www\vip`.
- Banco remoto MariaDB 10.6.25 em `186.209.113.134:3306`, banco `idespach_festad`.
- Site publicado e endpoints publicos em `https://festadodivinovip.com.br/api/v1/*`.
- Modulo de referencia do VIP: `apps/api/app/Modules/Roteiros`.
- Estrutura de rotas em `apps/api/app/Providers/ModuleServiceProvider.php`.
- Contrato de resposta em `apps/api/app/Support/Http/Controllers/BaseController.php`.
- Frontend autenticado em `apps/web/src/App.tsx`, `apps/web/src/services/api.ts`, `DesktopSidebar.tsx` e `MobileNav.tsx`.

Credenciais do banco nao devem ser salvas neste documento, em codigo, em testes ou em fixtures.

## Validacao Em Documentacao Oficial

Pontos confirmados antes deste plano:

- Laravel 12 suporta MariaDB 10.3 ou superior; o destino esta em MariaDB 10.6.25, entao esta dentro do suporte oficial.
- Laravel suporta multiplas conexoes de banco via `config/database.php` e uso explicito por `DB::connection(...)`.
- Transacoes devem ser executadas na conexao correta; `DB::connection('...')->transaction(...)` suporta rollback automatico por excecao e parametro de tentativas para deadlock.
- Laravel Validation suporta regras nativas como `Rule::exists`, `exists:connection.table,column`, `hex_color`, `url:http,https`, `after_or_equal`, `between`, `numeric` e `min`.
- API Resources devem normalizar os nomes legados do banco antes de expor payloads para o frontend VIP.
- Sanctum no Laravel tem modo SPA por cookie/CSRF e tambem fluxo por bearer token; o VIP atual usa servico axios com bearer token, entao o modulo deve seguir o modo ja usado no repositorio.
- Spatie Permission deve ser a base das permissoes de dominio; evitar checks diretos de role.
- Spatie Query Builder exige allowlists explicitas com `allowedFilters`, `allowedSorts` e `allowedIncludes`.
- TanStack Query recomenda invalidar queries relacionadas apos mutations.
- TanStack Query recomenda query keys em arrays serializaveis, incluindo variaveis como filtros, pagina e ID.
- shadcn/ui Data Table orienta a nao criar uma tabela unica rigida para todos os casos; cada data table costuma ter sorting, filtros e fontes proprias. O melhor e ter uma base reutilizavel e colunas/acoes por entidade.
- shadcn/ui Data Table usa TanStack Table e documenta a dependencia `@tanstack/react-table`. Esta dependencia ainda nao existe em `apps/web/package.json`, entao sua adicao precisa ser explicita e justificada.
- TanStack Table oferece tipos fortes para dados, colunas e cells, o que reduz risco em muitas tabelas CRUD.
- React Hook Form suporta mapear erros server-side com `setError`; isso deve ser usado para respostas 422 do Laravel.
- shadcn/ui documenta formularios com React Hook Form e Zod, combinando com o padrao indicado no repo.
- Zod permite mensagens customizadas por schema, util para formularios em portugues.
- Radix Dialog suporta modo modal, foco preso no modal, controle open/onOpenChange, `Title`, `Description` e fechamento com Esc; isso confirma o uso para confirmacoes de impacto publico.
- React Router 6 suporta lazy routes; o VIP ja usa `lazy()` e `Suspense` em `apps/web/src/App.tsx`.
- Scramble gera documentacao OpenAPI automaticamente a partir das rotas/controladores Laravel e deve entrar antes do frontend depender do contrato.

Referencias oficiais usadas:

- `https://laravel.com/docs/12.x/database`
- `https://laravel.com/docs/12.x/validation`
- `https://laravel.com/docs/12.x/eloquent-resources`
- `https://laravel.com/docs/12.x/sanctum`
- `https://spatie.be/docs/laravel-permission/v6/basic-usage/basic-usage`
- `https://spatie.be/docs/laravel-query-builder/v6/features/filtering`
- `https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation`
- `https://tanstack.com/query/v5/docs/framework/react/guides/query-keys`
- `https://tanstack.com/query/v5/docs/framework/react/guides/invalidations-from-mutations`
- `https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates`
- `https://tanstack.com/table/latest/docs/guide/data`
- `https://tanstack.com/table/latest/docs/guide/pagination`
- `https://react-hook-form.com/docs/useform/seterror`
- `https://ui.shadcn.com/docs/forms/react-hook-form`
- `https://ui.shadcn.com/docs/components/radix/data-table`
- `https://zod.dev/error-customization`
- `https://www.radix-ui.com/primitives/docs/components/dialog`
- `https://reactrouter.com/6.30.4/route/lazy`
- `https://scramble.dedoc.co/`

## Estado Atual Do Banco Remoto

O banco remoto esta mais enxuto que o dump antigo `igreja_tijucas.sql`. Tabelas de fotos, sorteio, cameras, radio e barracas nao existem no banco remoto atual.

### Tabelas E Volumes

| Tabela | Registros | Papel |
| --- | ---: | --- |
| `Edicao_Festa` | 1 | Edicao/ano da festa |
| `Programacao_Eventos` | 28 | Eventos da programacao publica |
| `Categorias_Evento` | 8 | Categorias de evento |
| `Locais_Festa` | 5 | Locais usados na programacao |
| `Atracoes` | 10 | Atracoes vinculaveis |
| `Evento_Atracao` | 10 | Associacao evento-atracao |
| `dias_festa_evento` | 0 | Dias editoriais da festa, hoje vazio |
| `categoria` | 3 | Categorias do cardapio |
| `produto` | 4 | Produtos do cardapio |
| `noticias_festa` | 2 | Noticias exibidas no site |
| `youtube_videos` | 2 | Videos horizontais do YouTube |
| `shorts_videos` | 2 | Shorts do YouTube |
| `divino_textos` | 5 | Textos de Historia/Voce Sabia |
| `faq_category` | 4 | Categorias do FAQ |
| `faq_item` | 5 | Perguntas do FAQ |
| `brinquedos` | 4 | Brinquedos ativos no parque |
| `users` | 0 | Auth legado do site externo, fora do admin VIP |
| `personal_access_tokens` | 0 | Sanctum legado do site externo, fora do admin VIP |
| `sessions` | 6 | Sessao Laravel do site externo, fora do CRUD |
| `cache`, `cache_locks` | 0 | Infra Laravel do site externo |
| `jobs`, `job_batches`, `failed_jobs` | 0 | Infra Laravel do site externo |
| `migrations` | 12 | Controle de schema do site externo |
| `password_reset_tokens` | 0 | Infra auth do site externo |

### Permissoes Do Usuario Atual

A validacao do banco remoto mostrou que o usuario atual tem privilegios amplos no schema, incluindo `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `DROP`, `ALTER`, `INDEX`, `TRIGGER` e rotinas.

Isso e inadequado para a aplicacao em producao. Antes de liberar escrita pelo VIP, criar usuarios separados:

- `festa_divino_read`: somente `SELECT`.
- `festa_divino_write`: `SELECT`, `INSERT`, `UPDATE` e `DELETE` apenas se aprovado por politica de dominio.

DDL (`CREATE`, `DROP`, `ALTER`) deve ficar fora dos usuarios usados pela aplicacao. Migrations no banco externo devem ser uma operacao manual/controlada ou rodar com credencial temporaria de manutencao.

### Relacionamentos Reais

| Origem | Coluna | Destino | Coluna |
| --- | --- | --- | --- |
| `Programacao_Eventos` | `id_edicao_festa` | `Edicao_Festa` | `id_edicao` |
| `Programacao_Eventos` | `id_local` | `Locais_Festa` | `id_local` |
| `Programacao_Eventos` | `id_categoria` | `Categorias_Evento` | `id_categoria` |
| `Evento_Atracao` | `id_evento` | `Programacao_Eventos` | `id_evento` |
| `Evento_Atracao` | `id_atracao` | `Atracoes` | `id_atracao` |
| `dias_festa_evento` | `id_edicao` | `Edicao_Festa` | `id_edicao` |
| `produto` | `id_categoria` | `categoria` | `id_categoria` |
| `faq_item` | `category_id` | `faq_category` | `id` |

Nao foram encontrados orfaos nas relacoes principais:

- Eventos sem local: 0.
- Eventos sem categoria: 0.
- Eventos sem edicao: 0.
- Vinculos evento-atracao sem evento: 0.
- Vinculos evento-atracao sem atracao: 0.
- Produtos sem categoria: 0.
- FAQ sem categoria: 0.

### Indices Relevantes

- `Programacao_Eventos`: `idx_data_hora (data_evento, hora_inicio)`, indices por edicao, local e categoria.
- `Atracoes`: `idx_nome_atracao`.
- `brinquedos`: `idx_brinquedos_active_nome (active, nome)`.
- `divino_textos`: indices por `categoria` e `criado_em`.
- `faq_category`: `idx_faq_category_active_order (is_active, display_order)`.
- `faq_item`: `idx_faq_item_public_order (is_active, category_id, display_order)`.
- `noticias_festa`: `idx_data_hora_publicacao`.
- `youtube_videos`: `idx_youtube_videos_create_at`.
- `shorts_videos`: `idx_shorts_videos_created_at`.

### Distribuicao Dos Dados

Programacao por categoria:

| Categoria | Eventos |
| --- | ---: |
| Missa | 10 |
| Show Musical | 8 |
| Cortejo Imperial | 4 |
| Atividade Recreativa | 2 |
| Anuncio Oficial | 1 |
| Apresentacao Cultural | 1 |
| Bingo | 1 |
| Gastronomia | 1 |

Programacao por data:

| Data | Eventos | Ativos | Destaques |
| --- | ---: | ---: | ---: |
| 2026-05-31 | 1 | 1 | 0 |
| 2026-06-01 | 1 | 1 | 0 |
| 2026-06-02 | 1 | 1 | 0 |
| 2026-06-03 | 1 | 1 | 0 |
| 2026-06-04 | 1 | 1 | 0 |
| 2026-06-05 | 3 | 3 | 0 |
| 2026-06-06 | 5 | 5 | 2 |
| 2026-06-07 | 10 | 10 | 4 |
| 2026-06-08 | 5 | 5 | 2 |

Outras verificacoes:

- 18 eventos nao possuem atracao vinculada. Isso deve aparecer como alerta informativo, nao como erro.
- `Programacao_Eventos.tags` esta com JSON valido em todos os registros.
- `dias_festa_evento` esta vazio, embora exista FK para `Edicao_Festa`.
- FAQ possui 4 categorias ativas e 5 perguntas ativas.
- Cardapio possui 3 categorias e 4 produtos.

### Implicacoes Do Schema Para Os CRUDs

O tipo real das colunas confirma algumas decisoes de implementacao:

- `Programacao_Eventos.tags` e `longtext`, nao coluna JSON. O model pode castar para array se o conteudo for JSON valido, mas o FormRequest deve garantir JSON/array antes de persistir.
- `Programacao_Eventos.data_atualizacao` tem `on update current_timestamp()`. Isso pode apoiar controle otimista em edicao de evento.
- `youtube_videos.id` e `varchar(20)`; `shorts_videos.id` e `varchar(64)`. Validacao de YouTube ID deve respeitar esses limites por entidade.
- `noticias_festa.url_noticia` e `url_thumb` aceitam ate 512 caracteres; formularios e validation devem usar limite maior que 255 nesses campos.
- `brinquedos.video` e `brinquedos.thumb_url` sao obrigatorios. O form nao pode permitir salvar brinquedo sem midia.
- `produto.preco` e `decimal(10,2)`. Usar parser de moeda e enviar decimal com ponto para API.
- `Locais_Festa.latitude` e `decimal(10,8)`, `longitude` e `decimal(11,8)`. Validar range e precisao.
- `faq_item.id` e `bigint unsigned`, diferente dos demais IDs inteiros. Tipos TypeScript devem aceitar `number`, mas backend deve validar como integer sem assumir int32.
- `dias_festa_evento` tem timestamps padrao, mas esta vazio. Tratar CRUD de dias como baixa prioridade e read-only inicial ate confirmar uso no site publico.
- Tabelas sem campo ativo (`noticias_festa`, `youtube_videos`, `shorts_videos`, `divino_textos`, `produto`) exigem politica especial de delete ou proposta futura de coluna `ativo`.

## Como O Site Atual Funciona

O site publicado e um PWA React que consome endpoints Laravel do proprio projeto externo. Endpoints publicos observados:

- `GET /api/v1/app/config`
- `GET /api/v1/programacao`
- `GET /api/v1/programacao/filtros`
- `GET /api/v1/cardapio`
- `GET /api/v1/noticias`
- `GET /api/v1/videos`
- `GET /api/v1/shorts`
- `GET /api/v1/faq`
- `GET /api/v1/brinquedos`
- `GET /api/v1/historia`

O endpoint `app/config` ativa no menu publico:

- Programacao.
- Cardapio.
- Noticias.
- Videos.
- Shorts.
- Historia.
- Voce Sabia.
- FAQ.
- Brinquedos.

Fotos aparece como modulo reservado/desativado na arquitetura externa e nao deve entrar nesta entrega. Sorteio, cameras, radio e barracas nao fazem parte do banco remoto atual.

## Padrao De Implementacao No VIP

Backend:

- Modulos ficam em `apps/api/app/Modules/{Module}`.
- O modulo de referencia e `Roteiros`.
- Rotas sao carregadas por `ModuleServiceProvider` com prefixo `api/v1`.
- Rotas administrativas usam `auth:sanctum`.
- Controllers devem extender `BaseController` quando seguirem o padrao atual do VIP.
- Autorizacao deve usar Spatie Permission via FormRequest, Policy ou middleware.
- Respostas usam envelope `success`, `data`, `message` e `meta`.
- Listagens devem usar Spatie Query Builder com allowlists explicitas.

Frontend:

- Rotas autenticadas ficam em `apps/web/src/App.tsx` dentro de `ProtectedRoute`.
- Menu desktop/mobile fica em componentes de layout, com `requiredPermission`.
- Servicos usam `apps/web/src/services/api.ts`.
- Server state usa TanStack Query.
- Formularios novos devem usar React Hook Form + Zod.
- UI deve seguir shadcn/ui, Radix, Tailwind e lucide-react.

### Analise Das Telas Administrativas Atuais

O frontend atual ainda mistura dois estilos:

- Telas em `apps/web/src/pages/*`, que e o padrao dominante atual.
- Features novas em `apps/web/src/features/*`, usadas quando ha logica reutilizavel ou dominio mais isolado.

Padroes que devem ser mantidos:

- `AppShell` como moldura administrativa.
- Lazy imports no `App.tsx` com `Suspense` e `ShimmerPage`.
- Menu desktop/mobile com `requiredPermission`.
- `api.ts` central com bearer token e interceptors 401/403/404/422.
- Query key factory por dominio, como `enqueteKeys` e `alertKeys`.
- Mutations invalidando queries relacionadas e exibindo toast.
- Estados loading, error e empty visiveis nas paginas.
- `ConfirmDialog`/Radix para acoes destrutivas.
- Cards densos, filtros no topo, badges de status e acoes por linha/card.

Pontos a melhorar no modulo novo:

- Evitar arquivos gigantes como alguns forms administrativos atuais; separar page, form, schema, mapper, api, query e mutations.
- Evitar um `festaDivino.service.ts` unico enorme; separar chamadas por entidade.
- Nao criar um `EntityDataTable` magico e rigido; criar uma base de tabela e deixar colunas/filtros/acoes em cada entidade.
- Usar React Hook Form + Zod desde o inicio, em vez de muitos `useState` para forms grandes.
- Colocar filtros/paginacao/sort na URL para permitir refresh e compartilhamento do contexto.
- Criar helper unico para aplicar erros 422 do Laravel com `setError`.
- Esconder acoes no frontend por permissao, mesmo mantendo o backend como barreira real.
- Como `@tanstack/react-table` ainda nao esta instalado, decidir na Fase 2:
  - adicionar `@tanstack/react-table` com justificativa, porque o modulo tera muitas tabelas server-side; ou
  - manter uma tabela manual baseada em `components/ui/table`, preservando a mesma interface de `CrudDataTable` para migrar depois.

## Decisao De Arquitetura

### Nome Do Modulo

Usar `FestaDivino` no backend e `festa-divino` no frontend.

Motivos:

- Evita confundir com o projeto externo inteiro.
- Agrupa CRUDs administrativos que compartilham a mesma integracao externa.
- Permite separar no futuro a area de fotos/Cobertura VIP sem quebrar este modulo.

### Conexoes De Banco

Adicionar duas conexoes dedicadas em `apps/api/config/database.php`:

```php
'festa_divino_read' => [
    'driver' => 'mariadb',
    'host' => env('FESTA_DIVINO_READ_DB_HOST'),
    'port' => env('FESTA_DIVINO_READ_DB_PORT', '3306'),
    'database' => env('FESTA_DIVINO_READ_DB_DATABASE'),
    'username' => env('FESTA_DIVINO_READ_DB_USERNAME'),
    'password' => env('FESTA_DIVINO_READ_DB_PASSWORD'),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'strict' => true,
],

'festa_divino_write' => [
    'driver' => 'mariadb',
    'host' => env('FESTA_DIVINO_WRITE_DB_HOST'),
    'port' => env('FESTA_DIVINO_WRITE_DB_PORT', '3306'),
    'database' => env('FESTA_DIVINO_WRITE_DB_DATABASE'),
    'username' => env('FESTA_DIVINO_WRITE_DB_USERNAME'),
    'password' => env('FESTA_DIVINO_WRITE_DB_PASSWORD'),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'strict' => true,
],
```

Regras:

- Models legados usam leitura por padrao.
- Actions de escrita nunca usam a conexao principal do VIP.
- Actions de escrita usam sempre `DB::connection('festa_divino_write')`.
- Testes unitarios/feature nao devem depender do banco remoto.
- Testes contra o banco remoto devem ser opt-in e nunca rodar no CI padrao.
- Variaveis `.env.example` devem existir sem valores reais.

### Guard Obrigatorio De Escrita

`FESTA_DIVINO_WRITE_ENABLED=false` ajuda, mas nao basta. A protecao principal deve ser privilegio de banco com usuarios separados. A protecao de aplicacao deve ser uma segunda camada obrigatoria.

Criar `FestaDivinoWriteGuard`:

```php
final class FestaDivinoWriteGuard
{
    public static function assertCanWrite(): void
    {
        abort_unless(config('festa-divino.write_enabled'), 423, 'Festa do Divino esta em modo somente leitura.');
    }
}
```

Toda action de mutacao deve chamar o guard antes da transacao:

```php
FestaDivinoWriteGuard::assertCanWrite();

return DB::connection('festa_divino_write')->transaction(function () use ($data) {
    // escrita no banco externo
}, attempts: 3);
```

Essa transacao precisa rodar na conexao externa, nao na conexao principal do VIP.

### Auditoria Local

Criar tabela no banco principal do VIP, nao no banco remoto:

`festa_divino_audit_logs`

Campos:

- `id`
- `user_id`
- `action`
- `entity_type`
- `entity_id`
- `old_values` JSON nullable
- `new_values` JSON nullable
- `remote_connection`
- `request_id` nullable
- `ip_address` nullable
- `user_agent` nullable
- `created_at`

Regras:

- Toda escrita bem sucedida no banco externo gera auditoria no VIP.
- Falhas relevantes de escrita podem gerar log tecnico separado se o padrao atual do projeto permitir.
- Nao gravar credenciais, tokens ou segredos em auditoria.
- A tela de auditoria deve mostrar diff legivel por entidade.

## Contrato De Models Legados

Todo model legado deve declarar explicitamente:

- `$connection`, preferencialmente leitura por padrao.
- `$table`.
- `$primaryKey`.
- `$keyType` e `$incrementing` quando o PK nao for inteiro auto-incremental.
- `CREATED_AT` e `UPDATED_AT` quando nomes forem customizados.
- `$timestamps = false` quando a tabela nao tiver timestamps Laravel.
- `$casts` para booleanos, datas, decimal e JSON.
- `$fillable` allowlist, nunca `$guarded = []` em model editavel.

| Model | Tabela | PK | Timestamps/Casts criticos |
| --- | --- | --- | --- |
| `EdicaoFesta` | `Edicao_Festa` | `id_edicao` | timestamps false; datas de inicio/fim |
| `ProgramacaoEvento` | `Programacao_Eventos` | `id_evento` | `CREATED_AT=data_criacao`, `UPDATED_AT=data_atualizacao`; `tags` array; flags bool; `valor_ingresso` decimal |
| `CategoriaEvento` | `Categorias_Evento` | `id_categoria` | timestamps false; `cor_categoria` string hex |
| `LocalFesta` | `Locais_Festa` | `id_local` | timestamps false; latitude/longitude decimal |
| `Atracao` | `Atracoes` | `id_atracao` | timestamps false |
| `EventoAtracao` | `Evento_Atracao` | `id_evento_atracao` | timestamps false |
| `CategoriaCardapio` | `categoria` | `id_categoria` | timestamps false |
| `Produto` | `produto` | `id_produto` | timestamps false; `preco` decimal |
| `NoticiaFesta` | `noticias_festa` | `id_noticia` | `data_hora_publicacao` datetime; `data_cadastro` datetime |
| `YoutubeVideo` | `youtube_videos` | `id` | string PK, incrementing false; `CREATED_AT=create_at`, `UPDATED_AT=update_at` |
| `ShortVideo` | `shorts_videos` | `id` | string PK, incrementing false; timestamps padrao |
| `DivinoTexto` | `divino_textos` | `id` | `CREATED_AT=criado_em`, `UPDATED_AT=atualizado_em` |
| `FaqCategory` | `faq_category` | `id` | `is_active` bool; `display_order` int |
| `FaqItem` | `faq_item` | `id` | `is_active` bool; `display_order` int |
| `Brinquedo` | `brinquedos` | `id` | `active` bool; timestamps padrao |

## Validacoes E FormRequests

Validacao deve ficar no backend como fonte de verdade. Zod no frontend melhora UX, mas nao substitui Laravel FormRequest.

Regras especificas:

- FK em banco externo com `Rule::exists('festa_divino_read.Tabela', 'coluna')`.
- URLs publicas com `url:http,https`.
- Cores com `hex_color`.
- Datas de fim com `after_or_equal:data_inicio`.
- Latitude com `numeric|between:-90,90`.
- Longitude com `numeric|between:-180,180`.
- Preco com `numeric|min:0`.
- `tags` como array de strings, persistido como JSON.
- ID do YouTube com regex allowlist de caracteres `[A-Za-z0-9_-]`, sem URL completa e sem querystring.
- Campos de status booleanos usando cast e validacao booleana.

Erros 422 devem retornar o formato Laravel atual e o frontend deve mapear campo a campo com `setError`.

## Politica De Delete E Publicacao

Politica recomendada para v1:

- Preferir toggle quando existir campo de status: `ativo`, `active`, `is_active`, `evento_destaque`.
- Bloquear delete de entidades com dependentes e retornar 409.
- Programacao, FAQ, brinquedos e categorias devem ter delete conservador.
- Para entidades sem campo ativo, como `noticias_festa`, `youtube_videos`, `shorts_videos` e `divino_textos`, liberar delete fisico apenas com permissao especifica `festa-divino.delete` e confirmacao explicita de impacto publico.
- Antes de adicionar coluna `ativo` no banco externo, criar proposta separada de migration, backup e validacao do site publico.

## Health Check Operacional

Criar `GET /api/v1/festa-divino/health`, autenticado, com permissao `festa-divino.health`.

Resposta sugerida:

- status geral: `ok`, `degraded` ou `down`.
- modo: `read_only` ou `write_enabled`.
- latencia da conexao read.
- latencia da conexao write quando configurada.
- versao MariaDB.
- existencia das tabelas esperadas.
- resumo de privilegios detectados sem expor segredo.
- data da ultima auditoria de escrita.
- alertas: usuario com privilegio DDL, tabela esperada ausente, tabela vazia relevante, FK orphan, JSON invalido.

## API Backend Proposta

Todas sob `api/v1`, com `auth:sanctum`.

```text
GET    /festa-divino/dashboard
GET    /festa-divino/health
GET    /festa-divino/audit-logs

GET    /festa-divino/edicoes
POST   /festa-divino/edicoes
GET    /festa-divino/edicoes/{id}
PUT    /festa-divino/edicoes/{id}
DELETE /festa-divino/edicoes/{id}

GET    /festa-divino/programacao/eventos
POST   /festa-divino/programacao/eventos
GET    /festa-divino/programacao/eventos/{id}
PUT    /festa-divino/programacao/eventos/{id}
DELETE /festa-divino/programacao/eventos/{id}
PATCH  /festa-divino/programacao/eventos/{id}/status
PUT    /festa-divino/programacao/eventos/{id}/atracoes

GET    /festa-divino/programacao/categorias
POST   /festa-divino/programacao/categorias
PUT    /festa-divino/programacao/categorias/{id}
DELETE /festa-divino/programacao/categorias/{id}

GET    /festa-divino/programacao/locais
POST   /festa-divino/programacao/locais
PUT    /festa-divino/programacao/locais/{id}
DELETE /festa-divino/programacao/locais/{id}

GET    /festa-divino/programacao/atracoes
POST   /festa-divino/programacao/atracoes
PUT    /festa-divino/programacao/atracoes/{id}
DELETE /festa-divino/programacao/atracoes/{id}

GET    /festa-divino/cardapio/categorias
POST   /festa-divino/cardapio/categorias
PUT    /festa-divino/cardapio/categorias/{id}
DELETE /festa-divino/cardapio/categorias/{id}

GET    /festa-divino/cardapio/produtos
POST   /festa-divino/cardapio/produtos
GET    /festa-divino/cardapio/produtos/{id}
PUT    /festa-divino/cardapio/produtos/{id}
DELETE /festa-divino/cardapio/produtos/{id}

GET    /festa-divino/conteudo/noticias
POST   /festa-divino/conteudo/noticias
PUT    /festa-divino/conteudo/noticias/{id}
DELETE /festa-divino/conteudo/noticias/{id}

GET    /festa-divino/conteudo/textos
POST   /festa-divino/conteudo/textos
PUT    /festa-divino/conteudo/textos/{id}
DELETE /festa-divino/conteudo/textos/{id}

GET    /festa-divino/midia/videos
POST   /festa-divino/midia/videos
PUT    /festa-divino/midia/videos/{id}
DELETE /festa-divino/midia/videos/{id}

GET    /festa-divino/midia/shorts
POST   /festa-divino/midia/shorts
PUT    /festa-divino/midia/shorts/{id}
DELETE /festa-divino/midia/shorts/{id}

GET    /festa-divino/faq/categorias
POST   /festa-divino/faq/categorias
PUT    /festa-divino/faq/categorias/{id}
DELETE /festa-divino/faq/categorias/{id}
PUT    /festa-divino/faq/categorias/reorder

GET    /festa-divino/faq/items
POST   /festa-divino/faq/items
PUT    /festa-divino/faq/items/{id}
DELETE /festa-divino/faq/items/{id}
PUT    /festa-divino/faq/items/reorder

GET    /festa-divino/brinquedos
POST   /festa-divino/brinquedos
PUT    /festa-divino/brinquedos/{id}
DELETE /festa-divino/brinquedos/{id}
PATCH  /festa-divino/brinquedos/{id}/status
```

## Estrutura Backend Proposta

```text
apps/api/app/Modules/FestaDivino/
  Actions/
    Shared/
      FestaDivinoWriteGuard.php
      AuditFestaDivinoWriteAction.php
    Programacao/
      CreateEventoAction.php
      UpdateEventoAction.php
      SyncEventoAtracoesAction.php
      DeleteEventoAction.php
    Cardapio/
    Conteudo/
    Faq/
    Brinquedos/
  Http/
    Controllers/
      DashboardController.php
      HealthController.php
      AuditLogController.php
      EdicaoFestaController.php
      DiaFestaEventoController.php
      ProgramacaoEventoController.php
      ProgramacaoCategoriaController.php
      ProgramacaoLocalController.php
      AtracaoController.php
      CardapioCategoriaController.php
      ProdutoController.php
      NoticiaController.php
      VideoController.php
      ShortController.php
      TextoController.php
      FaqCategoryController.php
      FaqItemController.php
      BrinquedoController.php
    Requests/
    Resources/
  Models/
  Policies/
  Queries/
  routes.php
  README.md
```

## CRUDs Detalhados

### Edicao Da Festa

Tabela: `Edicao_Festa`.

Campos principais:

- `ano_festa`, `titulo_festa`.
- `data_inicio_programacao`, `data_fim_programacao`.
- `data_inicio_festejos`, `data_fim_festejos`.
- `bandeireira_imperial`, `comissao_organizadora`, `texto_convite_principal`.
- `imagem_cartaz_url`, `tema_geral_festa`.

Regras:

- Validar inicio menor ou igual ao fim.
- Impedir remover edicao com eventos ou dias vinculados.
- Definir edicao ativa por maior `ano_festa`, seguindo o comportamento publico atual.
- Alertar se `dias_festa_evento` estiver vazio na edicao ativa.
- Escrever sempre na conexao externa de escrita, dentro de transacao com retry.
- Auditar `create`, `update` e `delete` na tabela local `festa_divino_audit_logs`.

TDD:

- 401 sem autenticacao.
- 403 sem permissao.
- `store` cria edicao valida.
- `store` rejeita fim antes do inicio.
- `update` persiste campos editoriais.
- `destroy` retorna 409 com eventos ou dias vinculados.
- Auditoria registra payload old/new sem credenciais.

### Programacao - Dias Da Festa

Tabela: `dias_festa_evento`.

Campos principais:

- `id_edicao`.
- `data_evento`.
- `nome_principal_evento_dia`.
- `descricao_dia`.
- `created_at`, `updated_at`.

Regras:

- Validar edicao na conexao externa read.
- Validar `data_evento` dentro do periodo de programacao da edicao.
- Escrever sempre na conexao externa de escrita, dentro de transacao com retry.
- Delete fisico permitido porque hoje nao ha dependentes diretos no schema, mas sempre auditado.
- Manter relacionamento com `Edicao_Festa` para frontend mostrar contexto do ano.

TDD:

- Listagem read-only com include de edicao.
- `store` respeita write guard.
- `store` rejeita edicao inexistente e data fora do periodo.
- `update` altera data, nome e descricao.
- `destroy` remove registro e gera auditoria.

### Programacao - Eventos

Tabela: `Programacao_Eventos`.

Campos principais:

- `id_edicao_festa`, `id_local`, `id_categoria`.
- `titulo_evento`, `subtitulo_evento`, `descricao_geral_evento`.
- `data_evento`, `hora_inicio`, `hora_fim`, `duracao_estimada_minutos`.
- `tema_evento`, `publico_alvo`.
- `evento_pago`, `valor_ingresso`, `link_ingresso`, `observacao_ingresso`.
- `evento_destaque`, `imagem_destaque_url`, `organizador_responsavel`.
- `tags`, `ativo`.

Regras:

- Validar FKs na conexao externa read.
- Validar `hora_fim` maior que `hora_inicio` quando ambos existirem.
- Calcular `duracao_estimada_minutos` quando possivel.
- `evento_pago=true` exige `valor_ingresso` ou `observacao_ingresso`.
- `link_ingresso` e `imagem_destaque_url` devem ser URL http(s).
- `tags` deve ser array de strings e persistir JSON.
- Criar/atualizar evento e atracoes dentro de transacao externa.
- Delete fisico somente com permissao e confirmacao; preferir `ativo=false`.

TDD:

- Lista com filtros por edicao, data, categoria, local, destaque, ativo e busca.
- Cria evento minimo.
- Rejeita FK inexistente.
- Rejeita `tags` invalido.
- Atualiza evento.
- Sincroniza atracoes sem duplicidade.
- Toggle altera apenas `ativo`.
- Delete respeita politica e gera auditoria.

### Programacao - Categorias

Tabela: `Categorias_Evento`.

Campos:

- `nome_categoria`.
- `descricao_categoria`.
- `icone_categoria`.
- `cor_categoria`.

Regras:

- `cor_categoria` deve ser `hex_color`.
- Bloquear exclusao quando houver eventos.
- Expor `eventos_count`.
- Considerar coluna de ordem em fase posterior, se o site publico precisar.

TDD:

- Lista com contagem.
- Cria categoria.
- Rejeita cor invalida.
- Bloqueia exclusao com eventos.

### Programacao - Locais

Tabela: `Locais_Festa`.

Campos:

- `nome_local`, `endereco_local`.
- `latitude`, `longitude`.
- `descricao_local`, `imagem_local_url`, `acessibilidade_info`.

Regras:

- Latitude entre -90 e 90.
- Longitude entre -180 e 180.
- Imagem como URL http(s) ou path publico permitido.
- Bloquear exclusao quando houver eventos.

TDD:

- Cria local valido.
- Rejeita latitude/longitude fora do range.
- Bloqueia exclusao com eventos.

### Programacao - Atracoes E Vinculos

Tabelas: `Atracoes`, `Evento_Atracao`.

Regras:

- Bloquear exclusao de atracao vinculada, exceto action explicita de remocao de vinculos.
- Sincronizacao aceita lista ordenada.
- Impedir duplicidade da mesma atracao no mesmo evento.
- Eventos sem atracao aparecem como alerta informativo.

TDD:

- Cria atracao.
- Lista com contagem de eventos.
- Sincroniza atracoes em transacao externa.
- Rejeita duplicidade.
- Preserva ordenacao.

### Cardapio

Tabelas: `categoria`, `produto`.

Regras:

- `preco` decimal maior ou igual a 0.
- `foto` como URL http(s) ou path publico permitido.
- Bloquear exclusao de categoria com produtos.
- Como nao ha campo `ativo`, delete de produto deve exigir confirmacao de impacto publico.
- Considerar campos `ativo` e `display_order` em fase posterior.

TDD:

- Lista categorias com produtos e contagem.
- Cria produto com preco decimal.
- Rejeita preco negativo.
- Bloqueia categoria com produtos.
- Atualiza foto.

### Noticias

Tabela: `noticias_festa`.

Regras:

- `url_noticia` e `url_thumb` como URL http(s).
- Ordenar por `data_hora_publicacao`.
- Preservar `data_cadastro` na criacao.
- Sem campo `ativo`: delete fisico so com permissao especifica e confirmacao.
- Propor coluna `ativo` em fase futura se o cliente precisar ocultar sem apagar.

TDD:

- Lista paginada.
- Cria noticia valida.
- Rejeita URL invalida.
- Atualiza texto e thumb.
- Delete segue politica e auditoria.

### Videos E Shorts

Tabelas: `youtube_videos`, `shorts_videos`.

Regras:

- `id` e ID publico do YouTube, nao URL.
- Validar ID por regex allowlist.
- Rejeitar querystring, parametro `si` e URL completa.
- `thumb_url` como URL http(s) ou null para fallback.
- Derivar `watchUrl` e `embedUrl` no Resource.
- `youtube_videos` usa timestamps `create_at` e `update_at`.

TDD:

- Cria video/short valido.
- Rejeita URL completa.
- Lista ordenado por data.
- Atualiza thumb.
- Delete segue politica e auditoria.

### Textos Editoriais

Tabela: `divino_textos`.

Regras:

- Normalizar categorias para evitar duplicidade por acento/caixa.
- Allowlist inicial: `Historia`, `Cultura local`, `Curiosidade local`, `Rituais`.
- Atualizar `atualizado_em` em toda edicao.
- Sem campo `ativo`: delete fisico so com permissao especifica e confirmacao.

TDD:

- Lista por categoria.
- Cria texto.
- Rejeita categoria fora da allowlist.
- Atualiza `atualizado_em`.

### FAQ

Tabelas: `faq_category`, `faq_item`.

Regras:

- Bloquear exclusao de categoria com itens.
- Reorder para categorias e perguntas.
- Toggle `is_active`.
- Pergunta e resposta obrigatorias.
- Reorder com transacao externa e lock quando necessario.

TDD:

- Lista categorias com contagem.
- Cria categoria.
- Cria item em categoria existente.
- Rejeita item sem categoria.
- Reorder atualiza `display_order`.
- Toggle oculta item do publico.

### Brinquedos

Tabela: `brinquedos`.

Regras:

- `video` como path `/assets/videos/*.mp4` ou URL permitida.
- `thumb_url` como path `/assets/images/*` ou URL http(s).
- Toggle `active`.
- Preview no admin para video/thumb.

TDD:

- Lista com filtro ativo/inativo.
- Cria brinquedo.
- Rejeita video fora do formato permitido.
- Toggle muda `active`.
- Update atualiza `updated_at`.

## Dashboard Administrativo

Criar `GET /festa-divino/dashboard` com:

- Contagem por tabela de dominio.
- Edicao ativa.
- Eventos por data.
- Eventos por categoria.
- Eventos em destaque.
- Eventos sem atracao.
- Categorias sem eventos.
- Locais sem eventos.
- Produtos por categoria.
- FAQs ativas/inativas.
- Textos por categoria.
- URLs nulas/importantes.
- Integridade: orfaos, tags JSON invalidas, ranges de data inconsistentes.
- Modo de escrita e estado do health check.

TDD:

- Retorna contagens basicas.
- Detecta evento sem atracao.
- Detecta tags invalidas em fixture local.
- Detecta categoria vazia.
- Exige `festa-divino.view`.

## Permissoes

Adicionar no `RoleAndPermissionSeeder` permissoes por dominio:

- `festa-divino.view`
- `festa-divino.health`
- `festa-divino.audit.view`
- `festa-divino.programacao.manage`
- `festa-divino.cardapio.manage`
- `festa-divino.conteudo.manage`
- `festa-divino.faq.manage`
- `festa-divino.brinquedos.manage`
- `festa-divino.publish`
- `festa-divino.delete`
- `festa-divino.write`

Mapeamento:

- `view`: dashboard e listagens.
- `health`: tela/endpoint de saude.
- `audit.view`: historico de escritas.
- `*.manage`: criacao e edicao por dominio.
- `publish`: toggles de `ativo`, `active`, `is_active` e destaque.
- `delete`: exclusao fisica permitida pela politica.
- `write`: camada adicional para qualquer mutation.

Roles sugeridos:

- `admin`: todas.
- `editor`: view, manage por dominio, publish.
- `journalist`: view e conteudo.manage, se a regra do produto permitir.
- `analyst`: view, health e audit.view.

Evitar checks diretos de `role === admin` em codigo novo.

## Telas E Componentes Frontend

### Estrategia

O frontend do modulo deve ser um mini-admin por dominio, nao uma colecao de CRUDs repetidos. A regra recomendada e:

- Paginas finas.
- Componentes compartilhados de UI.
- Configuracao por entidade.
- Hooks tipados por dominio.
- Mappers explicitos entre API, formulario e payload.
- Query keys centralizadas.

Nao criar um CRUD generico magico. Componentes em `shared` nao devem conhecer regras de programacao, cardapio, FAQ ou brinquedos. Se um componente conhece regra de dominio, ele fica dentro da pasta da entidade.

### Estrutura Recomendada

```text
apps/web/src/features/festa-divino/
  core/
    festaDivino.api.ts
    festaDivino.queryKeys.ts
    festaDivino.permissions.ts
    festaDivino.errors.ts
    festaDivino.mappers.ts
    festaDivino.types.ts

  shared/
    components/
      RemoteWriteModeBanner.tsx
      PublicSiteImpactBanner.tsx
      CrudPageHeader.tsx
      CrudDataTable.tsx
      CrudTableToolbar.tsx
      CrudPagination.tsx
      CrudRowActions.tsx
      ConfirmPublicImpactDialog.tsx
      UrlPreview.tsx
      MediaPreview.tsx
      StatusBadge.tsx
      BooleanStatusSwitch.tsx
      LoadingTableSkeleton.tsx
      EmptyState.tsx
      ErrorState.tsx
    fields/
      MoneyField.tsx
      DateField.tsx
      TimeField.tsx
      DateTimeFields.tsx
      ColorHexField.tsx
      UrlFieldWithPreview.tsx
      RelationSelectField.tsx
      TagsFieldArray.tsx
      YouTubeIdField.tsx

  dashboard/
    FestaDivinoDashboardPage.tsx
    useFestaDivinoDashboard.ts

  health/
    FestaDivinoHealthPage.tsx
    useFestaDivinoHealth.ts

  audit/
    FestaDivinoAuditPage.tsx
    AuditDiffViewer.tsx
    useFestaDivinoAuditLogs.ts

  programacao/
    ProgramacaoPage.tsx
    eventos/
      EventoListPage.tsx
      EventoFormPage.tsx
      EventoForm.tsx
      evento.api.ts
      evento.query.ts
      evento.mutations.ts
      evento.schema.ts
      evento.mappers.ts
      evento.columns.tsx
      evento.filters.tsx
      AttractionReorderList.tsx
    categorias/
    locais/
    atracoes/
    dias/

  cardapio/
    CardapioPage.tsx
    categorias/
    produtos/

  conteudo/
    ConteudoPage.tsx
    noticias/
    textos/

  midia/
    MidiaPage.tsx
    videos/
    shorts/

  faq/
    FaqPage.tsx
    categorias/
    items/
    FaqReorderList.tsx

  brinquedos/
    BrinquedosPage.tsx
```

Cada entidade editavel deve possuir:

- `.api.ts` com chamadas HTTP.
- `.query.ts` com hooks de leitura.
- `.mutations.ts` com mutations e invalidacoes.
- `.schema.ts` com schema Zod do formulario.
- `.mappers.ts` com conversoes API -> Form -> Payload.
- `.columns.tsx` com colunas da tabela.
- list page.
- form em pagina ou drawer, conforme complexidade.

### Query Keys

Criar `core/festaDivino.queryKeys.ts` e proibir query keys inline espalhadas no modulo.

Exemplo:

```ts
export const festaDivinoKeys = {
  all: ["festa-divino"] as const,
  dashboard: () => [...festaDivinoKeys.all, "dashboard"] as const,
  health: () => [...festaDivinoKeys.all, "health"] as const,
  audit: (filters?: AuditFilters) => [...festaDivinoKeys.all, "audit", filters] as const,
  programacao: {
    all: () => [...festaDivinoKeys.all, "programacao"] as const,
    eventos: (filters: EventoFilters) =>
      [...festaDivinoKeys.programacao.all(), "eventos", filters] as const,
    evento: (id: number | string) =>
      [...festaDivinoKeys.programacao.all(), "eventos", id] as const,
    categorias: () => [...festaDivinoKeys.programacao.all(), "categorias"] as const,
    locais: () => [...festaDivinoKeys.programacao.all(), "locais"] as const,
    atracoes: () => [...festaDivinoKeys.programacao.all(), "atracoes"] as const,
  },
  cardapio: {
    produtos: (filters: ProdutoFilters) =>
      [...festaDivinoKeys.all, "cardapio", "produtos", filters] as const,
    categorias: () => [...festaDivinoKeys.all, "cardapio", "categorias"] as const,
  },
  faq: {
    categorias: () => [...festaDivinoKeys.all, "faq", "categorias"] as const,
    items: (filters: FaqItemFilters) =>
      [...festaDivinoKeys.all, "faq", "items", filters] as const,
  },
};
```

Regras:

- Toda query com filtros, paginacao ou sort inclui esses parametros na key.
- Toda mutation invalida o escopo minimo necessario: entidade, dominio e dashboard quando alterar contagem/alerta.
- Optimistic update apenas para toggles simples e reorder com rollback visual. Criar, editar e deletar devem salvar e refetch, porque impactam o site publico.

### API, Query E Mutation

Evitar service unico grande. Separar por entidade:

```text
programacao/eventos/evento.api.ts
programacao/eventos/evento.query.ts
programacao/eventos/evento.mutations.ts
programacao/eventos/evento.schema.ts
programacao/eventos/evento.mappers.ts
programacao/eventos/evento.columns.tsx
```

Padrao:

- `.api.ts` chama `api.ts`, aplica params e unwrap do envelope `{ success, data, message, meta }`.
- `.query.ts` contem apenas `useQuery`.
- `.mutations.ts` contem `useMutation`, invalidacoes e toasts.
- `.mappers.ts` isola nomes legados como `titulo_evento`, `id_categoria`, `evento_pago`.

### Tabelas

Tabelas devem ser server-side para paginacao, filtros, busca e ordenacao, mesmo que o volume atual seja baixo.

Estado de filtros deve ir para a URL:

```text
/festa-divino/programacao?tab=eventos&data=2026-06-07&categoria=8&status=ativo&page=1
```

Beneficios:

- refresh preserva contexto;
- link pode ser compartilhado;
- botao voltar retorna para a mesma lista;
- API e frontend ja nascem preparados para crescimento.

Decisao de dependencia:

- Se for usar a Data Table recomendada pelo shadcn, adicionar `@tanstack/react-table` em `apps/web/package.json` com justificativa no resumo da implementacao.
- Se nao adicionar dependencia, `CrudDataTable` deve usar `components/ui/table` manualmente, mas manter API de props semelhante para migracao futura.

Cada entidade deve ter seu proprio `columns.tsx`. Exemplo conceitual:

```ts
export const eventoColumns = [
  "titulo",
  "data",
  "categoria",
  "local",
  "status",
  "destaque",
  "actions",
];
```

### Formularios

Padrao para entidade complexa:

```text
EventoFormPage
  carrega dado no edit
  carrega selects auxiliares
  decide create/update
  chama EventoForm

EventoForm
  React Hook Form
  Zod schema
  defaultValues
  submit
  preview
```

Helpers obrigatorios:

- `getFestaDivinoFieldErrors(error)` para mapear erros 422 do Laravel em mensagens por campo.
- `getFestaDivinoApiMessage(error)` para toast com a primeira mensagem util do backend.
- `emptyToNull`.
- `nullableNumber`.
- `currencyToNumber`.
- `extractYouTubeIdFromInput`, apenas na UI; backend continua exigindo ID puro.

Usar campos compartilhados:

- `MoneyField` para `preco` e `valor_ingresso`.
- `DateField`, `TimeField` e `DateTimeFields` para programacao e noticias.
- `ColorHexField` para categorias de evento.
- `UrlFieldWithPreview` para imagens, noticias e thumbs.
- `YouTubeIdField` para videos/shorts.
- `RelationSelectField` para FKs externas.
- `TagsFieldArray` para tags da programacao.

### Mappers

Forms nao devem usar diretamente o payload legado da API. Cada entidade precisa de mappers:

```ts
eventoToFormValues(evento: Evento): EventoFormValues
eventoFormToPayload(values: EventoFormValues): EventoPayload
eventoFromApi(resource: EventoResource): Evento
```

Beneficio: se o backend normalizar contrato ou a tabela legada mudar, o ajuste fica no mapper, nao em todos os forms.

### Permissoes No Frontend

Criar `core/festaDivino.permissions.ts`:

```ts
export const festaDivinoPermissions = {
  view: "festa-divino.view",
  health: "festa-divino.health",
  auditView: "festa-divino.audit.view",
  write: "festa-divino.write",
  publish: "festa-divino.publish",
  delete: "festa-divino.delete",
  programacaoManage: "festa-divino.programacao.manage",
  cardapioManage: "festa-divino.cardapio.manage",
  conteudoManage: "festa-divino.conteudo.manage",
  faqManage: "festa-divino.faq.manage",
  brinquedosManage: "festa-divino.brinquedos.manage",
};
```

O frontend deve esconder acoes sem permissao, mas backend continua sendo a barreira real.

### Rotas E Menu

Adicionar lazy imports em `App.tsx`, mantendo o padrao atual:

```text
/festa-divino
/festa-divino/health
/festa-divino/auditoria
/festa-divino/programacao
/festa-divino/programacao/eventos/novo
/festa-divino/programacao/eventos/:id/editar
/festa-divino/cardapio
/festa-divino/conteudo
/festa-divino/midia
/festa-divino/faq
/festa-divino/brinquedos
```

Menu:

- Grupo: `Festa do Divino`.
- Icone: `Church`, `CalendarDays` ou `Sparkles` de `lucide-react`.
- Permissao do grupo: `festa-divino.view`.
- Children:
  - Dashboard.
  - Programacao.
  - Cardapio.
  - Conteudo.
  - Midia.
  - FAQ.
  - Brinquedos.
  - Edicao.
  - Auditoria.
  - Health.

### Telas

1. Dashboard `/festa-divino`
   - Cards de contagem.
   - Health resumido.
   - Edicao ativa.
   - Alertas de consistencia.
   - Links rapidos para dominios.

2. Programacao `/festa-divino/programacao`
   - Tabs: Eventos, Categorias, Locais e Atracoes.
   - Tabela de eventos com busca por titulo, filtro por data, categoria, local, status e destaque.
   - Badge "sem atracao" quando aplicavel.
   - Acoes rapidas: ativar/desativar, destacar/remover destaque, editar atracoes.
   - Evento usa pagina propria, com blocos: principais, quando/onde, categoria/publico, ingresso, imagem/destaque, tags e atracoes.
   - Preview lateral de como o evento aparece no site.
   - Categorias, locais e atracoes podem usar drawer.

3. Edicao `/festa-divino/edicao`
   - Tabela de edicoes com ano, titulo, periodos, contagem de eventos e dias.
   - Form de edicao com periodo da programacao, periodo dos festejos, tema, cartaz, bandeireira, comissao e texto de convite.
   - Bloqueio de exclusao quando houver eventos ou dias vinculados.
   - Tabela de dias da festa com edicao, data, nome, descricao e CRUD.
   - Validacao de data do dia dentro do periodo da edicao.

4. Cardapio `/festa-divino/cardapio`
   - Tabs: Categorias, Produtos.
   - Produtos como foco principal.
   - Categorias em drawer.
   - Produto em pagina ou drawer largo, com `MoneyField`, categoria e preview de foto.
   - Aviso claro de que produto nao tem campo `ativo`; remocao e fisica.

5. Conteudo `/festa-divino/conteudo`
   - Tabs: Noticias e Textos editoriais.
   - Noticias em pagina propria com preview de link/thumb.
   - Textos editoriais em pagina propria ou drawer largo, com preview.
   - Como nao ha campo `ativo`, delete exige confirmacao de impacto publico.

6. Midia `/festa-divino/midia`
   - Tabs: Videos e Shorts.
   - Campo pede ID do YouTube.
   - UI pode aceitar URL colada e extrair ID, mas payload final manda ID puro.
   - Preview de thumb e URL final.

7. FAQ `/festa-divino/faq`
   - Layout recomendado: categorias na esquerda, perguntas da categoria selecionada na direita.
   - Reorder por botoes ou drag controlado.
   - Salvar ordem apenas no botao "Salvar ordem", nao a cada arraste.
   - Toggle ativo/inativo.
   - Preview de pergunta aberta.

8. Brinquedos `/festa-divino/brinquedos`
   - Lista com filtro ativo.
   - Form com preview de video e thumb.
   - Toggle active.
   - Botao para abrir midia em nova aba.

9. Auditoria `/festa-divino/auditoria`
   - Filtros por usuario, entidade, acao e periodo.
   - Diff antigo/novo.
   - Link para entidade quando aplicavel.

10. Health `/festa-divino/health`
   - Estado das conexoes.
   - Latencia.
   - Modo read-only/write.
   - Alertas de privilegios e schema.

### UX E Estado

- Dashboard denso, operacional e escaneavel.
- Tabelas com busca, filtros, ordenacao, paginacao e acoes por linha.
- Formularios em paginas ou drawers, seguindo padrao do VIP.
- Estados loading, error, empty e success.
- Confirmacao explicita para qualquer delete fisico.
- Banner persistente quando o modulo estiver em read-only.
- Banner de impacto publico em toda tela com mutation.
- Erros 422 do backend devem chamar `setError` no React Hook Form.
- Nao usar optimistic update em formularios grandes.
- Usar optimistic update apenas para toggles simples e reorder com rollback visual.

## Contrato De API E Scramble

Atualizar OpenAPI antes do frontend depender de payloads finais.

Cada CRUD deve documentar:

- Request.
- Resource.
- Erros 401, 403, 404, 409, 422 e 423.
- Payload paginado.
- Filtros e ordenacoes permitidos.
- Exemplo de resposta para toggle, reorder e health.

Depois de implementar rotas:

- `pnpm api:generate-spec`
- `pnpm api:generate-client`, se o gerador estiver configurado e sem falha conhecida.
- `pnpm validate:contract`

## Estrategia TDD

### Camadas De Teste

1. Testes rapidos em SQLite ou banco local de teste:
   - Cobrem 401, 403, 422, resources, policies e actions.
   - Usam migrations/fixtures que simulam as tabelas externas.

2. Testes de contrato em MariaDB local:
   - Validam nomes reais de tabelas, PKs, timestamps customizados, JSON, decimal e regras de FK.
   - Devem rodar em ambiente local/controlado, nao contra producao.

3. Testes remotos opt-in:
   - Grupo `external` ou variavel `FESTA_DIVINO_EXTERNAL_TESTS=true`.
   - Somente leitura por padrao.
   - Nunca rodam em CI padrao.
   - Nao gravam no banco publico sem flag adicional e backup.

### Ordem Por Feature

Para cada subdominio:

1. Escrever teste 401.
2. Escrever teste 403.
3. Escrever teste de listagem.
4. Escrever teste de validacao 422.
5. Escrever teste de criacao quando a fase permitir escrita.
6. Escrever teste de update.
7. Escrever teste de delete/toggle conforme politica.
8. Implementar Request, Resource, Model, Action, Controller e rota.
9. Rodar teste focado.
10. Rodar validacao ampla do lote.

### Testes Backend Minimos

- `tests/Feature/FestaDivino/FestaDivinoDashboardTest.php`
- `tests/Feature/FestaDivino/FestaDivinoHealthTest.php`
- `tests/Feature/FestaDivino/FestaDivinoAuditLogTest.php`
- `tests/Feature/FestaDivino/FestaDivinoProgramacaoEventoTest.php`
- `tests/Feature/FestaDivino/FestaDivinoProgramacaoAuxiliaresTest.php`
- `tests/Feature/FestaDivino/FestaDivinoCardapioTest.php`
- `tests/Feature/FestaDivino/FestaDivinoConteudoTest.php`
- `tests/Feature/FestaDivino/FestaDivinoMidiaTest.php`
- `tests/Feature/FestaDivino/FestaDivinoFaqTest.php`
- `tests/Feature/FestaDivino/FestaDivinoBrinquedoTest.php`
- `tests/Feature/FestaDivino/FestaDivinoPermissionTest.php`
- `tests/Feature/FestaDivino/FestaDivinoExternalConnectionTest.php`
- `tests/Feature/FestaDivino/FestaDivinoMariaDbContractTest.php`

### Testes Frontend Minimos

- Render do dashboard com mock de contagens.
- Health page mostra read-only/write/degraded.
- Tabela de eventos com filtros.
- Filtros geram query string correta.
- Query key muda quando filtro, pagina ou sort muda.
- Form de evento valida campos obrigatorios.
- Mapper transforma API -> Form corretamente.
- Mapper transforma Form -> Payload corretamente.
- Schema Zod rejeita URL, cor, moeda, data e YouTube ID invalidos.
- Submit chama mutation correta.
- Tratamento de 422 mostra mensagens via `setError`.
- Toggle ativo invalida query correta.
- Dialog de delete exige confirmacao.
- Botao de salvar fica indisponivel em read-only.
- Usuario sem permissao nao ve acao de criar/editar/deletar.

Arquivos sugeridos por entidade:

```text
programacao/eventos/__tests__/
  EventoListPage.test.tsx
  EventoForm.test.tsx
  evento.mappers.test.ts
  evento.schema.test.ts
  evento.queryKeys.test.ts
```

Se a base Vitest/RTL nao estiver estavel, registrar a lacuna e cobrir o fluxo com testes backend e validacao manual por browser.

## Concorrencia E Escrita Segura

- Reorder de FAQ e atracoes deve rodar em transacao externa.
- Quando houver risco de corrida, usar `lockForUpdate()` na conexao `festa_divino_write`.
- Transacoes de escrita devem usar `attempts: 3` para retry em deadlock.
- Updates sensiveis devem considerar controle otimista por `updated_at`, `data_atualizacao` ou hash do payload carregado, quando a tabela tiver campo confiavel.
- Toda mutation deve auditar old/new values.
- Falha em auditoria depois da escrita externa deve ser tratada como incidente operacional; idealmente a auditoria fica na mesma action e falhas sao visiveis.

## Melhorias Necessarias Antes Da Escrita Em Producao

1. Feature flag/config para modulo `FestaDivino`.
2. Usuarios separados de banco: read-only e write.
3. Remover privilegios DDL do usuario usado pela aplicacao.
4. Conexoes `festa_divino_read` e `festa_divino_write`.
5. `FestaDivinoWriteGuard` obrigatorio em toda mutation.
6. Modo read-only inicial.
7. Backup do banco externo antes de liberar mutacoes.
8. Auditoria local no VIP para toda escrita.
9. Health check com latencia, schema e privilegios.
10. Timeouts curtos de conexao e mensagens claras quando o banco externo estiver indisponivel.
11. Validacao forte de URLs, datas, moeda, cores, YouTube IDs e FKs externas.
12. Politica de delete conservadora.
13. OpenAPI/Scramble atualizado antes do frontend final.
14. Arquitetura frontend por dominio/entidade, com query keys centralizadas e mappers.
15. Formularios complexos com React Hook Form + Zod, sem replicar forms gigantes baseados em muitos `useState`.
16. Tabelas server-side com estado na URL.

## Riscos E Mitigacoes

| Risco | Impacto | Mitigacao |
| --- | --- | --- |
| Usuario atual tem privilegio DDL/DELETE amplo | Alto | Criar usuarios read/write minimos antes da escrita |
| Escrita quebra site publico | Alto | Read-only inicial, TDD, backup, validacoes fortes e health |
| Transacao roda na conexao errada | Alto | Padrao obrigatorio `DB::connection('festa_divino_write')->transaction(...)` |
| Credencial vaza no repo | Alto | Somente env/local secrets; nunca docs, codigo, fixtures ou logs |
| Testes dependem do banco remoto | Medio | Fixtures locais, MariaDB local e remoto opt-in |
| Delete remove dado visivel | Alto | Preferir toggle, bloquear dependentes, exigir permissao e confirmacao |
| URL de imagem/video invalida | Medio | Validacao server-side e preview no admin |
| Divergencia entre site publico e admin VIP | Medio | Resources allowlist, OpenAPI e comparacao com endpoints publicos |
| Tabelas legadas com nomes nao padrao | Baixo | Models com contrato explicito |

## Tarefas E Subtarefas

### Fase 0 - Preparacao E Seguranca

- [x] Criar branch `codex/festa-divino-admin`.
- [x] Registrar variaveis `.env.example` sem valores reais:
  - [x] `FESTA_DIVINO_READ_DB_HOST`
  - [x] `FESTA_DIVINO_READ_DB_PORT`
  - [x] `FESTA_DIVINO_READ_DB_DATABASE`
  - [x] `FESTA_DIVINO_READ_DB_USERNAME`
  - [x] `FESTA_DIVINO_READ_DB_PASSWORD`
  - [x] `FESTA_DIVINO_WRITE_DB_HOST`
  - [x] `FESTA_DIVINO_WRITE_DB_PORT`
  - [x] `FESTA_DIVINO_WRITE_DB_DATABASE`
  - [x] `FESTA_DIVINO_WRITE_DB_USERNAME`
  - [x] `FESTA_DIVINO_WRITE_DB_PASSWORD`
  - [x] `FESTA_DIVINO_WRITE_ENABLED`
- [x] Adicionar conexoes `festa_divino_read` e `festa_divino_write`.
- [x] Criar `config/festa-divino.php`.
- [x] Criar `FestaDivinoWriteGuard`.
- [x] Criar migration local `festa_divino_audit_logs` no banco VIP.
- [ ] Criar usuarios de banco com privilegios minimos no servidor externo.
- [ ] Validar que usuario de aplicacao nao tem DDL.
- [ ] Criar helper/test trait para schema externo local.

### Fase 1 - Backend Read-Only

- [x] Criar estrutura `apps/api/app/Modules/FestaDivino`.
- [x] Criar Models com contrato legado explicito.
- [x] Criar Resources allowlist para cada entidade.
- [x] Criar `HealthController`.
- [x] Criar `DashboardController`.
- [x] Criar listagens read-only por dominio.
  - [x] Programacao: eventos, categorias, locais e atracoes.
  - [x] Cardapio: categorias e produtos.
  - [x] Conteudo: noticias e textos editoriais.
  - [x] Midia: videos e shorts.
  - [x] FAQ.
  - [x] Brinquedos.
- [x] Criar Queries com Spatie Query Builder.
- [x] Criar permissoes no seeder.
- [x] Criar testes 401/403/listagem/dashboard/health.
- [x] Rodar testes focados.

### Fase 2 - OpenAPI E Frontend Read-Only

- [x] Expor rotas no Scramble/OpenAPI.
- [ ] Gerar spec e cliente quando aplicavel.
  - [x] Gerar spec OpenAPI com rotas Festa do Divino.
  - [ ] Gerar client TS quando `packages/api-client` tiver gerador configurado.
- [x] Decidir Data Table:
  - [ ] adicionar `@tanstack/react-table` com justificativa; ou
  - [x] usar `components/ui/table` manual preservando interface futura.
- [x] Criar `features/festa-divino/core`.
- [x] Criar `festaDivino.queryKeys.ts`.
- [x] Criar `festaDivino.permissions.ts`.
- [x] Criar helper para extrair erros 422 do Laravel e aplicar mensagens por campo.
- [x] Criar APIs e queries por entidade, sem mutations enquanto escrita estiver bloqueada.
- [ ] Criar mappers por entidade.
- [x] Criar dashboard frontend.
- [x] Criar telas read-only de edicao, programacao, cardapio, conteudo, midia, FAQ e brinquedos.
- [x] Melhorar tela de Edicao/Dias com mensagens de validacao por campo e confirmacao modal de exclusao.
- [x] Aplicar mensagens de validacao por campo nos demais CRUDs da pagina Festa Divino.
- [x] Remover `window.confirm` da pagina Festa Divino e usar confirmacao modal padrao do projeto.
- [x] Criar API e tela read-only de auditoria com filtros por acao, entidade e periodo.
- [x] Adicionar lazy routes em `App.tsx`.
- [x] Adicionar item no menu desktop/mobile.
- [x] Refletir filtro de busca na URL.
- [x] Validar estados loading/error/empty.

### Fase 3 - Programacao CRUD Em Staging

- [x] Edicao da festa:
  - [x] CRUD com guard de escrita e auditoria.
  - [x] Validacao de datas com `after_or_equal`.
  - [x] Bloqueio de delete com eventos ou dias vinculados.
  - [x] Tela `/festa-divino/edicao` com form de periodos e textos editoriais.
- [x] Dias da festa:
  - [x] CRUD com guard de escrita e auditoria.
  - [x] Validacao de edicao existente na conexao read.
  - [x] Validacao de data dentro do periodo da edicao.
  - [x] Tela de dias dentro de `/festa-divino/edicao`.
- [x] Eventos:
  - [x] Requests create/update/status.
  - [x] Controller com create/update/delete/toggle em transacao externa.
  - [x] Sync de atracoes em transacao externa.
  - [x] Auditoria old/new.
  - [x] Testes 401/403/422/CRUD/sync/auditoria.
  - [x] Frontend com criar, editar, ativar/inativar, excluir e vincular atracoes.
- [x] Categorias:
  - [x] CRUD.
  - [x] Bloqueio de delete com eventos.
  - [x] Validacao `hex_color`.
- [x] Locais:
  - [x] CRUD.
  - [x] Validacao latitude/longitude.
  - [x] Bloqueio de delete com eventos.
- [x] Atracoes:
  - [x] CRUD.
  - [x] Bloqueio de duplicidade no vinculo.
  - [x] Testes de ordenacao no sync de eventos.
  - [x] Bloqueio de delete com eventos vinculados.
- [x] Testes focados de edicao e dias com TDD.
- [ ] Validar site publico apos mutacoes em ambiente controlado.

### Fase 4 - Cardapio, Conteudo E Midia

- [x] Cardapio categorias.
- [x] Produtos.
- [x] Noticias.
- [x] Textos editoriais.
- [x] Videos.
- [x] Shorts.
- [x] Validacoes de YouTube ID.
- [x] Validacoes de URL em Noticias.
- [x] Validacoes de moeda e categoria no Cardapio.
- [x] Auditoria por entidade no Cardapio, Conteudo inicial e Midia.
- [x] Testes focados por CRUD de Cardapio, Noticias, Textos, Videos e Shorts.
- [ ] Revalidar endpoints publicos depois de mutacoes em staging.

### Fase 5 - FAQ E Brinquedos

- [x] FAQ categorias.
  - [x] CRUD com guard de escrita e auditoria.
  - [x] Bloqueio de delete quando houver perguntas vinculadas.
- [x] FAQ perguntas.
  - [x] CRUD com validacao de categoria existente.
  - [x] Delete fisico auditado.
- [x] Reorder FAQ com transacao/lock.
- [x] Toggle ativo/inativo.
- [x] Brinquedos CRUD.
- [x] Toggle active.
- [x] Preview de video/thumb no frontend.
- [x] Testes de reorder, toggle e auditoria para FAQ.
- [x] Testes de CRUD, toggle e auditoria para Brinquedos.

### Fase 6 - Producao Controlada

- [ ] Fazer backup do banco externo.
- [ ] Confirmar usuarios read/write minimos.
- [x] Confirmar `FESTA_DIVINO_WRITE_ENABLED=false` por padrao em `.env.example` e `config/festa-divino.php`.
- [ ] Liberar escrita por dominio, nao tudo de uma vez.
- [x] Disponibilizar health e auditoria para monitoramento operacional.
- [x] Buildar frontend administrativo e publicar artefatos em `apps/api/public`.
- [ ] Rodar validacoes:
  - [x] `php artisan test tests/Feature/FestaDivino/FestaDivinoReadOnlyTest.php`
  - [x] `vendor/bin/pint --test app/Modules/FestaDivino tests/Feature/FestaDivino`
  - [x] `pnpm --dir apps/web exec eslint src/features/festa-divino src/pages/festa-divino`
  - [x] `pnpm --dir apps/web exec tsc --noEmit --pretty false`
  - [x] `pnpm --dir apps/web test src/features/festa-divino/utils/festaDivinoApiErrors.test.ts src/features/festa-divino/utils/festaDivinoFormatters.test.ts`
  - [x] `pnpm api:generate-spec`
  - [x] `pnpm --dir apps/web build`
  - [x] `php artisan route:list --path=api/v1/festa-divino`
  - [ ] `pnpm validate:api` - falha fora do modulo Festa Divino em `RoteirosTest` e `SocialTest`.
  - [ ] `pnpm validate:web` - falha no lint legado fora do modulo Festa Divino.
  - [ ] `pnpm validate:contract` - falha porque `packages/api-client` ainda nao tem gerador configurado.
- [x] Conferir `docs/codex/known-failures.md` para separar falha conhecida de regressao.
- [x] Testar rotas locais por HTTP 200 em `/festa-divino` e `/festa-divino/programacao`.
- [ ] Testar fluxo visual completo no browser local.
- [ ] Registrar pendencias e riscos antes de liberar escrita total.

## Ordem Recomendada De Entrega

1. Documento e aceite do escopo.
2. Usuarios/conexoes externas seguras.
3. Dashboard, health e listagens read-only.
4. OpenAPI e frontend read-only.
5. CRUD de Programacao em staging.
6. CRUD de Cardapio, Conteudo e Midia.
7. CRUD de FAQ e Brinquedos.
8. CRUD de Edicao e Dias.
9. Escrita em producao por dominio, apos backup e validacao final.

## Criterios De Pronto

- O modulo segue o padrao do VIPSocial Hub.
- Nenhuma credencial foi versionada.
- O usuario de aplicacao nao possui DDL no banco externo.
- Todas as rotas administrativas exigem `auth:sanctum`.
- Policies/FormRequests usam permissoes Spatie.
- CRUDs possuem testes de 401, 403, 422 e caminho feliz.
- Escritas usam `FestaDivinoWriteGuard`.
- Escritas usam transacao na conexao `festa_divino_write`.
- Escritas geram auditoria local no VIP.
- Deletes perigosos retornam 409 ou exigem permissao/confirmacao explicita.
- Dashboard e health indicam inconsistencias sem quebrar a operacao.
- OpenAPI esta atualizado antes do frontend consumir contrato final.
- Validacoes relevantes foram executadas e falhas conhecidas foram separadas de regressao.
