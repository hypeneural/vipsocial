import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    Activity,
    AlertTriangle,
    Bot,
    FileSearch,
    Filter,
    Globe,
    RefreshCw,
    Rss,
    SearchCheck,
    ShieldAlert,
    Sparkles,
    TestTube2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { ShimmerKPI, ShimmerText } from "@/components/Shimmer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    useDiscoverNewsSource,
    useNewsDashboard,
    useNewsItems,
    useNewsSources,
    usePreviewNewsSource,
    useTestNewsSelector,
} from "@/hooks/useNewsRadar";
import showToast from "@/lib/toast";
import type {
    DiscoverNewsSourceResponse,
    NewsPreviewMode,
} from "@/services/newsRadar.service";

function buildSuggestedConfig(
    requestedUrl: string,
    result?: DiscoverNewsSourceResponse | null,
): string {
    return JSON.stringify(
        {
            homepage_url: requestedUrl,
            feed_url: result?.result?.feed?.url ?? null,
            sitemap_url: result?.result?.sitemap?.url ?? null,
        },
        null,
        2,
    );
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

const RaspagemFiltros = () => {
    const [discoveryUrl, setDiscoveryUrl] = useState("");
    const [discoveryResult, setDiscoveryResult] =
        useState<DiscoverNewsSourceResponse | null>(null);

    const [previewMode, setPreviewMode] = useState<NewsPreviewMode>("feed");
    const [previewUrl, setPreviewUrl] = useState("");
    const [previewConfigText, setPreviewConfigText] = useState("");

    const [selectorUrl, setSelectorUrl] = useState("");
    const [selectorValue, setSelectorValue] = useState("");
    const [selectorRunId, setSelectorRunId] = useState("");

    const dashboardQuery = useNewsDashboard();
    const failingSourcesQuery = useNewsSources({
        failing: true,
        per_page: 5,
        sort: "consecutive_failures",
        dir: "desc",
    });
    const extractionFailuresQuery = useNewsItems({
        extraction_status: "extraction_failed",
        per_page: 5,
    });
    const enrichmentFailuresQuery = useNewsItems({
        enrichment_status: "enrichment_failed",
        per_page: 5,
    });

    const discoverSourceMutation = useDiscoverNewsSource();
    const previewSourceMutation = usePreviewNewsSource();
    const testSelectorMutation = useTestNewsSelector();

    const dashboard = dashboardQuery.data;

    const extractionBreakdown = useMemo(
        () => Object.entries(dashboard?.by_extraction_status ?? {}),
        [dashboard?.by_extraction_status],
    );

    const enrichmentBreakdown = useMemo(
        () => Object.entries(dashboard?.by_enrichment_status ?? {}),
        [dashboard?.by_enrichment_status],
    );

    const handleDiscover = async () => {
        if (!discoveryUrl.trim()) {
            showToast.error("Informe a URL para iniciar a analise.");
            return;
        }

        try {
            const result = await discoverSourceMutation.mutateAsync({
                url: discoveryUrl.trim(),
            });

            setDiscoveryResult(result);
            setSelectorUrl(discoveryUrl.trim());
            setSelectorRunId(result.run_id);
            setPreviewUrl(result.result?.feed?.url ?? discoveryUrl.trim());
            setPreviewMode(result.result?.feed?.url ? "feed" : "html_listing");
            setPreviewConfigText(buildSuggestedConfig(discoveryUrl.trim(), result));
        } catch (error) {
            showToast.error(
                error instanceof Error ? error.message : "Falha ao executar a analise.",
            );
        }
    };

    const handlePreview = async () => {
        if (!previewUrl.trim()) {
            showToast.error("Informe a URL para gerar o preview.");
            return;
        }

        try {
            await previewSourceMutation.mutateAsync({
                mode: previewMode,
                url: previewUrl.trim(),
                config: parseJsonObject(previewConfigText, "Config do preview"),
            });
        } catch (error) {
            showToast.error(error instanceof Error ? error.message : "Falha no preview.");
        }
    };

    const handleTestSelector = async () => {
        if (!selectorUrl.trim() || !selectorValue.trim()) {
            showToast.error("URL e seletor sao obrigatorios.");
            return;
        }

        try {
            await testSelectorMutation.mutateAsync({
                url: selectorUrl.trim(),
                selector: selectorValue.trim(),
                run_id: selectorRunId.trim() || undefined,
            });
        } catch (error) {
            showToast.error(
                error instanceof Error ? error.message : "Falha ao testar o seletor.",
            );
        }
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
                        <h1 className="text-xl font-bold md:text-2xl">
                            Filtros, preview e monitor
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Assistente para onboarding, testes de seletor e saude operacional do
                            NewsRadar.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => {
                            dashboardQuery.refetch();
                            failingSourcesQuery.refetch();
                            extractionFailuresQuery.refetch();
                            enrichmentFailuresQuery.refetch();
                        }}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Atualizar
                    </Button>
                </div>
            </motion.div>

            <Tabs defaultValue="assistant" className="space-y-6">
                <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl bg-muted/50 p-1">
                    <TabsTrigger value="assistant" className="rounded-lg py-2">
                        <Bot className="mr-2 h-4 w-4" />
                        Assistente
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="rounded-lg py-2">
                        <TestTube2 className="mr-2 h-4 w-4" />
                        Preview
                    </TabsTrigger>
                    <TabsTrigger value="monitor" className="rounded-lg py-2">
                        <Activity className="mr-2 h-4 w-4" />
                        Monitor
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="assistant" className="space-y-6">
                    <div className="rounded-2xl border border-border/50 bg-card p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <SearchCheck className="h-5 w-5 text-primary" />
                            <h2 className="font-semibold">Descoberta automatica</h2>
                        </div>

                        <div className="grid gap-3 md:grid-cols-[2fr,auto]">
                            <Input
                                value={discoveryUrl}
                                onChange={(event) => setDiscoveryUrl(event.target.value)}
                                placeholder="https://portal.com.br"
                                className="rounded-xl"
                            />
                            <Button
                                className="rounded-xl"
                                onClick={handleDiscover}
                                disabled={discoverSourceMutation.isPending}
                            >
                                <Bot className="mr-2 h-4 w-4" />
                                Analisar
                            </Button>
                        </div>

                        {discoverSourceMutation.isPending && (
                            <div className="mt-4 space-y-2">
                                <ShimmerText width="45%" />
                                <ShimmerText width="75%" />
                            </div>
                        )}

                        {discoveryResult?.result && (
                            <div className="mt-6 space-y-4">
                                <div className="grid gap-3 lg:grid-cols-3">
                                    <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                                        <p className="text-xs text-muted-foreground">Pagina</p>
                                        <p className="mt-1 font-medium">
                                            {discoveryResult.result.page?.title ?? "Sem titulo"}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            CMS:{" "}
                                            {discoveryResult.result.page?.detected_cms ??
                                                "nao identificado"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                                        <p className="text-xs text-muted-foreground">Feed</p>
                                        <p className="mt-1 text-sm font-medium">
                                            {discoveryResult.result.feed?.url ?? "Nao detectado"}
                                        </p>
                                        {discoveryResult.result.feed && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Score {discoveryResult.result.feed.quality.score} •{" "}
                                                {discoveryResult.result.feed.quality.profile}
                                            </p>
                                        )}
                                    </div>

                                    <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                                        <p className="text-xs text-muted-foreground">Sitemap</p>
                                        <p className="mt-1 text-sm font-medium">
                                            {discoveryResult.result.sitemap?.url ?? "Nao detectado"}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Run ID: {discoveryResult.run_id}
                                        </p>
                                    </div>
                                </div>

                                {!!discoveryResult.result.feed?.quality.flags?.length && (
                                    <div className="flex flex-wrap gap-2">
                                        {discoveryResult.result.feed.quality.flags.map((flag) => (
                                            <Badge
                                                key={flag}
                                                variant="secondary"
                                                className="rounded-full"
                                            >
                                                {flag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Config sugerida</Label>
                                    <Textarea
                                        value={buildSuggestedConfig(discoveryUrl, discoveryResult)}
                                        readOnly
                                        className="min-h-[140px] rounded-xl font-mono text-xs"
                                    />
                                </div>

                                {!!discoveryResult.result.feed?.preview_items?.length && (
                                    <div className="space-y-3">
                                        <p className="font-medium">Preview do feed detectado</p>
                                        <div className="space-y-2">
                                            {discoveryResult.result.feed.preview_items.map((item) => (
                                                <div
                                                    key={item.url}
                                                    className="rounded-xl border border-border/50 p-3"
                                                >
                                                    <p className="font-medium">
                                                        {item.title || item.url}
                                                    </p>
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
                    </div>

                    <div className="rounded-2xl border border-border/50 bg-card p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <Filter className="h-5 w-5 text-primary" />
                            <h2 className="font-semibold">Teste de seletor</h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>URL</Label>
                                <Input
                                    value={selectorUrl}
                                    onChange={(event) => setSelectorUrl(event.target.value)}
                                    placeholder="https://portal.com.br/noticias"
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Run ID (opcional)</Label>
                                <Input
                                    value={selectorRunId}
                                    onChange={(event) => setSelectorRunId(event.target.value)}
                                    placeholder="UUID da analise"
                                    className="rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-[2fr,auto]">
                            <Input
                                value={selectorValue}
                                onChange={(event) => setSelectorValue(event.target.value)}
                                placeholder=".post-list article a"
                                className="rounded-xl font-mono"
                            />
                            <Button
                                className="rounded-xl"
                                onClick={handleTestSelector}
                                disabled={testSelectorMutation.isPending}
                            >
                                <TestTube2 className="mr-2 h-4 w-4" />
                                Testar
                            </Button>
                        </div>

                        {testSelectorMutation.data && (
                            <div className="mt-6 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge className="rounded-full bg-primary/15 text-primary">
                                        {testSelectorMutation.data.matches} matches
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {testSelectorMutation.data.selector}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {testSelectorMutation.data.results.map((result, index) => (
                                        <div
                                            key={`${result.tag}-${index}`}
                                            className="rounded-xl border border-border/50 bg-muted/20 p-3"
                                        >
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Tag: {result.tag || "-"}
                                            </p>
                                            <p className="mt-1 text-sm">
                                                {result.text || "Sem texto"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-6">
                    <div className="rounded-2xl border border-border/50 bg-card p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <TestTube2 className="h-5 w-5 text-primary" />
                            <h2 className="font-semibold">Preview controlado</h2>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[220px,1fr]">
                            <div className="space-y-2">
                                <Label>Modo</Label>
                                <Select
                                    value={previewMode}
                                    onValueChange={(value: NewsPreviewMode) =>
                                        setPreviewMode(value)
                                    }
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="feed">Feed</SelectItem>
                                        <SelectItem value="html_listing">HTML listing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>URL</Label>
                                <Input
                                    value={previewUrl}
                                    onChange={(event) => setPreviewUrl(event.target.value)}
                                    placeholder="https://portal.com.br/feed"
                                    className="rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="mt-4 space-y-2">
                            <Label>Config JSON</Label>
                            <Textarea
                                value={previewConfigText}
                                onChange={(event) => setPreviewConfigText(event.target.value)}
                                placeholder='{"listing_item_selectors":["article",".post"]}'
                                className="min-h-[180px] rounded-xl font-mono text-xs"
                            />
                        </div>

                        <div className="mt-4">
                            <Button
                                className="rounded-xl"
                                onClick={handlePreview}
                                disabled={previewSourceMutation.isPending}
                            >
                                <TestTube2 className="mr-2 h-4 w-4" />
                                Gerar preview
                            </Button>
                        </div>

                        {previewSourceMutation.data?.preview?.length ? (
                            <div className="mt-6 space-y-3">
                                {previewSourceMutation.data.preview.map((item) => (
                                    <div
                                        key={item.url}
                                        className="rounded-2xl border border-border/50 p-4"
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            {item.has_body && (
                                                <Badge className="rounded-full bg-success/15 text-success">
                                                    corpo
                                                </Badge>
                                            )}
                                            {item.has_image && (
                                                <Badge className="rounded-full bg-info/15 text-info">
                                                    imagem
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-2 font-medium">{item.title || item.url}</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {item.excerpt || "Sem excerpt"}
                                        </p>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {item.author || "Sem autor"} • {item.date || "Sem data"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : previewSourceMutation.data ? (
                            <EmptyState
                                icon={Rss}
                                title="Preview sem itens"
                                description="O endpoint respondeu, mas nenhum item foi extraido com essa configuracao."
                                size="sm"
                            />
                        ) : null}
                    </div>
                </TabsContent>

                <TabsContent value="monitor" className="space-y-6">
                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
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

                                <div className="rounded-2xl border border-border/50 bg-card p-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Sparkles className="h-4 w-4 text-info" />
                                        Itens hoje
                                    </div>
                                    <p className="mt-1 text-2xl font-bold">
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
                                        <Activity className="h-4 w-4 text-success" />
                                        Locks ativos
                                    </div>
                                    <p className="mt-1 text-2xl font-bold">
                                        {dashboard?.sources_locked ?? 0}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                        <div className="rounded-2xl border border-border/50 bg-card p-6">
                            <div className="mb-4 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-warning" />
                                <h2 className="font-semibold">Fontes em alerta</h2>
                            </div>

                            {(failingSourcesQuery.data?.data?.length ?? 0) === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Nenhuma fonte em alerta no momento.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {failingSourcesQuery.data?.data.map((source) => (
                                        <div
                                            key={source.id}
                                            className="rounded-xl border border-warning/30 bg-warning/5 p-3"
                                        >
                                            <p className="font-medium">{source.name}</p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {source.consecutive_failures} falhas • ultimo sync{" "}
                                                {source.last_sync_at || "sem historico"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-border/50 bg-card p-6">
                            <div className="mb-4 flex items-center gap-2">
                                <Globe className="h-5 w-5 text-primary" />
                                <h2 className="font-semibold">Top fontes por volume</h2>
                            </div>

                            <div className="space-y-3">
                                {(dashboard?.by_source ?? []).map((entry) => (
                                    <div key={entry.news_source_id}>
                                        <div className="mb-1 flex items-center justify-between text-sm">
                                            <span>{entry.source?.name ?? `Fonte ${entry.news_source_id}`}</span>
                                            <span className="font-medium">{entry.count}</span>
                                        </div>
                                        <Progress
                                            value={
                                                dashboard?.total_items
                                                    ? Math.max(
                                                          4,
                                                          (entry.count / dashboard.total_items) * 100,
                                                      )
                                                    : 0
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                        <div className="rounded-2xl border border-border/50 bg-card p-6">
                            <div className="mb-4 flex items-center gap-2">
                                <Filter className="h-5 w-5 text-primary" />
                                <h2 className="font-semibold">Extracao</h2>
                            </div>
                            <div className="space-y-4">
                                {extractionBreakdown.map(([status, count]) => (
                                    <div key={status}>
                                        <div className="mb-1 flex items-center justify-between text-sm">
                                            <span>{status}</span>
                                            <span className="font-medium">{count}</span>
                                        </div>
                                        <Progress
                                            value={
                                                dashboard?.total_items
                                                    ? (count / dashboard.total_items) * 100
                                                    : 0
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/50 bg-card p-6">
                            <div className="mb-4 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <h2 className="font-semibold">Enriquecimento IA</h2>
                            </div>
                            <div className="space-y-4">
                                {enrichmentBreakdown.map(([status, count]) => (
                                    <div key={status}>
                                        <div className="mb-1 flex items-center justify-between text-sm">
                                            <span>{status}</span>
                                            <span className="font-medium">{count}</span>
                                        </div>
                                        <Progress
                                            value={
                                                dashboard?.total_items
                                                    ? (count / dashboard.total_items) * 100
                                                    : 0
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                        <div className="rounded-2xl border border-border/50 bg-card p-6">
                            <div className="mb-4 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-warning" />
                                <h2 className="font-semibold">Falhas de extracao</h2>
                            </div>

                            {(extractionFailuresQuery.data?.data?.length ?? 0) === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Nenhuma falha de extracao na amostra atual.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {extractionFailuresQuery.data?.data.map((item) => (
                                        <div
                                            key={item.id}
                                            className="rounded-xl border border-warning/30 bg-warning/5 p-3"
                                        >
                                            <p className="font-medium">{item.title}</p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {item.source?.name ?? "Fonte"} • {item.url}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-border/50 bg-card p-6">
                            <div className="mb-4 flex items-center gap-2">
                                <FileSearch className="h-5 w-5 text-warning" />
                                <h2 className="font-semibold">Falhas de IA</h2>
                            </div>

                            {(enrichmentFailuresQuery.data?.data?.length ?? 0) === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Nenhuma falha de IA na amostra atual.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {enrichmentFailuresQuery.data?.data.map((item) => (
                                        <div
                                            key={item.id}
                                            className="rounded-xl border border-warning/30 bg-warning/5 p-3"
                                        >
                                            <p className="font-medium">{item.title}</p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {item.source?.name ?? "Fonte"} • {item.url}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </AppShell>
    );
};

export default RaspagemFiltros;
