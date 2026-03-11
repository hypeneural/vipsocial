# Documentação — Feed de Notícias + Modo Streaming

## 1. Estado Atual — Visão Geral

> **Todas as 3 páginas estão 100% integradas com o backend e em produção.**
> Build é servido via `apps/api/public`. Não há mock data em nenhuma página.

| Camada | Arquivo | Linhas | Status |
|---|---|---|---|
| Service TS | `services/newsRadar.service.ts` | 452 | ✅ 14 métodos, tipagem completa |
| Hooks | `hooks/useNewsRadar.ts` | 179 | ✅ react-query, refetch 60s, mutations |
| Feed | `pages/raspagem/Feed.tsx` | 1079 | ✅ Listagem real com filtros, detalhe, AI |
| Fontes | `pages/raspagem/Fontes.tsx` | 1112 | ✅ CRUD, sync, autodetect, edição |
| Filtros | `pages/raspagem/Filtros.tsx` | 748 | ✅ Diagnóstico, preview, test-selector |
| Backend | `NewsItemController.php` | 125 | ✅ 12 endpoints, 9 filtros |

---

## 2. Frontend — Detalhamento por Página

### 2.1 Feed (`/raspagem/feed`) — 1079 linhas

**Funcionalidades operacionais:**
- KPI cards reais: fontes ativas, itens hoje, fontes com falha, itens na semana (via `useNewsDashboard`)
- 7 filtros server-side: busca texto, fonte, visão (duplicados/alta relevância/últimas 6h), status extração, status IA, urgência, cidade
- Listagem paginada: 12 itens/página, paginação real com `page` e `per_page`
- Cards com: imagem hero (lazy load + fallback), badges (Novo, Duplicado, Alta Relevância, status extração/IA), fonte+hostname+tempo relativo, resumo, 5W1H quick facts (Quem/O quê/Onde), categorias, % captura, cidade, urgência
- Dialog de detalhe: carrega `getItemById()` com body_text, imagem ampliada, contexto (fonte, data, cidade, relevância %, qualidade captura), leitura IA completa (5W1H + summary bullets), notícias relacionadas (via `getRelatedItems()`)
- Auto-refresh: `refetchInterval: 60000` no react-query (dashboard + items + sources)

### 2.2 Fontes (`/raspagem/fontes`) — 1112 linhas

**Funcionalidades operacionais:**
- KPI cards: total filtrado, ativas, com falha, itens hoje
- 3 filtros: busca por nome/domínio, status (ativas/pausadas/com falha), tipo (portal/prefeitura/blog/agência/WhatsApp)
- Listagem paginada com 12 fontes/página
- Cards com: badge status dinâmico (Saudável/Em alerta/Sincronizando/Pausada), tipo, URL, discovery_mode, métricas operacionais (última sync, taxa sucesso, tempo médio, itens encontrados, falhas seguidas)
- Ações: toggle ativa/pausada (Switch), Sync (dispara job), Editar, Abrir site, Remover (com confirm)
- Dialog create/edit completo: nome, URL + botão Detectar (autodetect via `discoverSource`), tipo, discovery mode, fetch detail mode, feed quality profile, preset, timezone, JS required, notas, crawling config (JSON), throttle config (JSON), date formats
- Autodetect infere preset, feed quality, discovery mode, crawling config automaticamente

### 2.3 Filtros (`/raspagem/filtros`) — 748 linhas

**Funcionalidades operacionais (diagnóstico + ferramentas):**
- Tab "Saúde": KPIs do dashboard, fontes com mais falhas, itens com falha de extração, itens com falha de IA
- Tab "Diagnostico": ferramenta de autodetect (descobre feed/sitemap de qualquer URL), raw JSON do resultado, sugestão de configuração
- Tab "Preview": testa captura em modo feed ou html_listing, mostra preview dos itens encontrados
- Tab "Seletores": testa CSS selectors contra uma URL, mostra matches + HTML/text extraído

---

## 3. Backend — Endpoints Ativos

**Registrados via `ModuleServiceProvider` → `api/v1/news-radar/`**

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

### Service Layer TypeScript (`newsRadar.service.ts`)

14 métodos mapeando todos os endpoints. Tipagem completa com interfaces para: `NewsItem`, `NewsSource`, `NewsSourceRun`, `NewsItemAiMetadata`, `NewsDashboard`, DTOs de criação/edição, payloads de discovery/preview/selector.

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
| `useCreateNewsSource` | mutation | - |
| `useUpdateNewsSource` | mutation | - |
| `useDeleteNewsSource` | mutation | - |
| `useSyncNewsSource` | mutation | - |
| `useDiscoverNewsSource` | mutation | - |
| `usePreviewNewsSource` | mutation | - |
| `useTestNewsSelector` | mutation | - |

---

## 4. Feature: Modo Streaming (`/raspagem/feed/streaming`)

### 4.1 Conceito

Um botão **"Ver em Streaming"** com ícone de TV (`Monitor` do lucide-react) na página do Feed abre uma **tela fullscreen sem sidebar/topbar**, exibindo notícias em **Masonry Layout** que se auto-atualiza a cada 60 segundos, inserindo novas notícias no topo com animação suave.

### 4.2 UX Flow

```
/raspagem/feed
  └─ Botão "Ver em Streaming" (ícone Monitor/TV)
       └─ Abre /raspagem/feed/streaming (fullscreen, sem AppShell)
            ├─ Botão ✕ no canto superior direito → volta para /raspagem/feed
            ├─ Masonry grid de cards de notícias
            ├─ Auto-refresh a cada 60s (polling)
            └─ Novas notícias entram no topo com animação (slide-down + fade-in)
```

### 4.3 Requisitos Técnicos

#### Layout Streaming
- **Sem AppShell** — tela cheia, fundo escuro (`bg-background`)
- **Header mínimo:** logo pequeno à esquerda + contador de notícias + botão ✕ à direita
- **Masonry Grid** — `CSS columns` ou `react-masonry-css` (auto-responsive: 1→2→3→4 colunas)
- **Cards compactos** — imagem hero (aspect-ratio), título, fonte+data, badge de urgência

#### Auto-refresh (Polling)

Já temos o padrão no hook `useNewsItems` com `refetchInterval: 60000`. Para o streaming:

- Reutilizar `useNewsItems` com `per_page: 50`
- Manter `Set<number>` de IDs exibidos para dedup no frontend
- Novos itens → prepend ao array com animação
- Manter ~200 itens em memória (remover os mais antigos)
- `framer-motion AnimatePresence` com `initial={{ opacity: 0, y: -30 }}`

#### Indicador visual de atualização
- Shimmer sutil no topo ao buscar
- Badge temporário "N novas" que desaparece após 3s
- Erro de conexão: badge discreto "Offline"

### 4.4 Componente: `StreamingCard`

```
┌──────────────────────┐
│ ┌──────────────────┐ │
│ │   Hero Image     │ │   ← aspect-ratio: 16/9, object-cover, rounded-t
│ └──────────────────┘ │
│                      │
│ 🔴 Alta              │   ← Badge urgência (só se media/alta)
│ Título da notícia... │   ← line-clamp-3, font-semibold
│                      │
│ 📰 Fonte • 2 min     │   ← source.name + tempo relativo
│ 🏙️ Itapema           │   ← cidade (se AI metadata existir)
│                      │
│ #economia #política  │   ← categories_raw (max 3 tags)
└──────────────────────┘
```

### 4.5 Comportamento responsivo

| Breakpoint | Colunas | Card width aprox |
|---|---|---|
| < 640px | 1 | 100% |
| 640-1024px | 2 | ~50% |
| 1024-1440px | 3 | ~33% |
| > 1440px | 4 | ~25% |

### 4.6 Arquivo e Rota

| Item | Caminho |
|---|---|
| Componente | `apps/web/src/pages/raspagem/FeedStreaming.tsx` |
| Rota | `/raspagem/feed/streaming` |
| Registro | `App.tsx` — lazy import, **sem** `AppShell` wrapper |

### 4.7 O que criar/modificar

| Ação | Arquivo | Descrição |
|---|---|---|
| **[CRIAR]** | `pages/raspagem/FeedStreaming.tsx` | Página fullscreen com masonry |
| **[MODIFICAR]** | `pages/raspagem/Feed.tsx` | Adicionar botão "Ver em Streaming" no header |
| **[MODIFICAR]** | `App.tsx` | Registrar rota `/raspagem/feed/streaming` |
| **[MODIFICAR]** | `constants/index.ts` | Adicionar `RASPAGEM_STREAMING` |

> **Não precisa** criar service/hooks — já existe `newsRadar.service.ts` e `useNewsRadar.ts` com tudo necessário.
