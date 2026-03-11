# Documentação — Feed de Notícias + Modo Streaming

## 1. Estado Atual do Frontend (`/raspagem/feed`)

### Arquivo: `apps/web/src/pages/raspagem/Feed.tsx` (382 linhas)

**Status: 100% mock data — sem integração com API.**

| Componente | Estado | Detalhes |
|---|---|---|
| Interface visual | ✅ Pronto | Cards com imagem, badges (Novo, Duplicado, Alta Relevância), tags, ações |
| Dados | ❌ Mock | Array `mockItems[]` hardcoded com 6 itens |
| Filtros | ⚠️ Parcial | Filtro por status (todos/novos/duplicados/alta relevância) + busca por texto — local only |
| Stats cards | ❌ Mock | "Itens/min", "Tempo médio", "Na fila" — valores fixos |
| Ações dos cards | ❌ Stub | "Criar Rascunho", "Tags", "Duplicado", "Ignorar", "Abrir" — sem lógica real |
| Paginação | ❌ Não existe | Mostra array completo, sem paginação |
| Auto-refresh | ❌ Não existe | Botão "Atualizar" faz fake refresh (setTimeout 1s) |

### Stack de UI usada
- `AppShell` (layout com sidebar)
- `framer-motion` (AnimatePresence, stagger animations)
- shadcn/ui: `Button`, `Badge`, `Input`, `Select`
- Ícones: `lucide-react`

---

## 2. Estado Atual do Backend (`/api/v1/news-radar/`)

### Roteamento: **Ativo em produção ✅**

O `ModuleServiceProvider` carrega automaticamente `app/Modules/*/routes.php` sob o prefixo `api/v1`.
O módulo `NewsRadar` tem `routes.php` registrado → endpoints estão acessíveis.

> **Não existe sistema legado de raspagem.** As páginas `Feed.tsx`, `Fontes.tsx`, `Filtros.tsx` são placeholders 100% mock criados como protótipos de UI. Nunca estiveram conectados a nenhum backend. O módulo NewsRadar que criamos **é** o backend.

### Endpoints disponíveis (13 módulos ativos)

| Módulo | Rotas |
|---|---|
| **NewsRadar** | 12 endpoints sob `/api/v1/news-radar/` |
| Alertas, Analytics, Auth, Config, Enquetes, Externas, Pessoas, Roteiros, Social, Users, VipGallery, WhatsApp | Módulos existentes do sistema |

### Controller: `NewsItemController.php` (125 linhas) — **Funcional**

**`GET /api/v1/news-radar/items`** — Listagem com filtros:

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `source_id` | int | Filtrar por fonte |
| `extraction_status` | string | `pending`, `extracted`, `extraction_failed` |
| `enrichment_status` | string | `none`, `enriched_l1`, `enriched_l2`, `enrichment_failed` |
| `search` | string | Busca em `title` e `excerpt` |
| `date_from` | datetime | Data início |
| `date_to` | datetime | Data fim |
| `city` | string | Cidade (via AI metadata) |
| `theme_id` | int | Tema editorial (via AI metadata) |
| `urgency` | string | `baixa`, `media`, `alta` (via AI metadata) |
| `per_page` | int | Itens por página (default: 20) |

**Ordenação:** `published_at_utc DESC` (fixo)

**Includes automáticos:**
- `source:id,name,source_type`
- `aiMetadata:id,news_item_id,city,urgency,relevance_score,news_theme_id`

**Outros endpoints:**
- `GET /items/{id}` — Detalhe com source, aiMetadata, media, rawItem
- `GET /items/{id}/related` — 5 notícias relacionadas (mesma fonte, últimos 7 dias)
- `GET /dashboard` — Totais por status, por fonte, fontes com falha

### Tabelas no banco — **Migradas ✅**

10 tabelas criadas via migration: `news_themes`, `news_sources`, `news_source_runs`, `source_discovery_runs`, `news_raw_items`, `news_items`, `news_item_media`, `news_item_ai_metadata`, `news_clusters`, `news_cluster_items`.

### Service Layer (TypeScript) — **Não existe**

Precisa criar `newsRadar.service.ts` seguindo o padrão de `alerta.service.ts` (usa `import api from "./api"`, Axios, baseURL `/api/v1`).


---

## 3. O que precisa ser feito para integrar a página Feed

### 3.1 Criar `apps/web/src/services/newsRadar.service.ts`

Padrão a seguir: `alerta.service.ts` — usa `import api from "./api"` (Axios, baseURL `/api/v1`).

```typescript
// Endpoints a mapear:
newsItemService.getAll(params)       → GET /news-radar/items
newsItemService.getById(id)          → GET /news-radar/items/{id}
newsItemService.getRelated(id)       → GET /news-radar/items/{id}/related
newsRadarDashboard.getStats()        → GET /news-radar/dashboard
newsSourceService.getAll(params)     → GET /news-radar/sources
newsSourceService.sync(id)           → POST /news-radar/sources/{id}/sync
```

### 3.2 Criar `apps/web/src/types/newsRadar.ts`

```typescript
interface NewsItem {
  id: number;
  title: string;
  subtitle?: string;
  excerpt?: string;
  hero_image_url?: string;
  url: string;
  raw_url: string;
  author_raw?: string;
  author_normalized?: string;
  published_at_utc?: string;
  extraction_status: string;
  enrichment_status: string;
  extraction_completeness: number;
  content_source: string;
  categories_raw?: string[];
  source: { id: number; name: string; source_type: string };
  ai_metadata?: {
    city?: string;
    urgency?: string;
    relevance_score?: number;
    news_theme_id?: number;
  };
}
```

### 3.3 Reescrever `Feed.tsx`

Remover `mockItems` e `statsData`. Usar:
- `useEffect` + `newsItemService.getAll()` para carregar dados
- `newsRadarDashboard.getStats()` para stats cards
- Paginação real (scroll infinito ou botão "Carregar mais")

---

## 4. Feature: Modo Streaming (`/raspagem/feed/streaming`)

### 4.1 Conceito

Um botão **"Ver em Streaming"** com ícone de TV (📺 `Monitor` do lucide-react) na página do Feed abre uma **tela fullscreen sem sidebar/topbar**, exibindo notícias em **Masonry Layout** que se auto-atualiza a cada 60 segundos, inserindo novas notícias no topo com animação suave.

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
- `setInterval` a cada **60 segundos**
- Request: `GET /news-radar/items?per_page=50&date_from={lastFetchTimestamp}`
- Manter `lastFetchTimestamp` = data da última chamada
- Novos itens → prepend ao array (manter no máximo ~200 itens em memória, remover os mais antigos)
- Animação de entrada: `framer-motion` `AnimatePresence` com `initial={{ opacity: 0, y: -30 }}`

#### Deduplicação no frontend
- Manter `Set<number>` de IDs já exibidos
- Ao receber novos, filtrar itens com ID já no Set
- Só animar entrada de itens genuinamente novos

#### Indicador visual de atualização
- Ao buscar: mostrar barra de progresso sutil no topo (shimmer/pulse)
- Ao inserir novos: badge temporário "N novas" que desaparece após 3s
- Erro de conexão: badge discreto "Offline — tentando reconectar"

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
| < 640px (mobile) | 1 | 100% |
| 640-1024px (tablet) | 2 | ~50% |
| 1024-1440px (desktop) | 3 | ~33% |
| > 1440px (wide) | 4 | ~25% |

### 4.6 Arquivo e Rota

| Item | Caminho |
|---|---|
| Componente | `apps/web/src/pages/raspagem/FeedStreaming.tsx` |
| Rota | `/raspagem/feed/streaming` |
| Registro | `App.tsx` — lazy import, **sem** `AppShell` wrapper |

### 4.7 Alterações necessárias em `Feed.tsx`

Adicionar no header (ao lado do botão "Atualizar"):

```tsx
<Button onClick={() => navigate('/raspagem/feed/streaming')} variant="outline" className="rounded-xl">
  <Monitor className="w-4 h-4 mr-2" />
  Ver em Streaming
</Button>
```

---

## 5. Endpoint backend para polling eficiente

O endpoint atual `GET /items` já suporta `date_from`, mas para polling eficiente seria ideal adicionar:

### 5.1 Parâmetro `after_id` (opcional, v2)

```
GET /news-radar/items?after_id=1234&per_page=50
```

Retorna apenas itens com `id > after_id`. Mais eficiente que `date_from` porque evita itens com timestamp igual.

> **Para a v1:** usar `date_from` com o timestamp da última chamada é suficiente.

---

## 6. Resumo de arquivos a criar/modificar

| Ação | Arquivo |
|---|---|
| **[CRIAR]** | `apps/web/src/services/newsRadar.service.ts` |
| **[CRIAR]** | `apps/web/src/types/newsRadar.ts` |
| **[CRIAR]** | `apps/web/src/pages/raspagem/FeedStreaming.tsx` |
| **[MODIFICAR]** | `apps/web/src/pages/raspagem/Feed.tsx` — integrar API + botão Streaming |
| **[MODIFICAR]** | `apps/web/src/App.tsx` — registrar rota `/raspagem/feed/streaming` |
| **[MODIFICAR]** | `apps/web/src/constants/index.ts` — adicionar `RASPAGEM_STREAMING` |
