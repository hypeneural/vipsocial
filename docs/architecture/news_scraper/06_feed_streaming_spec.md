# Documentação — Feed de Notícias + Modo Streaming

## 1. Estado Atual — Visão Geral

> 3 páginas operacionais ativas + 1 página nova proposta (Streaming).
> Build servido via `apps/api/public`. Sem mock data.

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

- KPIs reais via `useNewsDashboard`
- 7 filtros server-side: busca, fonte, visão, extração, IA, urgência, cidade
- Paginação tradicional (12/página) → **será substituída por infinite scroll**
- Cards com imagem hero, badges, 5W1H, categorias, % captura
- Dialog de detalhe com body_text, AI facts, relacionadas
- Auto-refresh: `refetchInterval: 60000`
- **Ordenação:** `published_at_utc DESC`

### 2.2 Fontes (`/raspagem/fontes`) — 1112 linhas

- CRUD completo com autodetect, sync, toggle, edição avançada (crawling config JSON)

### 2.3 Filtros (`/raspagem/filtros`) — 748 linhas

- Tabs: Saúde, Diagnóstico, Preview, Seletores

---

## 3. Backend — Endpoints Ativos

**Via `ModuleServiceProvider` → `api/v1/news-radar/`**

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/sources` | Listar fontes (paginado, filtrado) |
| POST | `/sources` | Criar fonte |
| GET | `/sources/{id}` | Detalhe |
| PUT | `/sources/{id}` | Atualizar |
| DELETE | `/sources/{id}` | Remover |
| POST | `/sources/{id}/sync` | Disparar sync |
| GET | `/sources/{id}/runs` | Histórico |
| POST | `/sources/discover` | Autodetect |
| GET | `/sources/discover/{runId}/status` | Status discovery |
| POST | `/sources/preview` | Preview captura |
| POST | `/sources/test-selector` | Testar selector |
| GET | `/items` | Listar notícias (9 filtros) |
| GET | `/items/{id}` | Detalhe com AI |
| GET | `/items/{id}/related` | Relacionadas |
| GET | `/dashboard` | KPIs e totais |

### Hooks React Query

| Hook | Tipo | Intervalo |
|---|---|---|
| `useNewsDashboard` | query | 60s |
| `useNewsItems` | query | 60s |
| `useNewsItem` / `useRelatedNewsItems` | query | on-demand |
| `useNewsSources` / `useNewsSource` / `useNewsSourceRuns` | query | 60s / on-demand |
| `useNewsDiscoveryStatus` | query | 2s (polling) |
| `useCreate/Update/Delete/SyncNewsSource` | mutation | invalidate |
| `useDiscover/Preview/TestSelector` | mutation | - |

---

## 4. Decomposição do Feed.tsx + Infinite Scroll

### Estrutura nova de componentes

```
pages/raspagem/
├── Feed.tsx                         ← orquestra tudo
├── feed/
│   ├── FeedHeader.tsx               ← título + atualizar + botão streaming
│   ├── FeedStats.tsx                ← 4 KPI cards
│   ├── FeedFilters.tsx              ← painel de 7 filtros
│   ├── FeedInfiniteList.tsx         ← infinite scroll + sentinel
│   ├── FeedCard.tsx                 ← card individual
│   ├── FeedCardSkeleton.tsx         ← skeleton do card (loading)
│   ├── FeedImage.tsx                ← imagem com skeleton + fallback + fade
│   ├── FeedLoadMoreTrigger.tsx      ← sentinel com IntersectionObserver
│   └── FeedDetailDialog.tsx         ← dialog de detalhe com AI
├── hooks/
│   ├── useFeedFiltersState.ts       ← estado dos filtros + reset
│   └── useInfiniteNewsItems.ts      ← useInfiniteQuery
└── streaming/
    ├── FeedStreaming.tsx             ← página fullscreen
    ├── StreamingHeader.tsx           ← logo + ao vivo + timestamp + ✕
    ├── StreamingGrid.tsx             ← grid responsivo
    ├── StreamingCard.tsx             ← card compacto
    └── useStreamingFeed.ts           ← polling incremental com delta
```

### Feed normal vs Streaming — separação clara

| Aspecto | Feed Normal | Streaming |
|---|---|---|
| **Estratégia** | Infinite scroll por páginas | Polling incremental por delta |
| **Hook** | `useInfiniteQuery` | `useStreamingFeed` (custom) |
| **Paginação** | `page` + `getNextPageParam` | `after_id` |
| **Ordenação** | `published_at_utc DESC` | `created_at DESC` |
| **Interação** | Scroll para baixo, detalhes | Tela viva, sem navegação longa |
| **Layout** | Lista vertical com AppShell | Grid fullscreen sem AppShell |

---

## 5. Infinite Scroll — Feed Normal

### 5.1 Hook `useInfiniteNewsItems.ts`

```typescript
// Usa useInfiniteQuery do TanStack
// - queryKey inclui todos os filtros ativos
// - initialPageParam: 1
// - getNextPageParam: (lastPage) => lastPage.next_page_url ? lastPage.current_page + 1 : undefined
// - Lista final: data.pages.flatMap(page => page.data)
// - Reset automático da lista ao mudar filtros (queryKey muda → refetch)
```

**Limite de páginas em memória:** manter no máximo **5 a 8 páginas**. O TanStack alerta que páginas acumuladas são refetchadas sequencialmente — quanto mais, mais lento.

### 5.2 Sentinel (`FeedLoadMoreTrigger.tsx`)

- `IntersectionObserver` no fim da lista
- Quando entra no viewport e `hasNextPage === true` → `fetchNextPage()`
- **Fallback manual:** botão "Carregar mais" abaixo do sentinel
- Casos do fallback: observer falha, navegador lento, usuário prefere controle

### 5.3 Reset de filtros

Ao mudar qualquer filtro no `useFeedFiltersState`:
- `queryKey` muda → TanStack descarta páginas antigas
- Lista volta para página 1 automaticamente
- Scroll volta ao topo

---

## 6. Skeletons em Dois Níveis

### 6.1 Skeleton da lista (primeira carga)

Quando `status === 'loading'`:
- Renderizar 8–12 `FeedCardSkeleton`
- Cada skeleton: bloco imagem (aspect-video) + 2–3 linhas título + meta + badges falsas
- Tamanho idêntico ao card real → sem layout shift

### 6.2 Skeleton da imagem (`FeedImage.tsx`)

```
┌────────────────────┐
│ ██████████████████ │  ← shimmer bg (aspect-video)
│ ██████████████████ │  ← <img> com opacity-0
│ ██████████████████ │  ← onLoad → opacity-100 com transition
└────────────────────┘
```

- Container com `aspect-video` fixo
- Fundo skeleton (shimmer)
- `<img>` com `opacity-0` → `onLoad` → `opacity-100` com `transition-opacity duration-300`
- Evita pulos visuais, card já ocupa espaço final

### 6.3 Skeleton de próxima página

Quando `isFetchingNextPage`:
- Mostrar 3–4 `FeedCardSkeleton` no fim da lista
- Não bloqueia interação com cards existentes

---

## 7. Feature: Modo Streaming (`/raspagem/feed/streaming`)

### 7.1 Conceito

Botão **"Ver em Streaming"** (`Monitor` do lucide) no header do Feed abre tela **fullscreen sem sidebar**, com grid responsivo que se auto-atualiza a cada 60s, inserindo novas notícias no topo com animação.

### 7.2 Header do Streaming

```
┌───────────────────────────────────────────────────────────┐
│  🔴 Logo    "Ao vivo"    "Atualizado às 14:32"   "3 novas"   ✕  │
└───────────────────────────────────────────────────────────┘
```

| Elemento | Descrição |
|---|---|
| 🔴 | Círculo pulsante `bg-success` |
| "Ao vivo" | Badge fixo |
| Timestamp | Atualiza a cada refresh |
| "N novas" | Badge success, desaparece após 3s |
| ✕ | Fechar → `/raspagem/feed` |

### 7.3 Polling Incremental (Delta)

**Backend — adicionar ao `NewsItemController::index()`:**

```php
if ($request->filled('after_id')) {
    $query->where('id', '>', $request->input('after_id'));
}
```

**`useStreamingFeed.ts`:**

1. Primeira carga: `GET /items?per_page=50`
2. Próximos polls (60s): `GET /items?after_id={maxId}&per_page=50`
3. Dedupe por `Set<number>` de IDs
4. Prepend novos ao array com animação
5. Trim se > 200 itens

### 7.4 Ordenação e Deduplicação

| Campo | Uso |
|---|---|
| `id` | Dedupe (Set) + marcador delta |
| `created_at DESC` | Ordenação visual (novidade no radar, não data de publicação) |

> Notícia antiga descoberta agora entra no topo do streaming.

### 7.5 Layout: Grid Responsivo

> **Decisão:** grid responsivo tradicional. Não masonry.
> CSS columns → ordem visual estranha, cards pulam, animação imprevisível.
> Para streaming ao vivo: clareza > efeito Pinterest.

| Breakpoint | Colunas |
|---|---|
| < 640px | 1 |
| 640-1024px | 2 |
| 1024-1440px | 3 |
| > 1440px | 4 |

`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4`

**Evolução futura:** masonry com `react-masonry-css` só sob demanda explícita.

### 7.6 Card de Streaming — Contrato Mínimo

| Campo | Obrigatório | Uso |
|---|---|---|
| `id` | ✅ | dedupe + key |
| `title` | ✅ | texto principal (line-clamp-3) |
| `hero_image_url` | ❌ | imagem com fallback |
| `source.name` | ✅ | identificação |
| `created_at` | ✅ | ordenação + tempo relativo |
| `ai_metadata.urgency` | ❌ | badge condicional |
| `ai_metadata.city` | ❌ | badge condicional |
| `categories_raw` | ❌ | tags (max 3) |

> **Melhoria v2:** `GET /items?view=stream` ou `/items/stream` com payload enxuto (sem body_text/body_html).

### 7.7 Ação ao clicar

| Contexto | Comportamento |
|---|---|
| Desktop | Modal simples (título, imagem, resumo, link "Abrir matéria") |
| Modo telão | Futuro: `?readonly=true` desativa interação |

### 7.8 Estados de UI

| Estado | Componente | Comportamento |
|---|---|---|
| Carregando | ShimmerGrid | Grid de placeholders |
| Sem itens | EmptyState | "Nenhuma notícia. Aguardando novas matérias..." |
| Erro na carga | EmptyState | "Sem conexão com o radar. Tentando reconectar..." + retry |
| Sem novidades | Badge no header | "Atualizado às HH:mm" |
| Reconexão | Badge warning | "Offline" (após 2 falhas seguidas) |
| Novas recebidas | Badge success | "N novas" → some após 3s |

### 7.9 Aba Oculta

| Modo | Aba visível | Aba oculta |
|---|---|---|
| Feed normal | Polling 60s | Pausa (react-query padrão) |
| Streaming | Polling 60s | Continua (`refetchIntervalInBackground: true`) |

> Streaming mantém polling em background para uso em telão.

### 7.10 Acessibilidade

| Requisito | Implementação |
|---|---|
| Fechar com Esc | `useEffect` com `keydown` |
| `aria-label` no ✕ | `"Fechar modo streaming"` |
| `prefers-reduced-motion` | Desativa animações |
| Contraste | Ratio ≥ 4.5:1 em badges/tempo/fonte |
| Foco visível | `focus-visible:ring-2` nos cards e ✕ |

---

## 8. Performance

### Regras

| Regra | Detalhe |
|---|---|
| Páginas em memória | Max 5–8 no infinite scroll |
| Imagens | `loading="lazy"`, tamanho fixo por breakpoint, skeleton até `onLoad` |
| Virtualização | Não necessária até ~100 cards. Avaliar se crescer além disso |
| Estado duplicado | Não duplicar dados que já vêm da query |
| Streaming | Max 200 itens em memória, trim os mais antigos |
| Badge "Atualizando" | Discreta no header durante refetch |

---

## 9. Ordem de Implementação

### Etapa 1 — Refatorar Feed.tsx

1. Extrair `FeedHeader.tsx`
2. Extrair `FeedStats.tsx`
3. Extrair `FeedFilters.tsx` + `useFeedFiltersState.ts`
4. Extrair `FeedCard.tsx`
5. Extrair `FeedDetailDialog.tsx`

### Etapa 2 — Skeletons e Imagem

6. Criar `FeedCardSkeleton.tsx`
7. Criar `FeedImage.tsx` com skeleton + fade

### Etapa 3 — Infinite Scroll

8. Criar `useInfiniteNewsItems.ts`
9. Criar `FeedInfiniteList.tsx`
10. Criar `FeedLoadMoreTrigger.tsx` (IntersectionObserver + fallback)
11. Substituir paginação tradicional no `Feed.tsx`

### Etapa 4 — Backend delta

12. Adicionar `after_id` ao `NewsItemController::index()`

### Etapa 5 — Streaming

13. Criar `useStreamingFeed.ts`
14. Criar `StreamingCard.tsx`
15. Criar `StreamingGrid.tsx`
16. Criar `StreamingHeader.tsx`
17. Criar `FeedStreaming.tsx`
18. Botão no `FeedHeader.tsx` + rota no `App.tsx` + constant

### Etapa 6 — Polir

19. Estados vazios/erro em streaming
20. Acessibilidade (Esc, aria, prefers-reduced-motion)
21. Medir se precisa virtualização

---

## 10. Riscos Conhecidos

| Risco | Impacto | Mitigação |
|---|---|---|
| Polling perde itens se volume > `per_page` | Itens não exibidos | `after_id` para delta |
| Feed.tsx já com 1079 linhas | Manutenibilidade | Decompor antes de crescer |
| Endpoint `/items` payload pesado para streaming | Bandwidth | v2: `view=stream` |
| Páginas acumuladas no infinite scroll | Performance | Limitar 5–8 páginas em memória |
| Lista longa sem virtualização | DOM pesado | Avaliar virtualização acima de ~100 cards |
| Streaming em telão consome chamadas em background | Custo API | `refetchIntervalInBackground` consciente |
| Notícia antiga no topo do streaming | Pode confundir | Streaming = data ingestão, não publicação |
