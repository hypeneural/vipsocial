import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    Brain,
    Clock,
    ExternalLink,
    FileSearch,
    Globe,
    Image as ImageIcon,
    Layers3,
    RefreshCw,
    Rss,
    Search,
    ShieldAlert,
    Sparkles,
    TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { ShimmerKPI, ShimmerList, ShimmerText } from "@/components/Shimmer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    useNewsDashboard,
    useNewsItem,
    useNewsItems,
    useNewsSources,
    useRelatedNewsItems,
} from "@/hooks/useNewsRadar";
import type { NewsItem } from "@/services/newsRadar.service";
import { cn } from "@/lib/utils";

type FeedView = "all" | "duplicates" | "high" | "recent";

const HIGH_RELEVANCE_SCORE = 0.7;

const extractionLabels: Record<string, string> = {
    pending: "Pendente",
    extracted: "Extraida",
    extraction_failed: "Falhou",
};

const enrichmentLabels: Record<string, string> = {
    none: "Sem IA",
    enriched_l1: "IA L1",
    enriched_l2: "IA L2",
    enrichment_failed: "IA falhou",
};

const urgencyLabels: Record<string, string> = {
    baixa: "Baixa",
    media: "Media",
    alta: "Alta",
};

const aiFactLabels = {
    who: "Quem",
    what: "O que",
    where: "Onde",
    when: "Quando",
    why: "Por que",
    how: "Como",
} as const;

const listingAiFactKeys = ["who", "what", "where"] as const;

type AiFactKey = keyof typeof aiFactLabels;

function formatRelativeTime(dateString?: string | null): string {
    if (!dateString) return "sem data";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "sem data";

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "agora";
    if (diffMinutes < 60) return `ha ${diffMinutes} min`;
    if (diffHours < 24) return `ha ${diffHours}h`;
    if (diffDays === 1) return "ontem";
    return `ha ${diffDays} dias`;
}

function formatDateTime(dateString?: string | null): string {
    if (!dateString) return "Sem data";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Sem data";

    return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

function getHostname(url?: string | null): string {
    if (!url) return "sem host";

    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
    }
}

function getSummary(item: NewsItem): string {
    if (item.excerpt?.trim()) return item.excerpt.trim();
    if (item.body_text?.trim()) return item.body_text.trim().slice(0, 260);
    if (item.subtitle?.trim()) return item.subtitle.trim();
    return "Sem resumo disponivel.";
}

function isRecentItem(item: NewsItem): boolean {
    if (!item.published_at_utc) return false;
    const publishedAt = new Date(item.published_at_utc).getTime();
    if (Number.isNaN(publishedAt)) return false;
    return Date.now() - publishedAt <= 1000 * 60 * 60 * 6;
}

function normalizeAiValue(value: unknown): string | null {
    if (typeof value === "string") {
        const normalized = value.trim();
        return normalized || null;
    }

    if (Array.isArray(value)) {
        const normalized = value
            .map((entry) => String(entry ?? "").trim())
            .filter(Boolean)
            .join(", ");

        return normalized || null;
    }

    return null;
}

function getAiFacts(
    item?: NewsItem | null,
    keys: readonly AiFactKey[] = Object.keys(aiFactLabels) as AiFactKey[],
) {
    const fiveWs = item?.ai_metadata?.five_ws;
    if (!fiveWs) return [];

    return keys
        .map((key) => {
            const value = normalizeAiValue(fiveWs[key]);
            if (!value) return null;

            return {
                key,
                label: aiFactLabels[key],
                value,
            };
        })
        .filter(
            (
                fact,
            ): fact is {
                key: AiFactKey;
                label: string;
                value: string;
            } => Boolean(fact),
        );
}

function getCaptureBadgeLabel(percentage: number): string {
    return `Captura ${percentage}%`;
}

function getCaptureQualityLabel(percentage: number): string {
    if (percentage >= 90) return "Alta";
    if (percentage >= 70) return "Boa";
    return "Parcial";
}

function formatAiStage(stage?: string | null): string {
    if (stage === "classification") return "Classificacao";
    if (stage === "editorial") return "Editorial";
    return stage || "IA";
}

function getLatestFailedAiLog(item?: NewsItem | null) {
    return item?.ai_logs?.find((log) => log.status === "failed") ?? null;
}

function FeedCardImage({ item }: { item: NewsItem }) {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [item.hero_image_url]);

    if (!item.hero_image_url || hasError) {
        return (
            <div className="hidden w-28 flex-shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/40 px-3 py-4 sm:flex md:w-36">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                <span className="text-center text-[11px] leading-tight text-muted-foreground">
                    Imagem indisponivel
                </span>
            </div>
        );
    }

    return (
        <div className="hidden w-28 flex-shrink-0 overflow-hidden rounded-xl sm:block md:w-36">
            <img
                src={item.hero_image_url}
                alt={item.title}
                className="h-20 w-full object-cover md:h-24"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setHasError(true)}
            />
        </div>
    );
}

function FeedDetailImage({ item }: { item: NewsItem }) {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [item.hero_image_url]);

    if (!item.hero_image_url || hasError) {
        const message = item.hero_image_url
            ? "A materia tem imagem cadastrada, mas a origem nao entregou a miniatura para o admin."
            : "Esta materia nao trouxe uma imagem utilizavel para exibicao no painel.";

        return (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10">
                <div className="flex flex-col items-center gap-3 text-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <div className="space-y-1">
                        <p className="font-medium">Imagem indisponivel</p>
                        <p className="text-sm text-muted-foreground">
                            {message}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-border/50">
            <img
                src={item.hero_image_url}
                alt={item.title}
                className="max-h-[340px] w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setHasError(true)}
            />
        </div>
    );
}

const RaspagemFeed = () => {
    const [search, setSearch] = useState("");
    const [city, setCity] = useState("");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [extractionFilter, setExtractionFilter] = useState("all");
    const [enrichmentFilter, setEnrichmentFilter] = useState("all");
    const [urgencyFilter, setUrgencyFilter] = useState("all");
    const [viewFilter, setViewFilter] = useState<FeedView>("all");
    const [page, setPage] = useState(1);
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

    const deferredSearch = useDeferredValue(search);
    const deferredCity = useDeferredValue(city);

    const itemFilters = useMemo(
        () => ({
            page,
            per_page: 12,
            search: deferredSearch.trim() || undefined,
            city: deferredCity.trim() || undefined,
            source_id: sourceFilter === "all" ? undefined : Number(sourceFilter),
            extraction_status:
                extractionFilter === "all" ? undefined : extractionFilter,
            enrichment_status:
                enrichmentFilter === "all" ? undefined : enrichmentFilter,
            urgency: urgencyFilter === "all" ? undefined : urgencyFilter,
        }),
        [
            page,
            deferredSearch,
            deferredCity,
            sourceFilter,
            extractionFilter,
            enrichmentFilter,
            urgencyFilter,
        ],
    );

    const dashboardQuery = useNewsDashboard();
    const sourcesQuery = useNewsSources({
        per_page: 100,
        sort: "name",
        dir: "asc",
    });
    const itemsQuery = useNewsItems(itemFilters);
    const itemDetailQuery = useNewsItem(selectedItemId ?? undefined);
    const relatedItemsQuery = useRelatedNewsItems(selectedItemId ?? undefined);

    const visibleItems = useMemo(() => {
        const serverItems = itemsQuery.data?.data ?? [];

        return serverItems.filter((item) => {
            const highRelevance = (item.ai_metadata?.relevance_score ?? 0) >= HIGH_RELEVANCE_SCORE;

            if (viewFilter === "duplicates" && !item.is_duplicate_candidate) {
                return false;
            }

            if (viewFilter === "high" && !highRelevance) {
                return false;
            }

            if (viewFilter === "recent" && !isRecentItem(item)) {
                return false;
            }

            return true;
        });
    }, [itemsQuery.data?.data, viewFilter]);

    const dashboard = dashboardQuery.data;
    const pagination = itemsQuery.data;
    const selectedItem = itemDetailQuery.data;
    const selectedPrimaryFacts = getAiFacts(selectedItem, listingAiFactKeys);
    const selectedAllFacts = getAiFacts(selectedItem);
    const latestAiFailure = getLatestFailedAiLog(selectedItem);
    const recentAiLogs = selectedItem?.ai_logs?.slice(0, 5) ?? [];

    const isRefreshing =
        dashboardQuery.isFetching || itemsQuery.isFetching || sourcesQuery.isFetching;

    const refreshAll = () => {
        dashboardQuery.refetch();
        itemsQuery.refetch();
        sourcesQuery.refetch();

        if (selectedItemId) {
            itemDetailQuery.refetch();
            relatedItemsQuery.refetch();
        }
    };

    const resetToFirstPage = () => {
        startTransition(() => setPage(1));
    };

    return (
        <AppShell>
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <motion.div
                                animate={{ scale: [1, 1.15, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="h-3 w-3 rounded-full bg-success"
                            />
                            <h1 className="text-xl font-bold md:text-2xl">Feed ao vivo</h1>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Itens reais do modulo NewsRadar com filtros operacionais e diagnostico.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={refreshAll}
                        disabled={isRefreshing}
                    >
                        <RefreshCw
                            className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")}
                        />
                        Atualizar
                    </Button>
                </div>
            </motion.div>

            <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {dashboardQuery.isLoading ? (
                    <>
                        <ShimmerKPI />
                        <ShimmerKPI />
                        <ShimmerKPI />
                        <ShimmerKPI />
                    </>
                ) : (
                    <>
                        <div className="rounded-2xl border border-border/50 bg-card p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Rss className="h-4 w-4 text-primary" />
                                Fontes ativas
                            </div>
                            <p className="mt-1 text-2xl font-bold">
                                {dashboard?.total_sources ?? 0}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-success/30 bg-success/10 p-4">
                            <div className="flex items-center gap-2 text-sm text-success">
                                <TrendingUp className="h-4 w-4" />
                                Itens hoje
                            </div>
                            <p className="mt-1 text-2xl font-bold text-success">
                                {dashboard?.items_today ?? 0}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
                            <div className="flex items-center gap-2 text-sm text-warning">
                                <ShieldAlert className="h-4 w-4" />
                                Fontes com falha
                            </div>
                            <p className="mt-1 text-2xl font-bold text-warning">
                                {dashboard?.sources_with_failures ?? 0}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-border/50 bg-card p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Layers3 className="h-4 w-4 text-info" />
                                Itens na semana
                            </div>
                            <p className="mt-1 text-2xl font-bold">
                                {dashboard?.items_this_week ?? 0}
                            </p>
                        </div>
                    </>
                )}
            </div>

            <div className="mb-6 space-y-3 rounded-2xl border border-border/50 bg-card p-4">
                <div className="grid gap-3 lg:grid-cols-[2fr,1fr,1fr]">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                resetToFirstPage();
                            }}
                            placeholder="Buscar por titulo ou resumo"
                            className="rounded-xl pl-10"
                        />
                    </div>

                    <Select
                        value={sourceFilter}
                        onValueChange={(value) => {
                            startTransition(() => {
                                setSourceFilter(value);
                                setPage(1);
                            });
                        }}
                    >
                        <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Fonte" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as fontes</SelectItem>
                            {(sourcesQuery.data?.data ?? []).map((source) => (
                                <SelectItem key={source.id} value={String(source.id)}>
                                    {source.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={viewFilter}
                        onValueChange={(value: FeedView) => setViewFilter(value)}
                    >
                        <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Visao" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tudo</SelectItem>
                            <SelectItem value="duplicates">Duplicados</SelectItem>
                            <SelectItem value="high">Alta relevancia</SelectItem>
                            <SelectItem value="recent">Ultimas 6h</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Select
                        value={extractionFilter}
                        onValueChange={(value) => {
                            startTransition(() => {
                                setExtractionFilter(value);
                                setPage(1);
                            });
                        }}
                    >
                        <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Extracao" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toda extracao</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="extracted">Extraida</SelectItem>
                            <SelectItem value="extraction_failed">Falhou</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={enrichmentFilter}
                        onValueChange={(value) => {
                            startTransition(() => {
                                setEnrichmentFilter(value);
                                setPage(1);
                            });
                        }}
                    >
                        <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="IA" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toda IA</SelectItem>
                            <SelectItem value="none">Sem IA</SelectItem>
                            <SelectItem value="enriched_l1">Enriquecida L1</SelectItem>
                            <SelectItem value="enriched_l2">Enriquecida L2</SelectItem>
                            <SelectItem value="enrichment_failed">IA falhou</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={urgencyFilter}
                        onValueChange={(value) => {
                            startTransition(() => {
                                setUrgencyFilter(value);
                                setPage(1);
                            });
                        }}
                    >
                        <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Urgencia" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Qualquer urgencia</SelectItem>
                            <SelectItem value="baixa">Baixa</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                    </Select>

                    <Input
                        value={city}
                        onChange={(event) => {
                            setCity(event.target.value);
                            resetToFirstPage();
                        }}
                        placeholder="Cidade exata da IA"
                        className="rounded-xl"
                    />
                </div>
            </div>

            {itemsQuery.isLoading ? (
                <ShimmerList count={4} />
            ) : visibleItems.length === 0 ? (
                <EmptyState
                    icon={Rss}
                    title="Nenhum item encontrado"
                    description="Ajuste os filtros ou sincronize novas fontes para popular o feed."
                />
            ) : (
                <div className="space-y-3 pb-20 md:pb-0">
                    {visibleItems.map((item, index) => {
                        const highRelevance =
                            (item.ai_metadata?.relevance_score ?? 0) >= HIGH_RELEVANCE_SCORE;
                        const quickFacts = getAiFacts(item, listingAiFactKeys);

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                className={cn(
                                    "overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md",
                                    item.is_duplicate_candidate &&
                                        "border-warning/40 bg-warning/5",
                                    !item.is_duplicate_candidate &&
                                        highRelevance &&
                                        "border-primary/40 bg-primary/5",
                                    !item.is_duplicate_candidate &&
                                        !highRelevance &&
                                        "border-border/50",
                                )}
                            >
                                <div className="p-4">
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                        {isRecentItem(item) && (
                                            <Badge className="rounded-full bg-success/15 text-success">
                                                <Sparkles className="mr-1 h-3 w-3" />
                                                Novo
                                            </Badge>
                                        )}

                                        {item.is_duplicate_candidate && (
                                            <Badge className="rounded-full bg-warning/15 text-warning">
                                                <AlertTriangle className="mr-1 h-3 w-3" />
                                                Duplicado
                                            </Badge>
                                        )}

                                        {highRelevance && (
                                            <Badge className="rounded-full bg-primary/15 text-primary">
                                                <Brain className="mr-1 h-3 w-3" />
                                                Alta relevancia
                                            </Badge>
                                        )}

                                        <Badge variant="outline" className="rounded-full">
                                            {extractionLabels[item.extraction_status] ??
                                                item.extraction_status}
                                        </Badge>

                                        <Badge variant="outline" className="rounded-full">
                                            {enrichmentLabels[item.enrichment_status] ??
                                                item.enrichment_status}
                                        </Badge>
                                    </div>

                                    <div className="flex gap-4">
                                        <FeedCardImage item={item} />

                                        <div className="min-w-0 flex-1">
                                            <h3 className="mb-2 text-sm font-semibold md:text-base">
                                                {item.title}
                                            </h3>

                                            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Globe className="h-3 w-3" />
                                                    <span className="font-medium text-foreground/80">
                                                        {item.source?.name ?? "Fonte desconhecida"}
                                                    </span>
                                                </span>
                                                <span>•</span>
                                                <span>{getHostname(item.url)}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatRelativeTime(item.published_at_utc)}
                                                </span>
                                            </div>

                                            <p className="line-clamp-3 text-sm text-muted-foreground">
                                                {getSummary(item)}
                                            </p>

                                            {quickFacts.length > 0 && (
                                                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                                    {quickFacts.map((fact) => (
                                                        <div
                                                            key={`${item.id}-${fact.key}`}
                                                            className="min-w-0 rounded-xl border border-border/50 bg-background/70 p-2.5"
                                                        >
                                                            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                                                {fact.label}
                                                            </p>
                                                            <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground/90">
                                                                {fact.value}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                                {item.ai_metadata?.city && (
                                                    <Badge variant="secondary" className="rounded-full">
                                                        {item.ai_metadata.city}
                                                    </Badge>
                                                )}
                                                {item.ai_metadata?.urgency && (
                                                    <Badge variant="secondary" className="rounded-full">
                                                        {urgencyLabels[item.ai_metadata.urgency] ??
                                                            item.ai_metadata.urgency}
                                                    </Badge>
                                                )}
                                                <Badge variant="secondary" className="rounded-full">
                                                    {getCaptureBadgeLabel(item.extraction_completeness)}
                                                </Badge>
                                                {!!item.categories_raw?.length &&
                                                    item.categories_raw
                                                        .slice(0, 3)
                                                        .map((category) => (
                                                            <Badge
                                                                key={`${item.id}-${category}`}
                                                                variant="secondary"
                                                                className="rounded-full"
                                                            >
                                                                {category}
                                                            </Badge>
                                                        ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
                                        <Button
                                            className="rounded-lg"
                                            size="sm"
                                            onClick={() => setSelectedItemId(item.id)}
                                        >
                                            <FileSearch className="mr-1 h-3 w-3" />
                                            Detalhes
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-lg"
                                            onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
                                        >
                                            <ExternalLink className="mr-1 h-3 w-3" />
                                            Abrir origem
                                        </Button>

                                        <div className="ml-auto text-xs text-muted-foreground">
                                            {formatDateTime(item.published_at_utc)}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {pagination && pagination.last_page > 1 && (
                <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border/50 bg-card p-4 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {(pagination.current_page - 1) * pagination.per_page + 1} a{" "}
                        {Math.min(
                            pagination.current_page * pagination.per_page,
                            pagination.total,
                        )}{" "}
                        de {pagination.total} itens
                    </p>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            disabled={pagination.current_page === 1}
                            onClick={() =>
                                startTransition(() => setPage((current) => Math.max(1, current - 1)))
                            }
                        >
                            Anterior
                        </Button>
                        <div className="text-sm text-muted-foreground">
                            Pagina {pagination.current_page} de {pagination.last_page}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            disabled={pagination.current_page >= pagination.last_page}
                            onClick={() =>
                                startTransition(() =>
                                    setPage((current) =>
                                        Math.min(pagination.last_page, current + 1),
                                    ),
                                )
                            }
                        >
                            Proxima
                        </Button>
                    </div>
                </div>
            )}

            <Dialog
                open={Boolean(selectedItemId)}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedItemId(null);
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedItem?.title ?? "Detalhes da noticia"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedItem
                                ? `${selectedItem.source?.name ?? "Fonte"} • ${formatDateTime(
                                      selectedItem.published_at_utc,
                                  )}`
                                : "Carregando item selecionado..."}
                        </DialogDescription>
                    </DialogHeader>

                    {itemDetailQuery.isLoading ? (
                        <div className="space-y-4">
                            <ShimmerText width="45%" />
                            <ShimmerText width="80%" />
                            <ShimmerText width="70%" />
                        </div>
                    ) : selectedItem ? (
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="rounded-full">
                                    {extractionLabels[selectedItem.extraction_status] ??
                                        selectedItem.extraction_status}
                                </Badge>
                                <Badge variant="outline" className="rounded-full">
                                    {enrichmentLabels[selectedItem.enrichment_status] ??
                                        selectedItem.enrichment_status}
                                </Badge>
                                {selectedItem.ai_metadata?.urgency && (
                                    <Badge className="rounded-full bg-warning/15 text-warning">
                                        {urgencyLabels[selectedItem.ai_metadata.urgency] ??
                                            selectedItem.ai_metadata.urgency}
                                    </Badge>
                                )}
                                {selectedItem.is_duplicate_candidate && (
                                    <Badge className="rounded-full bg-warning/15 text-warning">
                                        Possivel duplicado
                                    </Badge>
                                )}
                            </div>

                            <FeedDetailImage item={selectedItem} />

                            {selectedPrimaryFacts.length > 0 && (
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {selectedPrimaryFacts.map((fact) => (
                                        <div
                                            key={`selected-${fact.key}`}
                                            className="rounded-2xl border border-border/50 bg-background/70 p-4"
                                        >
                                            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                                {fact.label}
                                            </p>
                                            <p className="mt-2 text-sm font-semibold leading-6">
                                                {fact.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                                <div className="space-y-4">
                                    {selectedItem.subtitle && (
                                        <p className="text-base text-muted-foreground">
                                            {selectedItem.subtitle}
                                        </p>
                                    )}

                                    <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                                        <h3 className="mb-2 font-semibold">Resumo</h3>
                                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                                            {getSummary(selectedItem)}
                                        </p>
                                    </div>

                                    {selectedItem.body_text && (
                                        <div className="rounded-2xl border border-border/50 bg-card p-4">
                                            <h3 className="mb-2 font-semibold">Texto limpo</h3>
                                            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                                                {selectedItem.body_text.slice(0, 2400)}
                                                {selectedItem.body_text.length > 2400 ? "..." : ""}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-border/50 bg-card p-4">
                                        <h3 className="mb-3 font-semibold">Contexto</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-muted-foreground">Fonte</span>
                                                <span className="text-right font-medium">
                                                    {selectedItem.source?.name ?? "-"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-muted-foreground">Publicada</span>
                                                <span className="text-right font-medium">
                                                    {formatDateTime(selectedItem.published_at_utc)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-muted-foreground">Cidade</span>
                                                <span className="text-right font-medium">
                                                    {selectedItem.ai_metadata?.city ?? "-"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-muted-foreground">Relevancia</span>
                                                <span className="text-right font-medium">
                                                    {selectedItem.ai_metadata?.relevance_score != null
                                                        ? `${Math.round(
                                                              selectedItem.ai_metadata
                                                                  .relevance_score * 100,
                                                          )}%`
                                                        : "-"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-muted-foreground">
                                                    Qualidade da captura
                                                </span>
                                                <div className="text-right">
                                                    <div className="font-medium">
                                                        {selectedItem.extraction_completeness}%
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {getCaptureQualityLabel(
                                                            selectedItem.extraction_completeness,
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                className="rounded-lg"
                                                onClick={() =>
                                                    window.open(
                                                        selectedItem.url,
                                                        "_blank",
                                                        "noopener,noreferrer",
                                                    )
                                                }
                                            >
                                                <ExternalLink className="mr-1 h-3 w-3" />
                                                Abrir materia
                                            </Button>

                                            {selectedItem.source?.homepage_url && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="rounded-lg"
                                                    onClick={() =>
                                                        window.open(
                                                            selectedItem.source?.homepage_url || "",
                                                            "_blank",
                                                            "noopener,noreferrer",
                                                        )
                                                    }
                                                >
                                                    <Globe className="mr-1 h-3 w-3" />
                                                    Abrir fonte
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-border/50 bg-card p-4">
                                        <h3 className="mb-3 font-semibold">Leitura da IA</h3>

                                        {latestAiFailure && (
                                            <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 p-4">
                                                <div className="flex items-start gap-3">
                                                    <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
                                                    <div className="min-w-0 space-y-2">
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground">
                                                                Ultima falha da IA
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatAiStage(latestAiFailure.stage)} •{" "}
                                                                {latestAiFailure.model || "modelo nao informado"} •{" "}
                                                                {formatDateTime(latestAiFailure.created_at)}
                                                            </p>
                                                        </div>
                                                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                                                            {latestAiFailure.error_message || "Falha sem mensagem."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {!!selectedAllFacts.length && (
                                            <div className="mb-4 grid gap-3 sm:grid-cols-2">
                                                {selectedAllFacts.map((fact) => (
                                                    <div
                                                        key={`fact-${fact.key}`}
                                                        className="rounded-xl border border-border/50 bg-background/70 p-3"
                                                    >
                                                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                                            {fact.label}
                                                        </p>
                                                        <p className="mt-2 text-sm font-medium leading-6">
                                                            {fact.value}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {!!selectedItem.ai_metadata?.summary_bullets?.length && (
                                            <div className="mb-4 space-y-2">
                                                {selectedItem.ai_metadata.summary_bullets.map((bullet) => (
                                                    <div
                                                        key={bullet}
                                                        className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground"
                                                    >
                                                        {bullet}
                                                    </div>
                                                ))}
                                            </div>
                                            )}

                                        {recentAiLogs.length > 0 && (
                                            <div className="space-y-2 border-t border-border/50 pt-4">
                                                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                                    Log recente da IA
                                                </p>
                                                <div className="space-y-2">
                                                    {recentAiLogs.map((log) => (
                                                        <div
                                                            key={log.id}
                                                            className="rounded-xl border border-border/50 bg-background/70 p-3"
                                                        >
                                                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                                                <Badge variant="outline" className="rounded-full">
                                                                    {formatAiStage(log.stage)}
                                                                </Badge>
                                                                <Badge variant="outline" className="rounded-full">
                                                                    {log.status === "failed" ? "Falha" : "Sucesso"}
                                                                </Badge>
                                                                <span className="text-muted-foreground">
                                                                    {log.model || "modelo nao informado"}
                                                                </span>
                                                                <span className="text-muted-foreground">
                                                                    {formatDateTime(log.created_at)}
                                                                </span>
                                                            </div>
                                                            {log.error_message && (
                                                                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                                                                    {log.error_message}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {!selectedItem.ai_metadata?.summary_bullets?.length &&
                                            !selectedAllFacts.length && (
                                                <p className="text-sm text-muted-foreground">
                                                    A IA ainda nao gerou leitura detalhada para esta materia.
                                                </p>
                                            )}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-border/50 bg-card p-4">
                                <h3 className="mb-3 font-semibold">Relacionadas</h3>

                                {relatedItemsQuery.isLoading ? (
                                    <div className="space-y-3">
                                        <ShimmerText width="65%" />
                                        <ShimmerText width="55%" />
                                    </div>
                                ) : (relatedItemsQuery.data?.data?.length ?? 0) === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Nenhuma relacionada encontrada na mesma fonte.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {relatedItemsQuery.data?.data.map((related) => (
                                            <button
                                                key={related.id}
                                                type="button"
                                                className="w-full rounded-xl border border-border/50 p-3 text-left transition-colors hover:bg-muted/40"
                                                onClick={() => setSelectedItemId(related.id)}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-medium">{related.title}</p>
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            {related.excerpt || "Sem resumo"}
                                                        </p>
                                                    </div>
                                                    <span className="shrink-0 text-xs text-muted-foreground">
                                                        {formatDateTime(related.published_at_utc)}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <EmptyState
                            icon={FileSearch}
                            title="Nao foi possivel carregar o item"
                            description="Tente atualizar o feed e abrir novamente os detalhes."
                            size="sm"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </AppShell>
    );
};

export default RaspagemFeed;
