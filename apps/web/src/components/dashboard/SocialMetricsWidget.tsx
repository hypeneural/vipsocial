import { useEffect, useMemo, useState, type ElementType } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  RefreshCw,
  TrendingUp,
  Twitter,
  Users,
  Wallet,
  Youtube,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useSocialDashboard } from "@/hooks/useSocial";
import { cn } from "@/lib/utils";
import type {
  SocialDashboardCard,
  SocialDashboardSeries,
  SocialMetricsWindow,
} from "@/services/social.service";

const compactFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("pt-BR");
const usdFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const windowOptions: Array<{ value: SocialMetricsWindow; label: string }> = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
];

const formatNumber = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return numberFormatter.format(value);
};

const formatCompactNumber = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return compactFormatter.format(value);
};

const formatPercent = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
};

const formatCurrency = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return usdFormatter.format(value);
};

const formatHourMinute = (iso?: string | null) => {
  if (!iso) return "--:--";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "--:--";

  return parsed.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatShortDate = (date?: string | null) => {
  if (!date) return "--";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "--";

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
};

const networkMeta = (
  network?: string
): {
  icon: ElementType;
  color: string;
  softClass: string;
  iconClass: string;
  lineColor: string;
  label: string;
} => {
  const normalized = (network ?? "").trim().toLowerCase();

  if (normalized === "instagram") {
    return {
      icon: Instagram,
      color: "bg-gradient-to-br from-fuchsia-500 to-orange-500",
      softClass: "bg-fuchsia-500/10",
      iconClass: "text-fuchsia-600",
      lineColor: "#c026d3",
      label: "Instagram",
    };
  }

  if (normalized === "facebook") {
    return {
      icon: Facebook,
      color: "bg-blue-600",
      softClass: "bg-blue-600/10",
      iconClass: "text-blue-600",
      lineColor: "#2563eb",
      label: "Facebook",
    };
  }

  if (normalized === "youtube") {
    return {
      icon: Youtube,
      color: "bg-red-600",
      softClass: "bg-red-600/10",
      iconClass: "text-red-600",
      lineColor: "#dc2626",
      label: "YouTube",
    };
  }

  if (normalized === "x" || normalized === "twitter") {
    return {
      icon: Twitter,
      color: "bg-zinc-900",
      softClass: "bg-zinc-900/10",
      iconClass: "text-zinc-700",
      lineColor: "#18181b",
      label: "X",
    };
  }

  return {
    icon: Globe,
    color: "bg-primary",
    softClass: "bg-primary/10",
    iconClass: "text-primary",
    lineColor: "hsl(var(--primary))",
    label: network || "Rede",
  };
};

const resolveStatusBadge = (status: SocialDashboardCard["status"]) => {
  if (status === "ok") {
    return {
      label: "Sincronizado",
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
    };
  }

  if (status === "error") {
    return {
      label: "Com falha",
      className: "border-rose-500/30 bg-rose-500/10 text-rose-700",
    };
  }

  return {
    label: "Pendente",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  };
};

const GrowthChip = ({ value, pct }: { value?: number | null; pct?: number | null }) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        --
      </Badge>
    );
  }

  const isPositive = value >= 0;
  const tone = isPositive
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
    : "border-rose-500/30 bg-rose-500/10 text-rose-700";
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <Badge variant="outline" className={cn("gap-1 text-xs", tone)}>
      <Icon className="h-3.5 w-3.5" />
      {value > 0 ? "+" : ""}
      {formatCompactNumber(value)}
      {typeof pct === "number" && !Number.isNaN(pct) ? ` · ${formatPercent(pct)}` : ""}
    </Badge>
  );
};

const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Users;
}) => (
  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background shadow-sm">
        <Icon className="h-5 w-5 text-primary" />
      </div>
    </div>
  </div>
);

export function SocialMetricsWidget() {
  const [window, setWindow] = useState<SocialMetricsWindow>("30d");
  const { data, isLoading, isFetching, isError, refetch } = useSocialDashboard(
    { window },
    true,
    { staleTime: 300000 }
  );

  const dashboard = data?.data;
  const cards = dashboard?.cards ?? [];
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!cards.length) {
      setSelectedProfileId(null);
      return;
    }

    if (!selectedProfileId || !cards.some((card) => card.id === selectedProfileId)) {
      setSelectedProfileId(cards[0].id);
    }
  }, [cards, selectedProfileId]);

  const selectedCard = useMemo(() => {
    if (!cards.length) return null;
    return cards.find((card) => card.id === selectedProfileId) ?? cards[0];
  }, [cards, selectedProfileId]);

  const chartConfig = useMemo<ChartConfig>(() => {
    return cards.reduce<ChartConfig>((config, card) => {
      config[card.id] = {
        label: card.display_name || card.handle,
        color: networkMeta(card.network).lineColor,
      };

      return config;
    }, {});
  }, [cards]);

  const chartData = useMemo(() => {
    const seriesEntries = Object.values(dashboard?.series ?? {}) as SocialDashboardSeries[];
    const map = new Map<string, Record<string, string | number | null>>();

    seriesEntries.forEach((series) => {
      series.points.forEach((point) => {
        const existing = map.get(point.date) ?? {
          date: point.date,
          label: point.label,
        };

        existing[series.profile_id] = point.value;
        map.set(point.date, existing);
      });
    });

    return Array.from(map.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [dashboard?.series]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.22 }}
      className="rounded-[28px] border border-border/60 bg-card p-4 shadow-lg md:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-border/50 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/12">
              <TrendingUp className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Redes sociais</h3>
              <p className="text-sm text-muted-foreground">
                KPIs diários consolidados via Apify, com histórico local e crescimento por perfil monitorado.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Fonte: snapshots diários</Badge>
            {data?.meta?.generated_at && (
              <Badge variant="outline">
                Atualizado às {formatHourMinute(data.meta.generated_at)}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-2xl bg-muted/30 p-1">
            {windowOptions.map((option) => (
              <Button
                key={option.value}
                size="sm"
                type="button"
                variant={window === option.value ? "default" : "ghost"}
                className="h-8 rounded-xl text-xs"
                onClick={() => setWindow(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={() => refetch()}
            title="Atualizar métricas"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4 py-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.95fr)]">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-2xl bg-muted/40" />
              ))}
            </div>
            <div className="h-[360px] animate-pulse rounded-3xl bg-muted/40" />
          </div>
          <div className="h-[420px] animate-pulse rounded-3xl bg-muted/40" />
        </div>
      )}

      {!isLoading && isError && (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Não foi possível carregar as métricas sociais agora.
        </div>
      )}

      {!isLoading && !isError && dashboard && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Perfis monitorados"
              value={formatNumber(dashboard.summary.profiles_count)}
              subtitle="Perfis ativos no módulo Social"
              icon={Users}
            />
            <SummaryCard
              title="Sincronizados hoje"
              value={formatNumber(dashboard.summary.synced_today_count)}
              subtitle="Snapshots válidos no dia corrente"
              icon={Clock3}
            />
            <SummaryCard
              title="Falhas hoje"
              value={formatNumber(dashboard.summary.failed_today_count)}
              subtitle="Perfis com erro no último ciclo do dia"
              icon={AlertTriangle}
            />
            <SummaryCard
              title="Custo do dia"
              value={formatCurrency(dashboard.summary.cost_today_usd)}
              subtitle="Uso agregado reportado pelo Apify"
              icon={Wallet}
            />
          </div>

          {cards.length === 0 ? (
            <div className="rounded-[24px] border border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
              Nenhum perfil social monitorado ainda. Cadastre perfis em `/api/v1/social/profiles` para alimentar a dashboard.
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.95fr)]">
              <div className="rounded-[24px] border border-border/60 bg-gradient-to-br from-background to-muted/20 p-4 md:p-5">
                <div className="flex flex-col gap-2 border-b border-border/50 pb-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Histórico da métrica principal</p>
                    <p className="text-xs text-muted-foreground">
                      Evolução diária dos perfis monitorados no período selecionado.
                    </p>
                  </div>
                  <Badge variant="outline">
                    {cards.length} perfil{cards.length > 1 ? "s" : ""}
                  </Badge>
                </div>

                {chartData.length === 0 ? (
                  <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                    Sem histórico suficiente para o período.
                  </div>
                ) : (
                  <ChartContainer config={chartConfig} className="mt-4 h-[320px] w-full">
                    <LineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={64}
                        tickFormatter={(value) => formatCompactNumber(Number(value))}
                      />
                      <ChartTooltip
                        content={(
                          <ChartTooltipContent
                            labelFormatter={(value) => `Dia ${String(value)}`}
                            formatter={(value, name) => (
                              <div className="flex min-w-[180px] items-center justify-between gap-3">
                                <span>{chartConfig[String(name)]?.label ?? name}</span>
                                <span className="font-mono font-medium">
                                  {formatNumber(Number(value))}
                                </span>
                              </div>
                            )}
                          />
                        )}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      {cards.map((card) => (
                        <Line
                          key={card.id}
                          type="monotone"
                          dataKey={card.id}
                          stroke={`var(--color-${card.id})`}
                          strokeWidth={2.25}
                          dot={false}
                          activeDot={{ r: 4 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ChartContainer>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-[24px] border border-border/60 bg-muted/15 p-4">
                  <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
                    <div>
                      <p className="text-sm font-semibold">Perfis acompanhados</p>
                      <p className="text-xs text-muted-foreground">
                        Selecione um perfil para ver os detalhes da última captura.
                      </p>
                    </div>
                    {selectedCard && (
                      <Badge variant="outline">{networkMeta(selectedCard.network).label}</Badge>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    {cards.map((card) => {
                      const meta = networkMeta(card.network);
                      const Icon = meta.icon;
                      const statusBadge = resolveStatusBadge(card.status);
                      const isSelected = card.id === selectedCard?.id;

                      return (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => setSelectedProfileId(card.id)}
                          className={cn(
                            "w-full rounded-2xl border px-3 py-3 text-left transition-colors",
                            isSelected
                              ? "border-primary/40 bg-primary/5"
                              : "border-border/60 bg-background hover:bg-muted/40"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", meta.softClass)}>
                              {card.avatar_url ? (
                                <img
                                  src={card.avatar_url}
                                  alt={card.display_name}
                                  className="h-11 w-11 rounded-2xl object-cover"
                                />
                              ) : (
                                <Icon className={cn("h-5 w-5", meta.iconClass)} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold">{card.display_name}</p>
                                  <p className="truncate text-xs text-muted-foreground">@{card.handle}</p>
                                </div>
                                <Badge variant="outline" className={statusBadge.className}>
                                  {statusBadge.label}
                                </Badge>
                              </div>
                              <div className="mt-2 flex items-end justify-between gap-3">
                                <div>
                                  <p className="text-lg font-bold leading-none">{formatNumber(card.current_value)}</p>
                                  <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                                    {card.primary_metric_label}
                                  </p>
                                </div>
                                <GrowthChip value={card.growth_day} pct={card.growth_day_pct} />
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedCard && (
                  <div className="rounded-[24px] border border-border/60 bg-background p-4">
                    <div className="flex flex-col gap-4 border-b border-border/50 pb-4">
                      <div className="flex items-start gap-3">
                        <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", networkMeta(selectedCard.network).softClass)}>
                          {selectedCard.avatar_url ? (
                            <img
                              src={selectedCard.avatar_url}
                              alt={selectedCard.display_name}
                              className="h-14 w-14 rounded-2xl object-cover"
                            />
                          ) : (() => {
                            const Icon = networkMeta(selectedCard.network).icon;
                            return <Icon className={cn("h-6 w-6", networkMeta(selectedCard.network).iconClass)} />;
                          })()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-bold tracking-tight">{selectedCard.display_name}</h4>
                            <Badge variant="outline">{networkMeta(selectedCard.network).label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">@{selectedCard.handle}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              Atualizado em {formatShortDate(selectedCard.last_snapshot_date)}
                            </Badge>
                            {selectedCard.last_synced_at && (
                              <Badge variant="outline">
                                {formatHourMinute(selectedCard.last_synced_at)}
                              </Badge>
                            )}
                            {selectedCard.url && (
                              <a
                                href={selectedCard.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex"
                              >
                                <Badge variant="outline" className="cursor-pointer">
                                  Abrir perfil
                                  <ExternalLink className="ml-1 h-3.5 w-3.5" />
                                </Badge>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                            Atual
                          </p>
                          <p className="mt-2 text-2xl font-bold">{formatNumber(selectedCard.current_value)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{selectedCard.primary_metric_label}</p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                            Crescimento 7d
                          </p>
                          <p className="mt-2 text-2xl font-bold">{formatCompactNumber(selectedCard.growth_7d)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatPercent(selectedCard.growth_7d_pct)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                            Crescimento 30d
                          </p>
                          <p className="mt-2 text-2xl font-bold">{formatCompactNumber(selectedCard.growth_30d)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatPercent(selectedCard.growth_30d_pct)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">Métricas da última captura</p>
                        {selectedCard.last_sync_error && (
                          <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-700">
                            Último erro salvo
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {selectedCard.metrics.map((metric) => (
                          <div
                            key={`${selectedCard.id}-${metric.code}`}
                            className="rounded-2xl border border-border/60 bg-muted/20 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">{metric.label}</p>
                                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                                  {metric.group || "geral"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold">
                                  {metric.value_number !== null
                                    ? formatNumber(metric.value_number)
                                    : metric.value_text || "--"}
                                </p>
                                {metric.raw_key && (
                                  <p className="text-[11px] text-muted-foreground">{metric.raw_key}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedCard.last_sync_error && (
                        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-700">
                          {selectedCard.last_sync_error}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.section>
  );
}
