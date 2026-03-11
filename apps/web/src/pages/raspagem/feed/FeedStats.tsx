import { Bot, Layers3, Rss, ShieldAlert, TrendingUp } from "lucide-react";
import { ShimmerKPI } from "@/components/Shimmer";
import type { NewsDashboard } from "@/services/newsRadar.service";
import { formatAiStage, formatDateTime } from "./feed-utils";

interface FeedStatsProps {
    dashboard?: NewsDashboard;
    isLoading: boolean;
}

export function FeedStats({ dashboard, isLoading }: FeedStatsProps) {
    if (isLoading) {
        return (
            <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
                <ShimmerKPI />
                <ShimmerKPI />
                <ShimmerKPI />
                <ShimmerKPI />
            </div>
        );
    }

    return (
        <div className="mb-6 space-y-3">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
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
            </div>

            {!!dashboard?.ai_model_health?.length && (
                <div className="rounded-2xl border border-border/50 bg-card p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Bot className="h-4 w-4 text-primary" />
                        Saude dos modelos de IA
                    </div>

                    <div className="grid gap-3 xl:grid-cols-3">
                        {dashboard.ai_model_health.slice(0, 6).map((entry) => (
                            <div
                                key={`${entry.stage}-${entry.model}`}
                                className="rounded-xl border border-border/50 bg-background/70 p-3"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                            {formatAiStage(entry.stage)}
                                        </p>
                                        <p className="mt-1 text-sm font-medium">{entry.model}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">
                                            {Math.round(entry.failure_rate * 100)}%
                                        </p>
                                        <p className="text-xs text-muted-foreground">falha</p>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    <span>{entry.attempts_total} tentativas</span>
                                    <span>{entry.attempts_failed} falhas</span>
                                    {entry.last_attempt_at && (
                                        <span>{formatDateTime(entry.last_attempt_at)}</span>
                                    )}
                                </div>

                                {entry.last_error_message && (
                                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                                        {entry.last_error_message}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
