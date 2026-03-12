import { Layers3, Rss, ShieldAlert, TrendingUp } from "lucide-react";
import { ShimmerKPI } from "@/components/Shimmer";
import type { NewsDashboard } from "@/services/newsRadar.service";

interface FeedStatsProps {
    dashboard?: NewsDashboard;
    isLoading: boolean;
}

export function FeedStats({ dashboard, isLoading }: FeedStatsProps) {
    const dashboardTimezone = dashboard?.dashboard_timezone ?? "America/Sao_Paulo";
    const dashboardWeekStartsAt = dashboard?.dashboard_week_starts_at ?? "Sunday";

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
        <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="rounded-2xl border border-border/50 bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Rss className="h-4 w-4 text-primary" />
                    Fontes ativas
                </div>
                <p className="mt-1 text-2xl font-bold">{dashboard?.total_sources ?? 0}</p>
            </div>

            <div className="rounded-2xl border border-success/30 bg-success/10 p-4">
                <div className="flex items-center gap-2 text-sm text-success">
                    <TrendingUp className="h-4 w-4" />
                    Itens hoje
                </div>
                <p className="mt-1 text-2xl font-bold text-success">
                    {dashboard?.items_today ?? 0}
                </p>
                <p className="mt-1 text-xs text-success/80">Corte em {dashboardTimezone}</p>
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
                <p className="mt-1 text-2xl font-bold">{dashboard?.items_this_week ?? 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Semana atual em {dashboardTimezone}, iniciando em {dashboardWeekStartsAt}
                </p>
            </div>
        </div>
    );
}
