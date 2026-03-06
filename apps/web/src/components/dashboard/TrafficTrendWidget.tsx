import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useAnalyticsTimeseries } from "@/hooks/useAnalytics";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, Eye, LineChart as LineChartIcon, Users } from "lucide-react";
import { motion } from "framer-motion";

const compactFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatCompactNumber = (value?: number) => {
  if (typeof value !== "number") return "--";
  return compactFormatter.format(value);
};

const formatShortDateLabel = (value?: string) => {
  if (!value) return "--";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year.slice(2)}`;
  }

  if (/^\d{8}$/.test(value)) {
    const year = value.slice(0, 4);
    const month = value.slice(4, 6);
    const day = value.slice(6, 8);
    return `${day}/${month}/${year.slice(2)}`;
  }

  return value;
};

const metricMeta: Record<string, { label: string; icon?: typeof Eye }> = {
  pageviews: { label: "Visualizacoes de pagina", icon: Eye },
  users: { label: "Visitantes unicos", icon: Users },
};

const trafficChartConfig = {
  pageviews: {
    label: metricMeta.pageviews.label,
    color: "hsl(var(--primary))",
    icon: metricMeta.pageviews.icon,
  },
  users: {
    label: metricMeta.users.label,
    color: "#06b6d4",
    icon: metricMeta.users.icon,
  },
} satisfies ChartConfig;

const TrafficTrendWidget = () => {
  const [period, setPeriod] = useState<"30d" | "90d" | "custom">("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const canLoadCustom = customStart !== "" && customEnd !== "";

  const timeseriesParams = useMemo(() => {
    if (period === "90d") {
      return {
        date_preset: "custom" as const,
        start_date: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        end_date: new Date().toISOString().slice(0, 10),
        metrics: ["pageviews", "users"],
        granularity: "day" as const,
        keep_empty_rows: 1,
      };
    }

    if (period === "custom" && canLoadCustom) {
      return {
        date_preset: "custom" as const,
        start_date: customStart,
        end_date: customEnd,
        metrics: ["pageviews", "users"],
        granularity: "day" as const,
        keep_empty_rows: 1,
      };
    }

    return {
      date_preset: "last_30_days" as const,
      metrics: ["pageviews", "users"],
      granularity: "day" as const,
      keep_empty_rows: 1,
    };
  }, [period, customStart, customEnd, canLoadCustom]);

  const shouldFetchTimeseries = period !== "custom" || canLoadCustom;

  const { data: timeseriesResponse, isLoading: timeseriesLoading } = useAnalyticsTimeseries(
    timeseriesParams,
    shouldFetchTimeseries,
    { staleTime: 1800000 }
  );

  const chartData = useMemo(() => {
    const points = timeseriesResponse?.data?.points ?? [];

    return points.map((point) => ({
      date: point.label,
      pageviews: Number(point.values?.pageviews ?? point.value ?? 0),
      users: Number(point.values?.users ?? 0),
    }));
  }, [timeseriesResponse]);

  const totals = useMemo(() => {
    return chartData.reduce(
      (acc, point) => {
        acc.pageviews += point.pageviews;
        acc.users += point.users;
        return acc;
      },
      { pageviews: 0, users: 0 }
    );
  }, [chartData]);

  const dateRangeLabel = useMemo(() => {
    if (chartData.length === 0) {
      return "--";
    }

    const firstDate = chartData[0].date;
    const lastDate = chartData[chartData.length - 1].date;
    return `${formatShortDateLabel(firstDate)} a ${formatShortDateLabel(lastDate)}`;
  }, [chartData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card rounded-xl border p-4 mb-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-primary" />
            Tendencia de Trafego
          </h3>
          <p className="text-xs text-muted-foreground">
            Comparativo diario entre visualizacoes de pagina e visitantes unicos.
          </p>
        </div>
        <Select value={period} onValueChange={(value) => setPeriod(value as "30d" | "90d" | "custom")}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Ultimos 30 dias</SelectItem>
            <SelectItem value="90d">Ultimos 90 dias</SelectItem>
            <SelectItem value="custom">Periodo especifico</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {period === "custom" && (
        <div className="flex gap-2 mb-4">
          <Input
            type="date"
            value={customStart}
            onChange={(event) => setCustomStart(event.target.value)}
            className="h-8 text-xs"
            placeholder="Inicio"
          />
          <Input
            type="date"
            value={customEnd}
            onChange={(event) => setCustomEnd(event.target.value)}
            className="h-8 text-xs"
            placeholder="Fim"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        <Badge variant="outline" className="gap-1">
          <Eye className="w-3 h-3 text-primary" />
          Visualizacoes de pagina: {formatCompactNumber(totals.pageviews)}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Users className="w-3 h-3 text-cyan-600" />
          Visitantes unicos: {formatCompactNumber(totals.users)}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <CalendarDays className="w-3 h-3 text-muted-foreground" />
          Periodo: {dateRangeLabel}
        </Badge>
      </div>

      {period === "custom" && !canLoadCustom && (
        <div className="h-[340px] flex items-center justify-center text-sm text-muted-foreground">
          Selecione inicio e fim para carregar o grafico.
        </div>
      )}

      {shouldFetchTimeseries && timeseriesLoading && (
        <div className="h-[340px] flex items-center justify-center text-sm text-muted-foreground">
          Carregando serie temporal...
        </div>
      )}

      {shouldFetchTimeseries && !timeseriesLoading && chartData.length === 0 && (
        <div className="h-[340px] flex items-center justify-center text-sm text-muted-foreground">
          Sem dados para o periodo selecionado.
        </div>
      )}

      {shouldFetchTimeseries && !timeseriesLoading && chartData.length > 0 && (
        <ChartContainer config={trafficChartConfig} className="h-[340px] w-full">
          <LineChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              minTickGap={28}
              tickFormatter={(value) => formatShortDateLabel(String(value))}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={62}
              tickFormatter={(value) => formatCompactNumber(Number(value))}
            />
            <ChartTooltip
              content={(
                <ChartTooltipContent
                  labelFormatter={(value) => formatShortDateLabel(String(value))}
                  formatter={(value, name) => (
                    <div className="flex items-center justify-between w-full min-w-[160px] gap-3">
                      <span className="inline-flex items-center gap-1">
                        {(() => {
                          const meta = metricMeta[String(name)];
                          const Icon = meta?.icon;
                          return Icon ? <Icon className="w-3 h-3" /> : null;
                        })()}
                        {metricMeta[String(name)]?.label ?? String(name)}
                      </span>
                      <span className="font-mono font-medium">{formatCompactNumber(Number(value))}</span>
                    </div>
                  )}
                />
              )}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey="pageviews"
              type="monotone"
              stroke="var(--color-pageviews)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              dataKey="users"
              type="monotone"
              stroke="var(--color-users)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      )}
    </motion.div>
  );
};

export default TrafficTrendWidget;
