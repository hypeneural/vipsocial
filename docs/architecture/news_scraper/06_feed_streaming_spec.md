# Documentação — Feed de Notícias + Modo Streaming

## 1. Estado Atual — Visão Geral

> 3 páginas operacionais ativas + 1 página nova proposta (Streaming).
> Build servido via `apps/api/public`. Sem mock data em nenhuma página.

| Camada | Arquivo | Linhas | Status |
|---|---|---|---|
| Service TS | `services/newsRadar.service.ts` | 452 | ✅ 14 métodos, tipagem completa |
| Hooks | `hooks/useNewsRadar.ts` | 179 | ✅ react-query, refetch 60s, mutations |
| Feed | `pages/raspagem/Feed.tsx` | 1079 | ✅ Listagem real com filtros, detalhe, AI |
| Fontes | `pages/raspagem/Fontes.tsx` | 1112 | ✅ CRUD, sync, autodetect, edição |
| Filtros | `pages/raspagem/Filtros.tsx` | 748 | ✅ Diagnóstico, preview, test-selector |
| Backend | `NewsItemController.php` | 125 | ✅ 15 endpoints, 9 filtros |

---

## 2. Frontend — Detalhamento por Página

### 2.1 Feed (`/raspagem/feed`) — 1079 linhas

**Funcionalidades operacionais:**
- KPIs reais via `useNewsDashboard`: fontes ativas, itens hoje, fontes com falha, itens na semana
- 7 filtros server-side: busca texto, fonte, visão (duplicados/alta relevância/últimas 6h), status extração, status IA, urgência, cidade
- Listagem paginada: 12 itens/página, paginação real
- Cards com: imagem hero (lazy + fallback), badges, fonte+hostname+tempo relativo, resumo, 5W1H quick facts, categorias, % captura
- Dialog de detalhe: body_text, imagem ampliada, contexto, leitura IA completa (5W1H + summary bullets), notícias relacionadas
- Auto-refresh: `refetchInterval: 60000` (dashboard + items + sources)

**Ordenação padrão:** `published_at_utc DESC` (o que a fonte publicou mais recente aparece primeiro).

### 2.2 Fontes (`/raspagem/fontes`) — 1112 linhas

- KPIs: total filtrado, ativas, com falha, itens hoje
- Filtros: busca por nome/domínio, status, tipo (portal/prefeitura/blog/agência/WhatsApp)
- CRUD completo: criar, editar, remover (com confirm), toggle ativa/pausada
- Sync (dispara job), Autodetect (descobre feed/sitemap, sugere preset/config)
- Dialog de edição com crawling config JSON, throttle config, date formats

### 2.3 Filtros (`/raspagem/filtros`) — 748 linhas

- Tab Saúde: KPIs, fontes com mais falhas, itens com falha de extração/IA
- Tab Diagnóstico: autodetect de qualquer URL, raw JSON, config sugerida
- Tab Preview: testa captura em modo feed ou html_listing
- Tab Seletores: testa CSS selectors contra URL, mostra matches

---

## 3. Backend — Endpoints Ativos

**Via `ModuleServiceProvider` → `api/v1/news-radar/`**

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/sources` | Listar fontes (paginado, filtrado) |
| POST | `/sources` | Criar fonte |
| GET | `/sources/{id}` | Detalhe da fonte |
| PUT | `/sources/{id}` | Atualizar fonte |
| DELETE | `/sources/{id}` | Remover fonte |
| POST | `/sources/{id}/sync` | Disparar sincronização |
| GET | `/sources/{id}/runs` | Histórico de execuções |
| POST | `/sources/discover` | Autodetect de feed/sitemap |
| GET | `/sources/discover/{runId}/status` | Status do discovery |
| POST | `/sources/preview` | Preview de captura |
| POST | `/sources/test-selector` | Testar CSS selector |
| GET | `/items` | Listar notícias (9 filtros) |
| GET | `/items/{id}` | Detalhe com AI metadata |
| GET | `/items/{id}/related` | Notícias relacionadas |
| GET | `/dashboard` | KPIs e totais |

### Hooks React Query (`useNewsRadar.ts`)

| Hook | Tipo | RefetchInterval |
|---|---|---|
| `useNewsDashboard` | query | 60s |
| `useNewsItems` | query | 60s |
| `useNewsItem` | query | on-demand |
| `useRelatedNewsItems` | query | on-demand |
| `useNewsSources` | query | 60s |
| `useNewsSource` | query | on-demand |
| `useNewsSourceRuns` | query | on-demand |
| `useNewsDiscoveryStatus` | query | 2s (polling) |
| `useCreateNewsSource` | mutation | invalidate |
| `useUpdateNewsSource` | mutation | invalidate |
| `useDeleteNewsSource` | mutation | invalidate |
| `useSyncNewsSource` | mutation | invalidate |
| `useDiscoverNewsSource` | mutation | - |
| `usePreviewNewsSource` | mutation | - |
| `useTestNewsSelector` | mutation | - |

---

## 4. Pré-requisito: Decomposição do Feed.tsx

> As páginas já estão grandes (1079, 1112, 748 linhas). Antes de adicionar mais complexidade com streaming, decompor o Feed.

### Componentes a extrair do `Feed.tsx`

```
pages/raspagem/
├── Feed.tsx                    ← orquestra tudo
├── feed/
│   ├── FeedHeader.tsx          ← título + botão atualizar + botão streaming
│   ├── FeedStats.tsx           ← 4 KPI cards do dashboard
│   ├── FeedFilters.tsx         ← painel de 7 filtros
│   ├── FeedList.tsx            ← loop de cards + paginação
│   ├── FeedCard.tsx            ← card individual com badges, imagem, facts
│   ├── FeedCardImage.tsx       ← componente de imagem com fallback (já existe inline)
│   └── FeedDetailDialog.tsx    ← dialog de detalhe com AI, relacionadas
├── hooks/
│   └── useFeedFiltersState.ts  ← gerencia estado dos 7 filtros + paginação
└── streaming/
    ├── FeedStreaming.tsx        ← página fullscreen
    ├── StreamingHeader.tsx      ← header mínimo
    ├── StreamingGrid.tsx        ← grid responsivo
    ├── StreamingCard.tsx        ← card compacto
    └── useStreamingFeed.ts     ← polling incremental com delta
```

---

## 5. Feature: Modo Streaming (`/raspagem/feed/streaming`)

### 5.1 Conceito

Botão **"Ver em Streaming"** com ícone de TV (`Monitor` do lucide-react) no header do Feed abre uma **tela fullscreen sem sidebar/topbar**, exibindo notícias em grid responsivo que se auto-atualiza a cada 60 segundos, inserindo novas notícias no topo com animação suave.

### 5.2 UX Flow

```
/raspagem/feed
  └─ Botão "Ver em Streaming" (ícone Monitor)
       └─ Abre /raspagem/feed/streaming (fullscreen, sem AppShell)
            ├─ Header: logo, status "Ao vivo", "Atualizado às HH:mm", "N novas", botão ✕
            ├─ Grid responsivo de cards compactos
            ├─ Polling de 60s com merge incremental
            └─ Esc ou botão ✕ → volta para /raspagem/feed
```

### 5.3 Header do Streaming

```
┌──────────────────────────────────────────────────────────────┐
│  🔴 Logo    "Ao vivo"    "Atualizado às 14:32"    "3 novas"    ✕  │
└──────────────────────────────────────────────────────────────┘
```

| Elemento | Descrição |
|---|---|
| 🔴 Indicador | Círculo pulsante `bg-success` (mesmo do Feed atual) |
| "Ao vivo" | Texto fixo em badge |
| Timestamp | `Atualizado às HH:mm` — atualiza a cada refresh |
| Contador novas | Badge `"N novas"` que aparece por 3s após receber itens novos |
| ✕ | Botão fechar → `navigate('/raspagem/feed')` |

### 5.4 Estratégia de Polling Incremental (Delta)

> **Problema:** `per_page=50` pode perder itens se entrarem mais de 50 entre dois polls.

**Solução — campo marcador `after_id`:**

1. **Primeira carga:** `GET /items?per_page=50` (sem marcador)
2. **Próximos polls:** `GET /items?after_id={maiorIdExibido}&per_page=50`
3. Backend filtra: `WHERE id > after_id ORDER BY id DESC LIMIT 50`
4. Retorna somente o **delta** desde a última chamada

**Backend — adicionar ao `NewsItemController::index()`:**

```php
if ($request->filled('after_id')) {
    $query->where('id', '>', $request->input('after_id'));
}
```

**Frontend — `useStreamingFeed.ts`:**

```typescript
// Manter estado:
// - allItems: NewsItem[] (max 200, ordenados por created_at DESC)
// - seenIds: Set<number>
// - maxId: number (maior id exibido)
// - newCount: number (contagem de novidades recentes)

// A cada 60s:
// 1. GET /items?after_id={maxId}&per_page=50
// 2. Filtrar itens com id já no seenIds
// 3. Prepend novos ao allItems
// 4. Atualizar maxId, seenIds, newCount
// 5. Trim allItems se > 200
```

### 5.5 Ordenação

| Contexto | Campo de ordenação | Motivo |
|---|---|---|
| **Feed normal** | `published_at_utc DESC` | O que a fonte publicou mais recente primeiro |
| **Streaming** | `created_at DESC` | O que o radar **descobriu** mais recente primeiro |

> Notícia antiga descoberta agora deve entrar no topo do streaming — o objetivo é "novidade no radar", não "data de publicação da fonte".

### 5.6 Deduplicação

- **Campo de dedupe:** `id` (primary key, único e sequencial)
- **Implementação:** `Set<number>` em memória no hook `useStreamingFeed`
- **Ordenação visual:** Por `created_at DESC` no array local

### 5.7 Layout: Grid Responsivo (não Masonry)

> **Decisão:** começar com **grid responsivo tradicional**, não masonry.
>
> CSS columns tem desvantagens para streaming: ordem visual estranha, cards pulam, animação de entrada no topo imprevisível. Para notícia ao vivo, **clareza visual > efeito Pinterest**.

| Breakpoint | Colunas |
|---|---|
| < 640px | 1 |
| 640-1024px | 2 |
| 1024-1440px | 3 |
| > 1440px | 4 |

**Implementação:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4`

**Evolução futura:** se houver demanda por masonry, migrar para `react-masonry-css` (nunca CSS columns puro).

### 5.8 Card de Streaming — Contrato Mínimo de Campos

```
┌──────────────────────┐
│ ┌──────────────────┐ │
│ │   Hero Image     │ │   ← aspect-ratio: 16/9, object-cover
│ └──────────────────┘ │
│                      │
│ 🔴 Alta              │   ← urgency (só media/alta)
│ Título da notícia... │   ← title (line-clamp-3)
│                      │
│ 📰 Fonte • 2 min     │   ← source.name + created_at relativo
│ 🏙️ Itapema           │   ← city
│                      │
│ #economia #política  │   ← categories_raw (max 3)
└──────────────────────┘
```

**Campos necessários do endpoint (contrato mínimo):**

| Campo | Obrigatório | Uso |
|---|---|---|
| `id` | ✅ | dedupe + key |
| `title` | ✅ | texto principal |
| `hero_image_url` | ❌ | imagem com fallback |
| `source.name` | ✅ | identificação |
| `created_at` | ✅ | ordenação + tempo relativo |
| `ai_metadata.urgency` | ❌ | badge condicional |
| `ai_metadata.city` | ❌ | badge condicional |
| `categories_raw` | ❌ | tags (max 3) |

> **Melhoria futura (v2):** criar `GET /items?view=stream` ou `GET /items/stream` com payload enxuto (sem body_text, body_html, excerpt, raw_item). Não é obrigatório para v1.

### 5.9 Ação ao clicar em um card

| Contexto | Comportamento |
|---|---|
| **Desktop normal** | Abre modal simples (título, imagem, resumo, link "Abrir matéria") |
| **Modo telão** | Opção futura: desativar interação via query param `?readonly=true` |

O modal do streaming é mais leve que o `FeedDetailDialog` do feed normal — não carrega body_text, AI facts, relacionadas.

### 5.10 Estados de UI

| Estado | Componente | Comportamento |
|---|---|---|
| **Carregando** | ShimmerGrid | Grid de placeholders com shimmer |
| **Sem itens** | EmptyState | "Nenhuma notícia encontrada. Aguardando novas matérias..." |
| **Erro na primeira carga** | EmptyState | "Sem conexão com o radar. Tentando reconectar..." + retry automático |
| **Sem novidades** | Badge no header | "Atualizado às HH:mm" (sem ação, mantém itens existentes) |
| **Reconexão** | Badge warning | "Offline — tentando reconectar" (aparece após 2 falhas seguidas) |
| **Novas recebidas** | Badge success no header | "N novas" → desaparece após 3s |

### 5.11 Comportamento com aba oculta

| Modo | Aba visível | Aba oculta |
|---|---|---|
| **Feed normal** | Polling 60s | Pausa polling (react-query padrão) |
| **Streaming** | Polling 60s | Continua polling (para uso em telão) |
| **Futuro:** | — | Query param `?pause_hidden=true` para reduzir chamadas |

**Implementação:** no `useStreamingFeed`, usar `refetchIntervalInBackground: true`.

### 5.12 Acessibilidade

| Requisito | Implementação |
|---|---|
| Fechar com Esc | `useEffect` com `keydown` listener |
| `aria-label` no botão fechar | `aria-label="Fechar modo streaming"` |
| `prefers-reduced-motion` | Desativar animações via media query |
| Contraste | Badge/tempo/fonte com ratio ≥ 4.5:1 |
| Foco visível | `focus-visible:ring-2` nos cards e botão fechar |

---

## 6. Arquivo e Rota

| Item | Caminho |
|---|---|
| Componente | `apps/web/src/pages/raspagem/streaming/FeedStreaming.tsx` |
| Hook | `apps/web/src/pages/raspagem/streaming/useStreamingFeed.ts` |
| Header | `apps/web/src/pages/raspagem/streaming/StreamingHeader.tsx` |
| Card | `apps/web/src/pages/raspagem/streaming/StreamingCard.tsx` |
| Grid | `apps/web/src/pages/raspagem/streaming/StreamingGrid.tsx` |
| Rota | `/raspagem/feed/streaming` |
| Registro | `App.tsx` — lazy import, **sem** AppShell |

### O que criar/modificar

| Ação | Arquivo | Descrição |
|---|---|---|
| **[CRIAR]** | `streaming/FeedStreaming.tsx` | Página fullscreen |
| **[CRIAR]** | `streaming/StreamingHeader.tsx` | Logo + ao vivo + timestamp + novas + fechar |
| **[CRIAR]** | `streaming/StreamingGrid.tsx` | Grid responsivo |
| **[CRIAR]** | `streaming/StreamingCard.tsx` | Card compacto |
| **[CRIAR]** | `streaming/useStreamingFeed.ts` | Hook com polling incremental |
| **[MODIFICAR]** | `Feed.tsx` (header) | Adicionar botão "Ver em Streaming" |
| **[MODIFICAR]** | `App.tsx` | Registrar rota sem AppShell |
| **[MODIFICAR]** | `constants/index.ts` | Adicionar `RASPAGEM_STREAMING` |
| **[MODIFICAR]** | `NewsItemController.php` | Adicionar filtro `after_id` |

---

## 7. Ordem de implementação recomendada

1. **Refatorar Feed.tsx** — extrair componentes (FeedHeader, FeedFilters, FeedStats, FeedList, FeedCard, FeedDetailDialog, useFeedFiltersState)
2. **Backend:** adicionar `after_id` ao `NewsItemController::index()`
3. **Criar `useStreamingFeed.ts`** — polling incremental com delta, dedupe, trim
4. **Criar `FeedStreaming.tsx`** + componentes (Header, Grid, Card)
5. **Wiring:** botão no Feed, rota no App.tsx, constant
6. **Polir:** estados vazios/erro, acessibilidade, Esc, prefers-reduced-motion

---

## 8. Riscos Conhecidos

| Risco | Impacto | Mitigação |
|---|---|---|
| Polling pode perder itens se volume > `per_page` entre polls | Itens não exibidos | Usar `after_id` em vez de `per_page` puro |
| Feed.tsx já está com 1079 linhas | Manutenibilidade | Decompor em 7+ componentes antes de crescer |
| Endpoint `/items` retorna payload mais pesado que necessário para streaming | Performance/bandwidth | v1: aceitar overhead. v2: criar `view=stream` |
| Grid vs Masonry | UX inconsistente se mudar depois | Começar com grid, migrar para masonry só sob demanda |
| Streaming em telão consome chamadas em background | Custo de API | `refetchIntervalInBackground: true` consciente. Futuramente: WebSocket ou SSE |
| Notícia antiga descoberta agora aparece no topo | Pode confundir operador | Documentar: streaming = data de ingestão, não de publicação |
