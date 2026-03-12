# Plano de Execucao: Prompt Templates de I.A.

Este documento transforma a arquitetura de `docs/ai_prompts_templates_architecture.md` em backlog executavel.

Objetivo: permitir inicio de implementacao sem perder contexto, sem rediscutir decisao estrutural e com ordem clara de entrega.

## 1. Decisoes ja fechadas

Estas decisoes devem ser tratadas como baseline do V1.

### 1.1 Arquivamento

- O modulo usara apenas `deleted_at` como arquivamento logico.
- `is_active` nao sera usado neste modulo.
- `DELETE` significa arquivar via SoftDeletes.
- Nao havera restore no V1.
- Ao arquivar:
  - o item sai da UI operacional
  - nao existe endpoint de recuperacao
  - nao existe acao de desarquivar no manager

### 1.2 Provider Target

- `provider_target` sera enum fechado:
  - `generic`
  - `chatgpt`
  - `claude`
- Nao aceitar string livre no banco nem no request.
- No V1, `provider_target` e metadado operacional, nao restricao dura.
- Regra de comportamento no V1:
  - `generic` pode ser usado com qualquer acao final
  - `chatgpt` e `claude` funcionam como recomendacao de uso
  - o modal continua permitindo abrir qualquer template em qualquer provider

### 1.3 Ordenacao

- No `create`, `sort_order = max(sort_order do usuario) + 1`.
- No `reorder`, o backend recebe a lista de IDs na ordem desejada e regrava `1..N`.
- O backend nao confia em `sort_order` enviado pelo cliente.

### 1.4 Favorito

- Cada usuario pode ter no maximo um favorito.
- `PUT /{id}/favorite` significa `set favorite`, nunca `toggle`.
- A operacao roda em transacao.
- Se o favorito for arquivado, o usuario fica sem favorito no V1.

### 1.5 Feed Contract

- `public_token` deve ser obrigatorio no backend e no frontend.
- O frontend nao pode mais esconder o fluxo de I.A. por fallback silencioso.

### 1.6 Starter Template

- Nao criar starter template silenciosamente.
- Se o usuario nao tiver templates, a UI deve oferecer CTA explicita:
  - `Criar primeiro template`
  - `Usar modelo inicial`
- Ao clicar em `Usar modelo inicial`, o starter e criado no backend e marcado como favorito.
- O starter sera criado por endpoint dedicado:
  - `POST /api/v1/user/ai-prompts/starter`
- O backend controla o conteudo oficial do starter.
- O endpoint de starter no V1 so deve funcionar quando o usuario nao possuir templates ativos.
- Se o usuario ja possuir ao menos um template ativo:
  - retornar `409 Conflict`
  - nao criar novo starter implicitamente
- O starter nasce com:
  - `is_favorite = true`
  - `sort_order` correto
  - `usage_count = 0`
  - `last_used_at = null`

### 1.7 Slug

- `slug` fica fora do V1.
- Nao existira coluna, validacao, geracao ou unicidade relacionada a `slug` neste MVP.

### 1.8 Variaveis de Categoria

- `{{item_category}}` = primeira categoria prioritaria.
- `{{item_categories}}` = categorias unidas por virgula.
- Regra de prioridade no V1:
  - usar a primeira posicao de `categories_raw`
  - apos normalizacao simples e remocao de vazios

### 1.9 Origem de Variaveis do Feed

- `{{item_city}}` vem de `ai_metadata.city`
- `{{item_urgency}}` vem de `ai_metadata.urgency`
- `{{item_category}}` e `{{item_categories}}` vem de `categories_raw`
- Quando o valor nao existir:
  - usar string vazia
  - nunca injetar `undefined` ou `null`

### 1.10 Timezone

- `{{item_date}}` deve usar timezone editorial fixa.
- No V1, assumir `America/Sao_Paulo`.

### 1.11 Deeplink Limit

- Deeplink continua `best-effort`.
- Regra operacional do frontend:
  - se a URL final ultrapassar `1800` caracteres, nao chamar `window.open`
  - mostrar aviso orientando uso de `Copiar Prompt`
- O limite deve ser implementado em util central da feature.

### 1.12 API Response Shape

- Este modulo novo deve usar envelope padrao:
  - `success`
  - `data`
  - `message`
  - `meta` quando necessario
- Seguir padrao de [BaseController.php](/c:/laragon/www/vip/apps/api/app/Support/Http/Controllers/BaseController.php).

### 1.13 Tracking de Uso

- `usage_count` e `last_used_at` ficam no V1.
- Eles serao atualizados apenas em acao final explicita:
  - `Abrir no ChatGPT`
  - `Abrir no Claude`
  - `Copiar Prompt`
- Nao atualizar ao apenas abrir o modal.
- Endpoint dedicado:
  - `POST /api/v1/user/ai-prompts/{id}/track-use`
- O tracking deve ser leve e nao bloqueante do ponto de vista da UX.

### 1.14 Rota do Manager

- A rota do manager fica congelada como:
  - `/raspagem/config/prompts-ia`
- Nao renomear no V1.

## 2. Ordem de implementacao

Executar nesta ordem:

1. Fase 0 - preparacao tecnica.
2. Fase 1 - backend base.
3. Fase 2 - testes backend.
4. Fase 3 - frontend core.
5. Fase 4 - Prompt Manager.
6. Fase 5 - modal operacional.
7. Fase 6 - integracao nos pontos do feed.
8. Fase 7 - endurecimento final.

Motivo: o frontend depende de contratos estaveis do backend, o modal depende da feature core, e a integracao em cards/detalhe/streaming deve ser separada da construcao do modal para facilitar revisao.

## 3. Mapa de arquivos provaveis

### 3.1 Backend

- `apps/api/app/Modules/UserAiPrompts/`
- `apps/api/database/migrations/`
- `apps/api/database/seeders/RoleAndPermissionSeeder.php`
- `apps/api/tests/Feature/`
- `apps/api/tests/Unit/`

### 3.2 Frontend

- `apps/web/src/features/ai-prompts/`
- `apps/web/src/services/newsRadar.service.ts`
- `apps/web/src/hooks/useNewsRadar.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/components/layout/DesktopSidebar.tsx`
- `apps/web/src/components/layout/MobileNav.tsx`
- `apps/web/src/pages/raspagem/feed/FeedCard.tsx`
- `apps/web/src/pages/raspagem/feed/FeedDetailDialog.tsx`
- `apps/web/src/pages/raspagem/streaming/StreamingCard.tsx`

## 4. Fase 0: Preparacao tecnica

Objetivo: preparar o terreno antes do CRUD.

### Task 0.1: Registrar o modulo

Subtasks:

- Criar pasta `apps/api/app/Modules/UserAiPrompts/`.
- Adotar estrutura padrao descrita em `docs/AI_GUIDE.md`.
- Definir namespace do modulo.
- Criar `routes.php` do modulo.
- Validar que o `ModuleServiceProvider` vai carregar o modulo automaticamente.

Criterio de aceite:

- O modulo existe e esta pronto para receber routes, controller, model e requests.

### Task 0.2: Permissoes

Subtasks:

- Decidir se o modulo usara `raspagem.*` ou um namespace proprio.
- Recomendacao: criar namespace proprio:
  - `ai_prompts.view`
  - `ai_prompts.create`
  - `ai_prompts.edit`
  - `ai_prompts.delete`
- Atualizar `RoleAndPermissionSeeder`.
- Garantir que admin receba tudo e papeis adequados recebam ao menos `view/create/edit/delete`.

Criterio de aceite:

- O modulo tem permissao dedicada e nao depende implicitamente de `raspagem.*`.

### Task 0.3: Definir nome final da tabela

Subtasks:

- Confirmar nome final:
  - recomendado: `user_ai_prompt_templates`
- Congelar que `slug` fica fora do V1.
- Congelar que nao existe restore no V1.

Criterio de aceite:

- Nome da tabela e colunas do V1 estao congelados antes da migration.

## 5. Fase 1: Backend base

Objetivo: entregar contratos estaveis do CRUD.

### Task 1.1: Migration

Subtasks:

- Criar migration da tabela `user_ai_prompt_templates`.
- Campos recomendados do V1:
  - `id`
  - `user_id`
  - `name`
  - `description` nullable
  - `content`
  - `provider_target`
  - `is_favorite`
  - `sort_order`
  - `usage_count`
  - `last_used_at`
  - `created_at`
  - `updated_at`
  - `deleted_at`
- Adicionar FK para `users`.
- Adicionar indices:
  - `(user_id, is_favorite)`
  - `(user_id, sort_order)`
  - `(user_id, deleted_at)`

Criterio de aceite:

- Migration sobe e desce sem ajustes manuais.

### Task 1.2: Model e enum

Subtasks:

- Criar model `UserAiPromptTemplate`.
- Adicionar `SoftDeletes`.
- Definir `fillable`, `casts`, relacao com `User`.
- Criar enum PHP para `provider_target`.
- Criar scopes uteis:
  - `ownedBy($userId)`
  - `ordered()`
  - `active()` se quiser representar `whereNull(deleted_at)` como escopo sem `is_active`

Criterio de aceite:

- O model representa o dominio sem regra duplicada em controller.

### Task 1.3: Requests

Subtasks:

- Criar requests:
  - `StoreUserAiPromptRequest`
  - `UpdateUserAiPromptRequest`
  - `SetFavoriteUserAiPromptRequest` se necessario
  - `ReorderUserAiPromptsRequest`
- Validacoes:
  - `name`: required, string, max 100
  - `description`: nullable, string
  - `content`: required, string
  - `provider_target`: in enum
  - `items`: array no reorder
  - `items.*.id`: integer
- Nunca aceitar `user_id`.

Criterio de aceite:

- Payload invalido falha com 422 padrao.

### Task 1.4: Resource

Subtasks:

- Criar `UserAiPromptTemplateResource`.
- Normalizar shape de resposta.
- Incluir:
  - `id`
  - `name`
  - `description`
  - `content`
  - `provider_target`
  - `is_favorite`
  - `sort_order`
  - `usage_count`
  - `last_used_at`
  - `created_at`
  - `updated_at`
- Nao expor `user_id` se nao houver necessidade no front.

Criterio de aceite:

- Front consegue renderizar listagem e modal sem chamada extra.

### Task 1.5: Controller

Subtasks:

- Criar controller fino, baseado em `BaseController`.
- Endpoints:
  - `GET /api/v1/user/ai-prompts`
  - `POST /api/v1/user/ai-prompts`
  - `POST /api/v1/user/ai-prompts/starter`
  - `GET /api/v1/user/ai-prompts/{id}`
  - `PUT /api/v1/user/ai-prompts/{id}`
  - `DELETE /api/v1/user/ai-prompts/{id}`
  - `PUT /api/v1/user/ai-prompts/{id}/favorite`
  - `POST /api/v1/user/ai-prompts/{id}/track-use`
  - `PUT /api/v1/user/ai-prompts/reorder`
  - `GET /api/v1/user/ai-prompts/variables`
- Escopo sempre por `auth()->id()`.
- Ordenacao do list:
  - `is_favorite DESC`
  - `sort_order ASC`
  - `name ASC`

Criterio de aceite:

- Usuario nao consegue ler nem alterar prompt de outro usuario.

### Task 1.6: Regras de negocio

Subtasks:

- No `store`, calcular `sort_order` automaticamente.
- No `starter`, gerar template oficial controlado pelo backend.
- No `favorite`, limpar favoritos anteriores e marcar o alvo em transacao.
- No `destroy`, arquivar e limpar `is_favorite` se necessario.
- No `reorder`, receber apenas ordem final de IDs e regravar `1..N`.
- No `variables`, devolver catalogo oficial do V1.
- No `track-use`, incrementar `usage_count` e atualizar `last_used_at`.

Contrato recomendado para `GET /variables`:

```json
{
  "success": true,
  "data": [
    {
      "key": "{{md_url}}",
      "label": "Link do Markdown publico",
      "description": "URL publica da noticia em markdown",
      "example": "https://adm.tvvip.social/news/2696202c-d1d9-4ffb-a479-41999c4c1b0f.md",
      "required_recommended": true
    }
  ]
}
```

Criterio de aceite:

- Regras centrais nao ficam espalhadas em varios endpoints.

### Task 1.7: Routes

Subtasks:

- Registrar routes do modulo em `routes.php`.
- Declarar `variables`, `reorder` e `starter` antes de `/{id}`.
- Usar `whereNumber('id')` no que for numerico.
- Proteger tudo com `auth:sanctum`.

Criterio de aceite:

- Nao ha colisao entre routes especiais e routes parametrizadas.

## 6. Fase 2: Testes backend

Objetivo: congelar contrato antes da integracao do front.

### Task 2.1: Feature tests CRUD

Subtasks:

- Criar teste de list vazio.
- Criar teste de create.
- Criar teste de show.
- Criar teste de update.
- Criar teste de delete via soft delete.
- Criar teste de `variables`.
- Criar teste de `starter`.
- Criar teste de `track-use`.

Criterio de aceite:

- CRUD inteiro passa por API autenticada.

### Task 2.2: Feature tests de ownership

Subtasks:

- Usuario A nao lista prompts do usuario B.
- Usuario A nao acessa `GET/PUT/DELETE` de prompt do usuario B.
- Usuario A nao consegue favoritar prompt do usuario B.
- Usuario A nao consegue reordenar IDs do usuario B.
- Usuario A nao consegue disparar `track-use` de prompt do usuario B.

Criterio de aceite:

- Escopo por usuario esta blindado.

### Task 2.3: Feature tests de favorite e reorder

Subtasks:

- Ao favoritar um prompt, os outros sao desmarcados.
- Favorito nao e toggle.
- Ao arquivar o favorito, o usuario fica sem favorito.
- Reorder regrava `1..N`.
- Reorder ignora buracos e duplicidades do cliente.
- `starter` cria favorito corretamente quando o usuario nao possui templates.
- `starter` falha com `409 Conflict` quando o usuario ja possui template ativo.
- `track-use` atualiza `usage_count` e `last_used_at` apenas em acao explicita.

Criterio de aceite:

- Favorito e ordem estao deterministas.

### Task 2.4: Feed contract test

Subtasks:

- Adicionar ou reforcar teste para `public_token` no endpoint de feed.
- Garantir que o tipo nao volte a ser opcional por regressao.
- Criar teste de rotas especiais:
  - `/variables` nao colide com `/{id}`
  - `/reorder` nao colide com `/{id}`
  - `/starter` nao colide com `/{id}`

Criterio de aceite:

- `public_token` esta protegido como contrato.

## 7. Fase 3: Frontend core

Objetivo: criar base reutilizavel da feature.

### Task 3.1: Estrutura da feature

Subtasks:

- Criar pasta `apps/web/src/features/ai-prompts/`.
- Estrutura recomendada:
  - `api/`
  - `components/`
  - `hooks/`
  - `types/`
  - `utils/`
- Mover a regra nova para la.
- Deixar feed apenas como consumidor.

Criterio de aceite:

- A feature existe desacoplada de `pages/raspagem/feed`.

### Task 3.2: Tipos

Subtasks:

- Criar tipos:
  - `PromptTemplate`
  - `PromptProviderTarget`
  - `PromptVariable`
  - `CompilePromptResult`
- Ajustar `NewsItem` para `public_token: string`.
- Remover opcionalidade no tipo do front.

Criterio de aceite:

- O TypeScript nao permite chamar o fluxo de I.A. sem `public_token`.

### Task 3.3: API client da feature

Subtasks:

- Criar service ou camada em `features/ai-prompts/api`.
- Implementar:
  - list
  - create
  - detail
  - update
  - archive
  - setFavorite
  - reorder
  - getVariables
  - createStarterTemplate
  - trackUse
- Seguir envelope `success/data/meta`.

Criterio de aceite:

- O front consome o modulo sem depender de mock.

### Task 3.4: Hooks da feature

Subtasks:

- Criar query keys dedicadas.
- Criar hooks:
  - `useAiPromptTemplates`
  - `useAiPromptTemplate`
  - `useCreateAiPromptTemplate`
  - `useUpdateAiPromptTemplate`
  - `useArchiveAiPromptTemplate`
  - `useSetFavoriteAiPromptTemplate`
  - `useReorderAiPromptTemplates`
  - `useAiPromptVariables`
- Invalidar cache correto apos mutacoes.

Criterio de aceite:

- CRUD pode ser montado so com hooks da feature.

### Task 3.5: Utils centrais

Subtasks:

- Criar `prompt-template-utils.ts`.
- Implementar:
  - `getAvailableVariables()`
  - `compilePrompt(template, newsItem)`
  - `extractUnknownVariables(text)`
  - `hasRecommendedMdUrl(text)`
  - `buildMarkdownUrl(publicToken)`
  - `buildProviderDeepLink(provider, prompt)`
  - `isDeepLinkSafe(url)`
- Shape recomendado:

```ts
type CompilePromptResult = {
  compiledText: string
  unknownVariables: string[]
  missingRecommendedVariables: string[]
  usedVariables: string[]
  hasMdUrl: boolean
  isPossiblyTooLongForDeepLink: boolean
}
```

Criterio de aceite:

- Toda regra de compilacao fica centralizada e testavel.

### Task 3.6: Tests do core frontend

Subtasks:

- Testar compilacao de variaveis conhecidas.
- Testar degradacao para `null` e `undefined`.
- Testar preservacao de variavel desconhecida.
- Testar `{{item_category}}`.
- Testar `{{item_categories}}`.
- Testar `{{item_date}}` em timezone editorial.
- Testar origem de `{{item_city}}` e `{{item_urgency}}`.
- Testar builder de deeplink com fallback de tamanho.

Criterio de aceite:

- O core da feature funciona sem depender de UI.

## 8. Fase 4: Prompt Manager

Objetivo: entregar CRUD visual.

### Task 4.1: Rota e navegacao

Subtasks:

- Criar pagina `/raspagem/config/prompts-ia`.
- Registrar route em `App.tsx`.
- Adicionar item de navegacao em sidebars.
- Definir permissao de acesso.

Criterio de aceite:

- Usuario autorizado acessa o manager pela navegacao.

### Task 4.2: Listagem

Subtasks:

- Criar listagem em cards ou table.
- Exibir:
  - `name`
  - `description`
  - `provider_target`
  - badge de favorito
  - `sort_order`
- Acoes:
  - editar
  - arquivar
  - setar favorito
  - duplicar
  - subir
  - descer

Criterio de aceite:

- Toda acao principal do CRUD esta na listagem.

### Task 4.3: Formulario

Subtasks:

- Campos:
  - `name`
  - `provider_target`
  - `description`
  - `content`
- Criar chips de variaveis acima do textarea.
- Implementar insercao no cursor.
- Adicionar preview simples com noticia fake de exemplo.
- Exibir warning soft se nao houver `{{md_url}}`.
- Exibir warning se houver variavel desconhecida.

Criterio de aceite:

- Usuario consegue montar template sem decorar placeholder.

### Task 4.4: Duplicar

Subtasks:

- Implementar duplicacao client-side:
  - copia dados
  - limpa `id`
  - adiciona ` (Copia)` no nome
  - faz `POST`
- Copiar:
  - `description`
  - `content`
  - `provider_target`
- Nao copiar:
  - `is_favorite`
  - `usage_count`
  - `last_used_at`
  - `deleted_at`
- `sort_order` do novo item deve ser `max + 1`.

Criterio de aceite:

- Duplicar gera novo registro valido e nao conflita com favorito.

### Task 4.5: Reordenacao

Subtasks:

- Implementar subir/descer no V1.
- Opcional: drag-and-drop so se o tempo permitir.
- Ao confirmar reordenacao, enviar lista ordenada de IDs.

Criterio de aceite:

- Ordem visual e ordem persistida ficam sincronizadas.

### Task 4.6: Estado vazio

Subtasks:

- Se nao houver templates:
  - mostrar explicacao
  - CTA `Criar primeiro template`
  - CTA `Usar modelo inicial`
- O starter template deve vir com nome recomendado:
  - `Reescrita Jornalistica Padrao`

Criterio de aceite:

- O modulo nao nasce vazio e confuso.

## 9. Fase 5: Modal operacional

Objetivo: substituir o hardcoded atual.

### Task 5.1: Modal central

Subtasks:

- Criar modal central da feature.
- Entrada:
  - `newsItem`
  - templates ativos do usuario
- Comportamento:
  - ao abrir, selecionar favorito ou primeiro `sort_order`
  - compilar prompt automaticamente
  - preencher textarea editavel
  - permitir restaurar compilacao original

Criterio de aceite:

- O fluxo operacional deixa de depender do dropdown hardcoded.

### Task 5.2: Acoes do modal

Subtasks:

- `Abrir no ChatGPT`
- `Abrir no Claude`
- `Copiar Prompt`
- `Visualizar Markdown`
- `Abrir Markdown`
- Fazer deeplink best-effort.
- Se estourar limite de URL, orientar copia manual.
- Ao disparar acao final valida:
  - chamar `track-use` de forma nao bloqueante
  - nao interromper a acao principal se o tracking falhar

Criterio de aceite:

- O usuario nunca fica bloqueado por limite de browser.

### Task 5.3: Meta-info auxiliar

Subtasks:

- Exibir chips de contexto:
  - fonte
  - data
  - cidade se existir
- categoria se existir

Criterio de aceite:

- O redator confere rapidamente o contexto da compilacao.

### Task 5.4: Criterios objetivos do modal

Subtasks:

- Ao abrir, selecionar favorito automaticamente.
- Ao trocar template, recompilar e sobrescrever a textarea.
- Se o usuario editar manualmente, exibir `Restaurar template original`.
- Se houver variaveis desconhecidas, mostrar warning sem bloquear.
- Se faltar `{{md_url}}`, mostrar warning sem bloquear.
- Se nao houver templates, mostrar CTA de criacao e starter.

Criterio de aceite:

- Nao ha interpretacao ambigua entre frontend e produto.

## 10. Fase 6: Integracao nos pontos do feed

Objetivo: ligar o modal ao fluxo operacional existente.

### Task 6.1: Integracao nos pontos atuais

Subtasks:

- Remover dependencias do fluxo antigo em:
  - `FeedCard.tsx`
  - `FeedDetailDialog.tsx`
  - `StreamingCard.tsx`
- Substituir por acionador unico:
  - `openComposePromptModal(newsItem)`

Criterio de aceite:

- Os tres pontos usam o mesmo fluxo.

### Task 6.2: Remocao do hardcoded antigo

Subtasks:

- Descontinuar `AiGenerateMenu.tsx` como implementacao principal.
- Remover ou adaptar `ai-generate-utils.ts`.
- Preservar apenas helpers realmente reutilizaveis, como markdown url.

Criterio de aceite:

- Nao sobra regra duplicada entre menu antigo e modal novo.

## 11. Fase 7: Endurecimento final

Objetivo: preparar merge sem debito obvio.

### Task 7.1: Revisao de permissao

Subtasks:

- Garantir acesso por permissao no front e no back.
- Garantir comportamento correto para usuario sem permissao.

Criterio de aceite:

- O modulo nao fica exposto por navegacao ou API sem autorizacao.

### Task 7.2: Seeds e starter

Subtasks:

- Criar estrategia do starter template.
- Implementar endpoint dedicado `POST /api/v1/user/ai-prompts/starter`.
- Garantir conteudo editorial inicial baseado no hardcoded atual.

Criterio de aceite:

- O starter reproduz o comportamento atual de reescrita jornalistica.

### Task 7.3: QA manual

Subtasks:

- Criar template novo.
- Editar template.
- Duplicar template.
- Setar favorito.
- Arquivar favorito.
- Reordenar varios templates.
- Abrir modal pelo card.
- Abrir modal pelo detalhe.
- Abrir modal pelo streaming.
- Testar prompt grande.
- Testar noticia sem cidade.
- Testar noticia sem categorias.
- Testar starter via CTA.
- Testar que item arquivado nao possui restore no V1.

Criterio de aceite:

- Fluxo fecha ponta a ponta sem fallback silencioso.

### Task 7.4: Documentacao

Subtasks:

- Atualizar `docs/ai_prompts_templates_architecture.md` se houver divergencia.
- Registrar endpoint final e shape final.
- Registrar catalogo final de variaveis.

Criterio de aceite:

- A doc tecnica reflete o codigo que foi entregue.

## 12. Checklist de inicio rapido

Se a implementacao comecar agora, a ordem pratica recomendada e:

1. Criar modulo backend e migration.
2. Criar enum, model, resource, requests.
3. Criar controller, routes e tests de CRUD.
4. Adicionar permissao e seed.
5. Criar `features/ai-prompts` no frontend.
6. Tornar `public_token` obrigatorio no tipo do feed.
7. Implementar `prompt-template-utils.ts` com testes.
8. Criar hooks e client da feature.
9. Criar Prompt Manager.
10. Criar modal central.
11. Integrar no feed.
12. Remover hardcoded antigo.

## 13. Definicao de pronto do V1

O V1 esta pronto quando:

- O usuario consegue criar, editar, duplicar, favoritar, reordenar e arquivar templates.
- O feed usa templates do banco e nao mais prompt hardcoded.
- O modal central compila no frontend com catalogo fechado de variaveis.
- `public_token` e obrigatorio do backend ate a UI.
- O fluxo tem fallback para copia manual quando deeplink falhar.
- Os testes centrais de ownership, favorite, reorder e compilePrompt estao cobrindo o comportamento acordado.
