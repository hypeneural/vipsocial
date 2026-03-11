import {
    AlertTriangle,
    ArrowRightLeft,
    Bot,
    CheckCircle2,
    Cpu,
    FileJson2,
    Gauge,
    RotateCcw,
    ShieldAlert,
    XCircle,
} from "lucide-react";
import { ShimmerKPI } from "@/components/Shimmer";
import { Badge } from "@/components/ui/badge";
import type {
    NewsAiModelHealth,
    NewsAiModelHealthLogSnapshot,
    NewsDashboard,
} from "@/services/newsRadar.service";
import {
    formatAiCategory,
    formatAiHealthStatus,
    formatAiNextAction,
    formatAiProviderStatus,
    formatAiStage,
    formatAiStrategy,
    formatDateTime,
} from "../feed/feed-utils";

interface AiModelHealthPanelProps {
    dashboard?: NewsDashboard;
    isLoading: boolean;
}

const healthToneMap: Record<
    string,
    {
        border: string;
        badge: string;
        icon: typeof CheckCircle2;
    }
> = {
    healthy: {
        border: "border-success/30 bg-success/10",
        badge: "bg-success/15 text-success",
        icon: CheckCircle2,
    },
    recovering: {
        border: "border-info/30 bg-info/10",
        badge: "bg-info/15 text-info",
        icon: RotateCcw,
    },
    unstable: {
        border: "border-warning/30 bg-warning/10",
        badge: "bg-warning/15 text-warning",
        icon: AlertTriangle,
    },
    critical: {
        border: "border-destructive/30 bg-destructive/10",
        badge: "bg-destructive/15 text-destructive",
        icon: ShieldAlert,
    },
};

function formatPercent(value?: number | null): string {
    return `${Math.round((value ?? 0) * 100)}%`;
}

function sortEntries(entries: NewsAiModelHealth[]): NewsAiModelHealth[] {
    const severityRank: Record<string, number> = {
        critical: 0,
        unstable: 1,
        recovering: 2,
        healthy: 3,
    };

    return [...entries].sort((left, right) => {
        const rankDiff =
            (severityRank[left.health_status] ?? 99) - (severityRank[right.health_status] ?? 99);
        if (rankDiff !== 0) return rankDiff;

        const unresolvedDiff = (right.unresolved_failures ?? 0) - (left.unresolved_failures ?? 0);
        if (unresolvedDiff !== 0) return unresolvedDiff;

        const failureDiff = (right.failure_rate ?? 0) - (left.failure_rate ?? 0);
        if (failureDiff !== 0) return failureDiff;

        const rightTime = right.last_attempt_at ? new Date(right.last_attempt_at).getTime() : 0;
        const leftTime = left.last_attempt_at ? new Date(left.last_attempt_at).getTime() : 0;
        return rightTime - leftTime;
    });
}

function summarizeHealth(entries: NewsAiModelHealth[]) {
    return entries.reduce(
        (accumulator, entry) => {
            accumulator.total += 1;
            accumulator.failedAttempts += entry.attempts_failed;
            accumulator.successfulAttempts += entry.attempts_success;
            accumulator.unresolvedFailures += entry.unresolved_failures;
            accumulator.byStatus[entry.health_status] =
                (accumulator.byStatus[entry.health_status] ?? 0) + 1;
            return accumulator;
        },
        {
            total: 0,
            failedAttempts: 0,
            successfulAttempts: 0,
            unresolvedFailures: 0,
            byStatus: {} as Record<string, number>,
        },
    );
}

function breakdownEntries(breakdown?: Record<string, number> | null): Array<[string, number]> {
    return Object.entries(breakdown ?? {}).sort((left, right) => right[1] - left[1]);
}

function prettyJson(value: unknown): string {
    if (value === null || value === undefined) {
        return "Sem payload detalhado.";
    }

    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

function extractMetaString(
    metaJson: Record<string, unknown> | null | undefined,
    key: string,
): string | null {
    const value = metaJson?.[key];
    if (typeof value === "string" && value.trim()) {
        return value.trim();
    }

    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }

    return null;
}

function hasMetaValue(metaJson: Record<string, unknown> | null | undefined, key: string): boolean {
    return Boolean(metaJson && Object.prototype.hasOwnProperty.call(metaJson, key) && metaJson[key] !== null);
}

function BreakdownGroup({
    title,
    entries,
    formatter,
}: {
    title: string;
    entries: Array<[string, number]>;
    formatter?: (value: string) => string;
}) {
    if (entries.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-border/50 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
                <p className="mt-2 text-sm text-muted-foreground">Sem ocorrencias na janela atual.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border/50 bg-background/60 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
            <div className="mt-3 flex flex-wrap gap-2">
                {entries.map(([key, count]) => (
                    <Badge key={`${title}-${key}`} variant="secondary" className="rounded-full">
                        {formatter ? formatter(key) : key}: {count}
                    </Badge>
                ))}
            </div>
        </div>
    );
}

function JsonBlock({
    title,
    value,
}: {
    title: string;
    value: unknown;
}) {
    return (
        <div className="rounded-xl border border-border/50 bg-background/80 p-3">
            <div className="mb-2 flex items-center gap-2">
                <FileJson2 className="h-4 w-4 text-primary" />
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
            </div>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted/40 p-3 text-[11px] leading-5 text-foreground/90">
                {prettyJson(value)}
            </pre>
        </div>
    );
}

function RecentLogCard({ log }: { log: NewsAiModelHealthLogSnapshot }) {
    const metaJson = log.meta_json ?? null;
    const rawErrorPayload = metaJson?.raw_error_payload;
    const rawData = metaJson?.raw_data;
    const rawErrorBody = extractMetaString(metaJson, "raw_error_body");
    const rawContentBody = extractMetaString(metaJson, "raw_content_body");
    const rawErrorExcerpt = extractMetaString(metaJson, "raw_error_excerpt");
    const rawContentExcerpt = extractMetaString(metaJson, "raw_content_excerpt");
    const rawDataExcerpt = extractMetaString(metaJson, "raw_data_excerpt");

    return (
        <div className="rounded-xl border border-border/50 bg-background/60 p-3">
            <div className="flex flex-wrap items-center gap-2">
                <Badge
                    className={`rounded-full ${
                        log.status === "success"
                            ? "bg-success/15 text-success"
                            : "bg-destructive/15 text-destructive"
                    }`}
                >
                    {log.status === "success" ? "Sucesso" : "Falha"}
                </Badge>
                {metaJson?.strategy && (
                    <Badge variant="secondary" className="rounded-full">
                        {formatAiStrategy(String(metaJson.strategy))}
                    </Badge>
                )}
                {metaJson?.category && (
                    <Badge variant="secondary" className="rounded-full">
                        {formatAiCategory(String(metaJson.category))}
                    </Badge>
                )}
                {metaJson?.provider_status !== undefined && (
                    <Badge variant="secondary" className="rounded-full">
                        {formatAiProviderStatus(metaJson.provider_status as string | number)}
                    </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                    {formatDateTime(log.created_at)}
                </span>
            </div>

            <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-4">
                <div>
                    <span className="font-medium text-foreground">Item:</span>{" "}
                    {log.news_item_id ?? "-"}
                </div>
                <div>
                    <span className="font-medium text-foreground">Tokens:</span>{" "}
                    {log.tokens_used ?? 0}
                </div>
                <div>
                    <span className="font-medium text-foreground">Acao:</span>{" "}
                    {formatAiNextAction(
                        typeof metaJson?.next_action === "string" ? metaJson.next_action : null,
                    )}
                </div>
                <div>
                    <span className="font-medium text-foreground">Status provider:</span>{" "}
                    {formatAiProviderStatus(
                        (metaJson?.provider_status as string | number | undefined) ?? null,
                    )}
                </div>
            </div>

            {log.error_message && (
                <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs leading-5 text-foreground/90">
                    {log.error_message}
                </div>
            )}

            {(rawErrorPayload ||
                rawErrorBody ||
                rawContentBody ||
                hasMetaValue(metaJson, "raw_data") ||
                rawErrorExcerpt ||
                rawContentExcerpt ||
                rawDataExcerpt) && (
                <div className="mt-3 grid gap-3 xl:grid-cols-3">
                    {rawErrorPayload && (
                        <JsonBlock title="raw_error_payload" value={rawErrorPayload} />
                    )}
                    {rawErrorBody && <JsonBlock title="raw_error_body" value={rawErrorBody} />}
                    {rawContentBody && (
                        <JsonBlock title="raw_content_body" value={rawContentBody} />
                    )}
                    {hasMetaValue(metaJson, "raw_data") && (
                        <JsonBlock title="raw_data" value={rawData} />
                    )}
                    {rawErrorExcerpt && (
                        <JsonBlock title="raw_error_excerpt" value={rawErrorExcerpt} />
                    )}
                    {rawContentExcerpt && (
                        <JsonBlock title="raw_content_excerpt" value={rawContentExcerpt} />
                    )}
                    {rawDataExcerpt && (
                        <JsonBlock title="raw_data_excerpt" value={rawDataExcerpt} />
                    )}
                </div>
            )}
        </div>
    );
}

export function AiModelHealthPanel({ dashboard, isLoading }: AiModelHealthPanelProps) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    <ShimmerKPI />
                    <ShimmerKPI />
                    <ShimmerKPI />
                    <ShimmerKPI />
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                    <ShimmerKPI />
                    <ShimmerKPI />
                </div>
            </div>
        );
    }

    const entries = sortEntries(dashboard?.ai_model_health ?? []);
    const summary = summarizeHealth(entries);

    return (
        <section className="rounded-3xl border border-border/50 bg-card p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Saude dos modelos de IA</h2>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                        Monitor de 7 dias com taxa de falha, fallback, retries e payload bruto das
                        ultimas respostas para identificar incompatibilidade de schema, timeout,
                        erro de provider e JSON invalido sem depender do log do worker.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-full">
                        {summary.total} modelos monitorados
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                        {summary.successfulAttempts} sucessos
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                        {summary.failedAttempts} falhas
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                        {summary.unresolvedFailures} falhas sem recuperacao
                    </Badge>
                </div>
            </div>

            {!entries.length ? (
                <div className="mt-6 rounded-2xl border border-dashed border-border/50 p-6 text-sm text-muted-foreground">
                    Ainda nao existem logs de IA suficientes para montar a saude dos modelos.
                </div>
            ) : (
                <>
                    <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-5">
                        <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Cpu className="h-4 w-4 text-primary" />
                                Modelos
                            </div>
                            <p className="mt-1 text-2xl font-bold">{summary.total}</p>
                        </div>

                        <div className="rounded-2xl border border-success/30 bg-success/10 p-4">
                            <div className="flex items-center gap-2 text-sm text-success">
                                <CheckCircle2 className="h-4 w-4" />
                                Saudaveis
                            </div>
                            <p className="mt-1 text-2xl font-bold text-success">
                                {summary.byStatus.healthy ?? 0}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-info/30 bg-info/10 p-4">
                            <div className="flex items-center gap-2 text-sm text-info">
                                <RotateCcw className="h-4 w-4" />
                                Recuperando
                            </div>
                            <p className="mt-1 text-2xl font-bold text-info">
                                {summary.byStatus.recovering ?? 0}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
                            <div className="flex items-center gap-2 text-sm text-warning">
                                <AlertTriangle className="h-4 w-4" />
                                Instaveis
                            </div>
                            <p className="mt-1 text-2xl font-bold text-warning">
                                {summary.byStatus.unstable ?? 0}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
                            <div className="flex items-center gap-2 text-sm text-destructive">
                                <XCircle className="h-4 w-4" />
                                Criticos
                            </div>
                            <p className="mt-1 text-2xl font-bold text-destructive">
                                {summary.byStatus.critical ?? 0}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {entries.map((entry) => {
                            const tone = healthToneMap[entry.health_status] ?? healthToneMap.critical;
                            const StatusIcon = tone.icon;

                            return (
                                <article
                                    key={`${entry.stage}-${entry.model}`}
                                    className={`rounded-2xl border p-5 ${tone.border}`}
                                >
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge className={`rounded-full ${tone.badge}`}>
                                                    <StatusIcon className="mr-1 h-3.5 w-3.5" />
                                                    {formatAiHealthStatus(entry.health_status)}
                                                </Badge>
                                                <Badge variant="secondary" className="rounded-full">
                                                    {formatAiStage(entry.stage)}
                                                </Badge>
                                                <Badge variant="secondary" className="rounded-full">
                                                    {entry.model}
                                                </Badge>
                                            </div>

                                            <p className="text-lg font-semibold">{entry.model}</p>

                                            <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                                                <div>
                                                    <span className="font-medium text-foreground">
                                                        Taxa de falha:
                                                    </span>{" "}
                                                    {formatPercent(entry.failure_rate)}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-foreground">
                                                        Taxa de sucesso:
                                                    </span>{" "}
                                                    {formatPercent(entry.success_rate)}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-foreground">
                                                        Ultima falha:
                                                    </span>{" "}
                                                    {formatDateTime(entry.last_failure_at)}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-foreground">
                                                        Ultimo sucesso:
                                                    </span>{" "}
                                                    {formatDateTime(entry.last_success_at)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 xl:min-w-[420px] xl:grid-cols-3">
                                            <div className="rounded-xl border border-border/50 bg-background/70 p-3">
                                                <p className="text-xs text-muted-foreground">Tentativas</p>
                                                <p className="mt-1 text-xl font-semibold">
                                                    {entry.attempts_total}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-success/20 bg-background/70 p-3">
                                                <p className="text-xs text-muted-foreground">Sucessos</p>
                                                <p className="mt-1 text-xl font-semibold text-success">
                                                    {entry.attempts_success}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-destructive/20 bg-background/70 p-3">
                                                <p className="text-xs text-muted-foreground">Falhas</p>
                                                <p className="mt-1 text-xl font-semibold text-destructive">
                                                    {entry.attempts_failed}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-warning/20 bg-background/70 p-3">
                                                <p className="text-xs text-muted-foreground">
                                                    Falhas finais
                                                </p>
                                                <p className="mt-1 text-xl font-semibold text-warning">
                                                    {entry.unresolved_failures}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-info/20 bg-background/70 p-3">
                                                <p className="text-xs text-muted-foreground">
                                                    Fallbacks
                                                </p>
                                                <p className="mt-1 text-xl font-semibold text-info">
                                                    {entry.fallback_next_model_count}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-border/50 bg-background/70 p-3">
                                                <p className="text-xs text-muted-foreground">Retries</p>
                                                <p className="mt-1 text-xl font-semibold">
                                                    {entry.retry_same_model_count}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {entry.last_error_message && (
                                        <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                                            <div className="flex items-center gap-2">
                                                <Gauge className="h-4 w-4 text-destructive" />
                                                <p className="text-sm font-medium">
                                                    Ultima mensagem de erro consolidada
                                                </p>
                                            </div>
                                            <p className="mt-2 text-sm leading-6 text-foreground/90">
                                                {entry.last_error_message}
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                        <div className="space-y-3">
                                            <BreakdownGroup
                                                title="Categorias de erro"
                                                entries={breakdownEntries(entry.category_breakdown)}
                                                formatter={formatAiCategory}
                                            />
                                            <BreakdownGroup
                                                title="Estrategias usadas"
                                                entries={breakdownEntries(entry.strategy_breakdown)}
                                                formatter={formatAiStrategy}
                                            />
                                            <BreakdownGroup
                                                title="Proximo passo decidido"
                                                entries={breakdownEntries(entry.next_action_breakdown)}
                                                formatter={formatAiNextAction}
                                            />
                                            <BreakdownGroup
                                                title="Status do provider"
                                                entries={breakdownEntries(
                                                    entry.provider_status_breakdown,
                                                )}
                                                formatter={formatAiProviderStatus}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <JsonBlock
                                                title="Ultima falha - meta_json"
                                                value={entry.latest_failure?.meta_json ?? null}
                                            />
                                            <JsonBlock
                                                title="Ultimo sucesso - meta_json"
                                                value={entry.latest_success?.meta_json ?? null}
                                            />
                                            <JsonBlock
                                                title="Ultimo log observado"
                                                value={entry.latest_log ?? null}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-2xl border border-border/50 bg-background/60 p-4">
                                        <div className="mb-3 flex items-center gap-2">
                                            <ArrowRightLeft className="h-4 w-4 text-primary" />
                                            <p className="text-sm font-medium">
                                                Sequencia dos ultimos logs do modelo
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            {(entry.recent_logs ?? []).map((log, index) => (
                                                <RecentLogCard
                                                    key={`${entry.stage}-${entry.model}-${index}`}
                                                    log={log}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </>
            )}
        </section>
    );
}
