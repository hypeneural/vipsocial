import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    Bot,
    CheckCircle2,
    Clock3,
    ExternalLink,
    Globe,
    PauseCircle,
    Plus,
    RefreshCw,
    Save,
    Search,
    ShieldAlert,
    Sparkles,
    Trash2,
    Workflow,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    useCreateNewsSource,
    useDeleteNewsSource,
    useDiscoverNewsSource,
    useNewsDashboard,
    useNewsSource,
    useNewsSources,
    useSyncNewsSource,
    useUpdateNewsSource,
} from "@/hooks/useNewsRadar";
import showToast from "@/lib/toast";
import type {
    DiscoverNewsSourceResponse,
    NewsDiscoveryMode,
    NewsFetchDetailMode,
    NewsFeedQualityProfile,
    NewsSource,
    NewsSourceType,
} from "@/services/newsRadar.service";
import { cn } from "@/lib/utils";

type DialogMode = "create" | "edit";

type SourceFormState = {
    name: string;
    homepage_url: string;
    source_type: NewsSourceType;
    discovery_mode: NewsDiscoveryMode;
    fetch_detail_mode: NewsFetchDetailMode;
    feed_quality_profile: string;
    source_preset: string;
    timezone_default: string;
    render_js_required: boolean;
    active: boolean;
    notes: string;
    crawling_config_text: string;
    throttle_config_text: string;
    date_formats_text: string;
};

const defaultFormState: SourceFormState = {
    name: "",
    homepage_url: "",
    source_type: "portal",
    discovery_mode: "auto",
    fetch_detail_mode: "when_incomplete",
    feed_quality_profile: "none",
    source_preset: "",
    timezone_default: "America/Sao_Paulo",
    render_js_required: false,
    active: true,
    notes: "",
    crawling_config_text: "",
    throttle_config_text: "",
    date_formats_text: "",
};

function formatRelativeTime(dateString?: string | null): string {
    if (!dateString) return "Nunca";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Nunca";

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "agora";
    if (diffMinutes < 60) return `ha ${diffMinutes} min`;
    if (diffHours < 24) return `ha ${diffHours}h`;
    return `ha ${diffDays} dias`;
}

function formatJson(value?: Record<string, unknown> | null): string {
    if (!value || Object.keys(value).length === 0) return "";
    return JSON.stringify(value, null, 2);
}

function formatDateFormats(value?: string[] | null): string {
    return value?.join("\n") ?? "";
}

function getStatusConfig(source: NewsSource) {
    if (!source.active) {
        return {
            label: "Pausada",
            className: "bg-muted text-muted-foreground",
            icon: PauseCircle,
        };
    }

    if (source.sync_locked_until && new Date(source.sync_locked_until) > new Date()) {
        return {
            label: "Sincronizando",
            className: "bg-info/15 text-info",
            icon: RefreshCw,
        };
    }

    if (source.consecutive_failures > 0) {
        return {
            label: "Em alerta",
            className: "bg-warning/15 text-warning",
            icon: ShieldAlert,
        };
    }

    return {
        label: "Saudavel",
        className: "bg-success/15 text-success",
        icon: CheckCircle2,
    };
}

function inferPreset(result?: DiscoverNewsSourceResponse | null): string {
    const feed = result?.result?.feed;
    if (!feed) return "html_listing_detail";

    if (feed.quality.profile === "teaser_only") return "rss_teaser_detail";
    if (feed.quality.profile === "partial") return "rss_full_with_image_fetch";
    if (feed.suggested_fetch_detail_mode === "never") return "rss_full_clean";
    return "rss_full_with_image_fetch";
}

function sourceToForm(source: NewsSource): SourceFormState {
    return {
        name: source.name,
        homepage_url: source.homepage_url,
        source_type: source.source_type,
        discovery_mode: source.discovery_mode,
        fetch_detail_mode: source.fetch_detail_mode,
        feed_quality_profile: source.feed_quality_profile ?? "none",
        source_preset: source.source_preset ?? "",
        timezone_default: source.timezone_default ?? "America/Sao_Paulo",
        render_js_required: source.render_js_required,
        active: source.active,
        notes: source.notes ?? "",
        crawling_config_text: formatJson(source.crawling_config),
        throttle_config_text: formatJson(source.throttle_config),
        date_formats_text: formatDateFormats(source.date_formats),
    };
}

function parseJsonObject(text: string, fieldName: string): Record<string, unknown> | undefined {
    if (!text.trim()) return undefined;

    try {
        const parsed = JSON.parse(text);
        if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
            throw new Error();
        }

        return parsed as Record<string, unknown>;
    } catch {
        throw new Error(`${fieldName} precisa ser um JSON valido.`);
    }
}

function parseDateFormats(text: string): string[] | undefined {
    const values = text
        .split(/\r?\n|,/)
        .map((value) => value.trim())
        .filter(Boolean);

    return values.length > 0 ? values : undefined;
}

function buildDiscoveryConfig(
    form: SourceFormState,
    result?: DiscoverNewsSourceResponse | null,
): string {
    const currentConfig = form.crawling_config_text.trim()
        ? parseJsonObject(form.crawling_config_text, "Configuracao de crawling")
        : {};

    const nextConfig = {
        ...currentConfig,
        homepage_url: form.homepage_url,
        feed_url: result?.result?.feed?.url ?? currentConfig.feed_url,
        sitemap_url: result?.result?.sitemap?.url ?? currentConfig.sitemap_url,
    };

    return JSON.stringify(nextConfig, null, 2);
}

const RaspagemFontes = () => {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<DialogMode>("create");
    const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
    const [form, setForm] = useState<SourceFormState>(defaultFormState);
    const [deleteTarget, setDeleteTarget] = useState<NewsSource | null>(null);
    const [discoveryResult, setDiscoveryResult] =
        useState<DiscoverNewsSourceResponse | null>(null);

    const deferredSearch = useDeferredValue(search);

    const sourceParams = useMemo(
        () => ({
            page,
            per_page: 12,
            search: deferredSearch.trim() || undefined,
            source_type: typeFilter === "all" ? undefined : (typeFilter as NewsSourceType),
            active:
                statusFilter === "active"
                    ? true
                    : statusFilter === "inactive"
                      ? false
                      : undefined,
            failing: statusFilter === "failing" ? true : undefined,
            sort: "name" as const,
            dir: "asc" as const,
        }),
        [page, deferredSearch, typeFilter, statusFilter],
    );

    const dashboardQuery = useNewsDashboard();
    const sourcesQuery = useNewsSources(sourceParams);
    const selectedSourceQuery = useNewsSource(selectedSourceId ?? undefined);

    const createSourceMutation = useCreateNewsSource();
    const updateSourceMutation = useUpdateNewsSource();
    const deleteSourceMutation = useDeleteNewsSource();
    const syncSourceMutation = useSyncNewsSource();
    const discoverSourceMutation = useDiscoverNewsSource();

    useEffect(() => {
        if (dialogMode !== "edit" || !selectedSourceQuery.data) {
            return;
        }

        setForm(sourceToForm(selectedSourceQuery.data));
    }, [dialogMode, selectedSourceQuery.data]);

    const openCreateDialog = () => {
        setDialogMode("create");
        setSelectedSourceId(null);
        setForm(defaultFormState);
        setDiscoveryResult(null);
        setDialogOpen(true);
    };

    const openEditDialog = (source: NewsSource) => {
        setDialogMode("edit");
        setSelectedSourceId(source.id);
        setForm(sourceToForm(source));
        setDiscoveryResult(null);
        setDialogOpen(true);
    };

    const closeDialog = (open: boolean) => {
        setDialogOpen(open);

        if (!open) {
            setSelectedSourceId(null);
            setDiscoveryResult(null);
        }
    };

    const setField = <K extends keyof SourceFormState>(field: K, value: SourceFormState[K]) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const resetToFirstPage = () => {
        startTransition(() => setPage(1));
    };

    const applyDiscovery = (result: DiscoverNewsSourceResponse) => {
        setDiscoveryResult(result);

        setForm((current) => ({
            ...current,
            name: current.name || result.result?.page?.title || current.name,
            discovery_mode: result.result?.feed
                ? "feed"
                : result.result?.sitemap
                  ? "sitemap"
                  : current.discovery_mode,
            fetch_detail_mode:
                result.result?.feed?.suggested_fetch_detail_mode ?? current.fetch_detail_mode,
            feed_quality_profile:
                result.result?.feed?.quality.profile ?? current.feed_quality_profile,
            source_preset: inferPreset(result),
            crawling_config_text: buildDiscoveryConfig(current, result),
        }));
    };

    const handleAutoDetect = async () => {
        if (!form.homepage_url.trim()) {
            showToast.error("Informe a URL base antes de rodar o autodetect.");
            return;
        }

        try {
            const result = await discoverSourceMutation.mutateAsync({
                url: form.homepage_url.trim(),
            });

            applyDiscovery(result);
        } catch (error) {
            showToast.error(
                error instanceof Error ? error.message : "Falha ao executar o autodetect.",
            );
        }
    };

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.homepage_url.trim()) {
            showToast.error("Nome e URL sao obrigatorios.");
            return;
        }

        try {
            const payload = {
                name: form.name.trim(),
                homepage_url: form.homepage_url.trim(),
                source_type: form.source_type,
                discovery_mode: form.discovery_mode,
                fetch_detail_mode: form.fetch_detail_mode,
                feed_quality_profile:
                    form.feed_quality_profile === "none"
                        ? null
                        : (form.feed_quality_profile as NewsFeedQualityProfile),
                source_preset: form.source_preset.trim() || undefined,
                timezone_default: form.timezone_default.trim() || "America/Sao_Paulo",
                render_js_required: form.render_js_required,
                notes: form.notes.trim() || undefined,
                crawling_config: parseJsonObject(
                    form.crawling_config_text,
                    "Configuracao de crawling",
                ),
                throttle_config: parseJsonObject(
                    form.throttle_config_text,
                    "Configuracao de throttle",
                ),
                date_formats: parseDateFormats(form.date_formats_text),
            };

            if (dialogMode === "create") {
                await createSourceMutation.mutateAsync(payload);
            } else if (selectedSourceId) {
                await updateSourceMutation.mutateAsync({
                    id: selectedSourceId,
                    payload: {
                        ...payload,
                        active: form.active,
                    },
                });
            }

            setDialogOpen(false);
        } catch (error) {
            showToast.error(error instanceof Error ? error.message : "Falha ao salvar a fonte.");
        }
    };

    const handleToggleActive = async (source: NewsSource, active: boolean) => {
        await updateSourceMutation.mutateAsync({
            id: source.id,
            payload: { active },
        });
    };

    const dashboard = dashboardQuery.data;
    const sources = sourcesQuery.data?.data ?? [];
    const pagination = sourcesQuery.data;

    return (
        <AppShell>
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-xl font-bold md:text-2xl">Fontes de raspagem</h1>
                        <p className="text-sm text-muted-foreground">
                            Cadastro, saude operacional e configuracao das fontes do NewsRadar.
                        </p>
                    </div>

                    <Button className="rounded-xl" onClick={openCreateDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova fonte
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
                                <Globe className="h-4 w-4 text-primary" />
                                Total filtrado
                            </div>
                            <p className="mt-1 text-2xl font-bold">
                                {sourcesQuery.data?.total ?? 0}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-success/30 bg-success/10 p-4">
                            <div className="flex items-center gap-2 text-sm text-success">
                                <CheckCircle2 className="h-4 w-4" />
                                Ativas
                            </div>
                            <p className="mt-1 text-2xl font-bold text-success">
                                {dashboard?.total_sources ?? 0}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
                            <div className="flex items-center gap-2 text-sm text-warning">
                                <ShieldAlert className="h-4 w-4" />
                                Com falha
                            </div>
                            <p className="mt-1 text-2xl font-bold text-warning">
                                {dashboard?.sources_with_failures ?? 0}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-border/50 bg-card p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Sparkles className="h-4 w-4 text-info" />
                                Itens hoje
                            </div>
                            <p className="mt-1 text-2xl font-bold">
                                {dashboard?.items_today ?? 0}
                            </p>
                        </div>
                    </>
                )}
            </div>

            <div className="mb-6 grid gap-3 rounded-2xl border border-border/50 bg-card p-4 lg:grid-cols-[2fr,1fr,1fr]">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            resetToFirstPage();
                        }}
                        placeholder="Buscar por nome ou dominio"
                        className="rounded-xl pl-10"
                    />
                </div>

                <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                        setStatusFilter(value);
                        resetToFirstPage();
                    }}
                >
                    <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="active">Ativas</SelectItem>
                        <SelectItem value="inactive">Pausadas</SelectItem>
                        <SelectItem value="failing">Com falha</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={typeFilter}
                    onValueChange={(value) => {
                        setTypeFilter(value);
                        resetToFirstPage();
                    }}
                >
                    <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="portal">Portal</SelectItem>
                        <SelectItem value="prefeitura">Prefeitura</SelectItem>
                        <SelectItem value="blog">Blog</SelectItem>
                        <SelectItem value="agencia">Agencia</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {sourcesQuery.isLoading ? (
                <ShimmerList count={4} />
            ) : sources.length === 0 ? (
                <EmptyState
                    icon={Globe}
                    title="Nenhuma fonte encontrada"
                    description="Cadastre uma nova fonte ou relaxe os filtros da listagem."
                    actionLabel="Nova fonte"
                    onAction={openCreateDialog}
                />
            ) : (
                <div className="space-y-3">
                    {sources.map((source, index) => {
                        const status = getStatusConfig(source);
                        const StatusIcon = status.icon;

                        return (
                            <motion.div
                                key={source.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                className={cn(
                                    "rounded-2xl border bg-card p-4 shadow-sm",
                                    source.consecutive_failures > 0
                                        ? "border-warning/30"
                                        : "border-border/50",
                                )}
                            >
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold">{source.name}</h3>
                                            <Badge className={cn("rounded-full", status.className)}>
                                                <StatusIcon
                                                    className={cn(
                                                        "mr-1 h-3 w-3",
                                                        source.sync_locked_until &&
                                                            new Date(source.sync_locked_until) >
                                                                new Date() &&
                                                            "animate-spin",
                                                    )}
                                                />
                                                {status.label}
                                            </Badge>
                                            <Badge variant="outline" className="rounded-full">
                                                {source.source_type}
                                            </Badge>
                                        </div>

                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Globe className="h-3 w-3" />
                                                {source.homepage_url}
                                            </span>
                                            <span>•</span>
                                            <span>{source.discovery_mode}</span>
                                            <span>•</span>
                                            <span>{source.fetch_detail_mode}</span>
                                        </div>

                                        {source.notes && (
                                            <p className="mt-3 text-sm text-muted-foreground">
                                                {source.notes}
                                            </p>
                                        )}

                                        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-5">
                                            <div>
                                                <span className="text-muted-foreground">Ultima sync</span>
                                                <p className="font-medium">
                                                    {formatRelativeTime(source.last_sync_at)}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Taxa sucesso</span>
                                                <p className="font-medium">
                                                    {Math.round(source.success_rate ?? 0)}%
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Tempo medio</span>
                                                <p className="font-medium">
                                                    {source.avg_response_ms
                                                        ? `${source.avg_response_ms} ms`
                                                        : "-"}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Itens encontrados</span>
                                                <p className="font-medium">{source.last_items_found}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Falhas seguidas</span>
                                                <p className="font-medium">
                                                    {source.consecutive_failures}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                                        <div className="flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2">
                                            <span className="text-sm text-muted-foreground">Ativa</span>
                                            <Switch
                                                checked={source.active}
                                                onCheckedChange={(checked) =>
                                                    handleToggleActive(source, checked)
                                                }
                                                disabled={updateSourceMutation.isPending}
                                            />
                                        </div>

                                        <Button
                                            variant="outline"
                                            className="rounded-xl"
                                            onClick={() => syncSourceMutation.mutate(source.id)}
                                            disabled={syncSourceMutation.isPending || !source.active}
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Sync
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="rounded-xl"
                                            onClick={() => openEditDialog(source)}
                                        >
                                            <Workflow className="mr-2 h-4 w-4" />
                                            Editar
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="rounded-xl"
                                            onClick={() =>
                                                window.open(
                                                    source.homepage_url,
                                                    "_blank",
                                                    "noopener,noreferrer",
                                                )
                                            }
                                        >
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            Abrir
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="rounded-xl text-destructive"
                                            onClick={() => setDeleteTarget(source)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remover
                                        </Button>
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
                        Pagina {pagination.current_page} de {pagination.last_page}
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

            <Dialog open={dialogOpen} onOpenChange={closeDialog}>
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogMode === "create" ? "Nova fonte" : "Editar fonte"}
                        </DialogTitle>
                        <DialogDescription>
                            Cadastre a fonte, rode o autodetect e ajuste o JSON apenas quando precisar
                            refinar o spider.
                        </DialogDescription>
                    </DialogHeader>

                    {dialogMode === "edit" && selectedSourceQuery.isLoading ? (
                        <div className="space-y-3">
                            <ShimmerText width="40%" />
                            <ShimmerText width="80%" />
                            <ShimmerText width="70%" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Nome da fonte</Label>
                                    <Input
                                        value={form.name}
                                        onChange={(event) => setField("name", event.target.value)}
                                        placeholder="Ex: Prefeitura de Itapema"
                                        className="rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>URL base</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={form.homepage_url}
                                            onChange={(event) =>
                                                setField("homepage_url", event.target.value)
                                            }
                                            placeholder="https://portal.com.br"
                                            className="rounded-xl"
                                        />
                                        <Button
                                            variant="outline"
                                            className="rounded-xl"
                                            onClick={handleAutoDetect}
                                            disabled={discoverSourceMutation.isPending}
                                        >
                                            <Bot className="mr-2 h-4 w-4" />
                                            Detectar
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <Select
                                        value={form.source_type}
                                        onValueChange={(value: NewsSourceType) =>
                                            setField("source_type", value)
                                        }
                                    >
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="portal">Portal</SelectItem>
                                            <SelectItem value="prefeitura">Prefeitura</SelectItem>
                                            <SelectItem value="blog">Blog</SelectItem>
                                            <SelectItem value="agencia">Agencia</SelectItem>
                                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Discovery mode</Label>
                                    <Select
                                        value={form.discovery_mode}
                                        onValueChange={(value: NewsDiscoveryMode) =>
                                            setField("discovery_mode", value)
                                        }
                                    >
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="auto">Auto</SelectItem>
                                            <SelectItem value="feed">Feed</SelectItem>
                                            <SelectItem value="sitemap">Sitemap</SelectItem>
                                            <SelectItem value="html_listing">HTML listing</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Fetch detail</Label>
                                    <Select
                                        value={form.fetch_detail_mode}
                                        onValueChange={(value: NewsFetchDetailMode) =>
                                            setField("fetch_detail_mode", value)
                                        }
                                    >
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="never">Nunca</SelectItem>
                                            <SelectItem value="when_incomplete">
                                                Quando faltar campo
                                            </SelectItem>
                                            <SelectItem value="always">Sempre</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Perfil do feed</Label>
                                    <Select
                                        value={form.feed_quality_profile}
                                        onValueChange={(value) =>
                                            setField("feed_quality_profile", value)
                                        }
                                    >
                                        <SelectTrigger className="rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Nao definido</SelectItem>
                                            <SelectItem value="full">Full</SelectItem>
                                            <SelectItem value="partial">Partial</SelectItem>
                                            <SelectItem value="teaser_only">Teaser only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <div className="space-y-2">
                                    <Label>Preset</Label>
                                    <Input
                                        value={form.source_preset}
                                        onChange={(event) =>
                                            setField("source_preset", event.target.value)
                                        }
                                        placeholder="rss_full_clean"
                                        className="rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Timezone</Label>
                                    <Input
                                        value={form.timezone_default}
                                        onChange={(event) =>
                                            setField("timezone_default", event.target.value)
                                        }
                                        className="rounded-xl"
                                    />
                                </div>

                                <div className="flex items-center justify-between rounded-2xl border border-border/50 px-4 py-3">
                                    <div>
                                        <p className="font-medium">Render JS</p>
                                        <p className="text-xs text-muted-foreground">
                                            Use apenas para sites pesados
                                        </p>
                                    </div>
                                    <Switch
                                        checked={form.render_js_required}
                                        onCheckedChange={(checked) =>
                                            setField("render_js_required", checked)
                                        }
                                    />
                                </div>

                                {dialogMode === "edit" && (
                                    <div className="flex items-center justify-between rounded-2xl border border-border/50 px-4 py-3">
                                        <div>
                                            <p className="font-medium">Fonte ativa</p>
                                            <p className="text-xs text-muted-foreground">
                                                Controla o scheduler
                                            </p>
                                        </div>
                                        <Switch
                                            checked={form.active}
                                            onCheckedChange={(checked) => setField("active", checked)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Observacoes</Label>
                                <Textarea
                                    value={form.notes}
                                    onChange={(event) => setField("notes", event.target.value)}
                                    placeholder="Notas operacionais, portas de entrada, excecoes do portal..."
                                    className="min-h-[90px] rounded-xl"
                                />
                            </div>

                            <div className="grid gap-4 xl:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>crawling_config (JSON)</Label>
                                    <Textarea
                                        value={form.crawling_config_text}
                                        onChange={(event) =>
                                            setField("crawling_config_text", event.target.value)
                                        }
                                        placeholder='{"feed_url":"https://portal.com.br/feed"}'
                                        className="min-h-[220px] rounded-xl font-mono text-xs"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>throttle_config (JSON)</Label>
                                    <Textarea
                                        value={form.throttle_config_text}
                                        onChange={(event) =>
                                            setField("throttle_config_text", event.target.value)
                                        }
                                        placeholder='{"crawl_interval_min":60,"crawl_interval_max":3600}'
                                        className="min-h-[220px] rounded-xl font-mono text-xs"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Date formats</Label>
                                    <Textarea
                                        value={form.date_formats_text}
                                        onChange={(event) =>
                                            setField("date_formats_text", event.target.value)
                                        }
                                        placeholder={"c\nY-m-d H:i:s\nd/m/Y H:i"}
                                        className="min-h-[220px] rounded-xl font-mono text-xs"
                                    />
                                </div>
                            </div>

                            {discoveryResult?.result && (
                                <div className="space-y-4 rounded-2xl border border-border/50 bg-muted/20 p-4">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        <h3 className="font-semibold">Sugestoes do autodetect</h3>
                                    </div>

                                    <div className="grid gap-3 lg:grid-cols-3">
                                        <div className="rounded-xl border border-border/50 bg-card p-3">
                                            <p className="text-xs text-muted-foreground">Feed</p>
                                            <p className="mt-1 text-sm font-medium">
                                                {discoveryResult.result.feed?.url ?? "Nao detectado"}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-border/50 bg-card p-3">
                                            <p className="text-xs text-muted-foreground">Sitemap</p>
                                            <p className="mt-1 text-sm font-medium">
                                                {discoveryResult.result.sitemap?.url ?? "Nao detectado"}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-border/50 bg-card p-3">
                                            <p className="text-xs text-muted-foreground">CMS</p>
                                            <p className="mt-1 text-sm font-medium">
                                                {discoveryResult.result.page?.detected_cms ?? "Nao definido"}
                                            </p>
                                        </div>
                                    </div>

                                    {!!discoveryResult.result.feed?.preview_items?.length && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">
                                                Preview do feed detectado
                                            </p>
                                            <div className="space-y-2">
                                                {discoveryResult.result.feed.preview_items.map((item) => (
                                                    <div
                                                        key={item.url}
                                                        className="rounded-xl border border-border/50 bg-card p-3"
                                                    >
                                                        <p className="font-medium">{item.title || item.url}</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {item.author || "Sem autor"} •{" "}
                                                            {item.date || "Sem data"}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {dialogMode === "edit" && !!selectedSourceQuery.data?.runs?.length && (
                                <div className="space-y-3 rounded-2xl border border-border/50 bg-card p-4">
                                    <div className="flex items-center gap-2">
                                        <Clock3 className="h-4 w-4 text-primary" />
                                        <h3 className="font-semibold">Ultimas execucoes</h3>
                                    </div>

                                    <div className="space-y-2">
                                        {selectedSourceQuery.data.runs?.map((run) => (
                                            <div
                                                key={run.id}
                                                className="flex flex-col gap-2 rounded-xl border border-border/50 p-3 md:flex-row md:items-center md:justify-between"
                                            >
                                                <div>
                                                    <p className="font-medium">{run.status}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatRelativeTime(run.started_at)}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                                    <span>Encontrados: {run.items_found}</span>
                                                    <span>Novos: {run.items_new}</span>
                                                    <span>Falhas: {run.items_failed}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    variant="outline"
                                    className="rounded-xl"
                                    onClick={() => setDialogOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="rounded-xl"
                                    onClick={handleSubmit}
                                    disabled={
                                        createSourceMutation.isPending ||
                                        updateSourceMutation.isPending
                                    }
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {dialogMode === "create" ? "Criar fonte" : "Salvar alteracoes"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                    }
                }}
                title="Remover fonte?"
                description={`A fonte ${deleteTarget?.name ?? ""} sera desativada via soft delete.`}
                confirmText="Remover"
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    await deleteSourceMutation.mutateAsync(deleteTarget.id);
                    setDeleteTarget(null);
                }}
            />
        </AppShell>
    );
};

export default RaspagemFontes;
