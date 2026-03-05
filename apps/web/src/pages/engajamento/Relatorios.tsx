import { useMemo, useState, type ElementType } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import {
  useAnalyticsKpis,
  useAnalyticsTimeseries,
  useAnalyticsTopPages,
} from "@/hooks/useAnalytics";

interface MetricCard {
  title: string;
  value: string;
  change: number;
  icon: ElementType;
}

const compactFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatCompactNumber = (value?: number) => {
  if (typeof value !== "number") return "--";
  return compactFormatter.format(value);
};

const resolvePeriodQuery = (period: string) => {
  if (period === "7d") {
    return { date_preset: "last_7_days" as const };
  }

  if (period === "30d") {
    return { date_preset: "last_30_days" as const };
  }

  const endDate = format(new Date(), "yyyy-MM-dd");
  const startDate = format(subDays(new Date(), 89), "yyyy-MM-dd");

  return {
    date_preset: "custom" as const,
    start_date: startDate,
    end_date: endDate,
  };
};

const typeConfig = {
  roteiro: { label: "Roteiro", color: "bg-primary/15 text-primary" },
  enquete: { label: "Enquete", color: "bg-info/15 text-info" },
  alerta: { label: "Alerta", color: "bg-warning/15 text-warning" },
};

const resolveTypeByPath = (path: string): keyof typeof typeConfig => {
  if (path.includes("/enquete/")) return "enquete";
  if (path.includes("/alerta/")) return "alerta";
  return "roteiro";
};

function StatCard({ metric }: { metric: MetricCard }) {
  const Icon = metric.icon;
  const isPositive = metric.change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border/50 p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{metric.title}</span>
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-3xl font-bold mb-1">{metric.value}</p>
      <div className={cn("flex items-center gap-1 text-sm", isPositive ? "text-success" : "text-destructive")}>
        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        <span>{Math.abs(metric.change).toFixed(1)}%</span>
        <span className="text-muted-foreground">vs periodo anterior</span>
      </div>
    </motion.div>
  );
}

const Relatorios = () => {
  const [period, setPeriod] = useState("7d");
  const [contentType, setContentType] = useState("all");

  const periodQuery = useMemo(() => resolvePeriodQuery(period), [period]);

  const pathPrefix = useMemo(() => {
    if (contentType === "roteiro") return "/roteiro/";
    if (contentType === "enquete") return "/enquete/";
    if (contentType === "alerta") return "/alerta/";
    return undefined;
  }, [contentType]);

  const { data: kpisResponse, isLoading: kpisLoading } = useAnalyticsKpis(
    { ...periodQuery, compare: "previous_period" },
    true
  );

  const { data: topPagesResponse, isLoading: topPagesLoading } = useAnalyticsTopPages(
    {
      ...periodQuery,
      limit: 10,
      path_prefix: pathPrefix,
    },
    true
  );

  const { data: timeseriesResponse, isLoading: timeseriesLoading } = useAnalyticsTimeseries(
    {
      ...periodQuery,
      metric: "pageviews",
      granularity: "day",
    },
    true
  );

  const totals = kpisResponse?.data?.totals;
  const comparison = kpisResponse?.data?.comparison;

  const metrics: MetricCard[] = useMemo(
    () => [
      {
        title: "Visualizacoes",
        value: formatCompactNumber(totals?.pageviews),
        change: comparison?.pageviews_pct ?? 0,
        icon: Eye,
      },
      {
        title: "Engajamento",
        value: `${totals?.engagement_rate?.toFixed(1) ?? "--"}%`,
        change: comparison?.active_users_pct ?? 0,
        icon: TrendingUp,
      },
      {
        title: "Usuarios",
        value: formatCompactNumber(totals?.users),
        change: comparison?.users_pct ?? 0,
        icon: Users,
      },
      {
        title: "Sessoes",
        value: formatCompactNumber(totals?.sessions),
        change: comparison?.sessions_pct ?? 0,
        icon: BarChart3,
      },
    ],
    [totals, comparison]
  );

  const chartPoints = timeseriesResponse?.data?.points?.slice(-14) ?? [];
  const maxChartValue = Math.max(...chartPoints.map((point) => point.value), 1);

  const topItems = topPagesResponse?.data?.items ?? [];

  const handleExport = () => {
    toast.loading("Gerando relatorio...");
    setTimeout(() => {
      toast.dismiss();
      toast.success("Relatorio exportado com sucesso!");
    }, 1200);
  };

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Relatorios de Engajamento
            </h1>
            <p className="text-sm text-muted-foreground">Metricas e performance de conteudo</p>
          </div>

          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[160px] rounded-xl">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Ultimos 7 dias</SelectItem>
                <SelectItem value="30d">Ultimos 30 dias</SelectItem>
                <SelectItem value="90d">Ultimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="rounded-xl" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric, index) => (
          <motion.div key={metric.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <StatCard metric={metric} />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card rounded-2xl border border-border/50 p-6 mb-8"
      >
        <h2 className="text-lg font-semibold mb-4">Evolucao de Pageviews</h2>

        {timeseriesLoading && (
          <div className="h-[220px] flex items-center justify-center text-muted-foreground">
            Carregando serie temporal...
          </div>
        )}

        {!timeseriesLoading && chartPoints.length === 0 && (
          <div className="h-[220px] flex items-center justify-center text-muted-foreground">
            Sem dados para o periodo selecionado.
          </div>
        )}

        {!timeseriesLoading && chartPoints.length > 0 && (
          <div className="h-[220px] flex items-end gap-2 overflow-x-auto pb-1">
            {chartPoints.map((point) => {
              const barHeight = Math.max((point.value / maxChartValue) * 100, 6);
              return (
                <div key={point.period} className="min-w-[40px] flex flex-col items-center gap-2">
                  <div className="w-6 rounded-t bg-primary/80" style={{ height: `${barHeight}%` }} />
                  <span className="text-[10px] text-muted-foreground">{point.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card rounded-2xl border border-border/50 overflow-hidden"
      >
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Conteudo com Melhor Performance</h2>
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger className="w-[150px] rounded-xl">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="roteiro">Roteiros</SelectItem>
              <SelectItem value="enquete">Enquetes</SelectItem>
              <SelectItem value="alerta">Alertas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {topPagesLoading && (
          <div className="p-6 text-muted-foreground">Carregando ranking...</div>
        )}

        {!topPagesLoading && topItems.length === 0 && (
          <div className="p-6 text-muted-foreground">Nenhum conteudo encontrado para esse filtro.</div>
        )}

        {!topPagesLoading && topItems.length > 0 && (
          <div className="divide-y divide-border/50">
            {topItems.map((item, index) => {
              const type = resolveTypeByPath(item.path);
              const config = typeConfig[type];

              return (
                <motion.div
                  key={`${item.rank}-${item.path}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={config.color}>{config.label}</Badge>
                        <span className="text-xs text-muted-foreground truncate">{item.path}</span>
                      </div>
                      <h3 className="font-medium truncate">{item.title || item.path}</h3>
                    </div>

                    <div className="flex gap-6 text-sm shrink-0">
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs">Views</p>
                        <p className="font-semibold">{formatCompactNumber(item.views)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs">Participacao</p>
                        <p className="font-semibold text-success">{item.percentage_of_total.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {kpisLoading && (
        <div className="mt-4 text-xs text-muted-foreground">Atualizando KPIs...</div>
      )}
    </AppShell>
  );
};

export default Relatorios;
