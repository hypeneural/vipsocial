import { useEffect, useId, useMemo, useState, type ElementType } from "react";
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
  MessageCircle,
  RefreshCw,
  Share2,
  TrendingUp,
  Twitter,
  Users,
  Wallet,
  Youtube,
} from "lucide-react";
import {
  Cell,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useSocialDashboard } from "@/hooks/useSocial";
import { useWhatsAppGroupsDashboard } from "@/hooks/useWhatsApp";
import { cn } from "@/lib/utils";
import type {
  SocialDashboardCard,
  SocialDashboardSeries,
  SocialMetricsWindow,
} from "@/services/social.service";
import type { WhatsAppMetricsWindow } from "@/services/whatsapp.service";

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

const instagramGradient = "linear-gradient(135deg, #f58529 0%, #feda77 20%, #dd2a7b 48%, #8134af 72%, #515bd4 100%)";

const normalizeNetwork = (network?: string | null) => (network ?? "").trim().toLowerCase();

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

const metricLabelMap: Record<string, string> = {
  followers_total: "Seguidores",
  following_total: "Seguindo",
  likes_total: "Curtidas",
  subscribers_total: "Inscritos",
  posts_total: "Posts",
  videos_total: "Vídeos",
  views_total: "Visualizações",
  rating_overall: "Avaliação",
  rating_count: "Quantidade de avaliações",
};

const metricGroupMap: Record<string, string> = {
  audience: "Audiência",
  content: "Conteúdo",
  engagement: "Engajamento",
  account: "Conta",
  general: "Geral",
};

const translateMetricLabel = (code?: string | null, fallback?: string | null) => {
  if (code && metricLabelMap[code]) {
    return metricLabelMap[code];
  }

  return fallback || "Métrica";
};

const translateMetricGroup = (group?: string | null) => {
  if (!group) {
    return "Geral";
  }

  return metricGroupMap[group] || group;
};

const translateMetricUnit = (unit?: string | null) => {
  if (!unit) {
    return null;
  }

  if (unit === "count") {
    return "Contagem monitorada";
  }

  if (unit === "percent") {
    return "Percentual monitorado";
  }

  return unit;
};

const isDirectAvatarBlocked = (card: Pick<SocialDashboardCard, "network" | "avatar_url">) => {
  const url = (card.avatar_url ?? "").toLowerCase();
  const network = normalizeNetwork(card.network);

  return network === "instagram" || url.includes("cdninstagram.com");
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

  if (normalized === "whatsapp") {
    return {
      icon: MessageCircle,
      color: "bg-green-600",
      softClass: "bg-green-600/10",
      iconClass: "text-green-600",
      lineColor: "#16a34a",
      label: "WhatsApp",
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

const getNetworkSwatchStyle = (network?: string | null) => {
  const normalized = normalizeNetwork(network);

  if (normalized === "instagram") {
    return { backgroundImage: instagramGradient };
  }

  if (normalized === "facebook") {
    return { backgroundColor: "#2563eb" };
  }

  if (normalized === "youtube") {
    return { backgroundColor: "#dc2626" };
  }

  if (normalized === "whatsapp") {
    return { backgroundColor: "#16a34a" };
  }

  if (normalized === "x" || normalized === "twitter") {
    return { backgroundColor: "#18181b" };
  }

  return { backgroundColor: "hsl(var(--primary))" };
};

const getNetworkPieFill = (network: string | null | undefined, instagramGradientId: string) => {
  const normalized = normalizeNetwork(network);

  if (normalized === "instagram") {
    return `url(#${instagramGradientId})`;
  }

  return getNetworkSwatchStyle(network).backgroundColor ?? "hsl(var(--primary))";
};

const profileHeadline = (card: Pick<SocialDashboardCard, "network" | "display_name" | "handle">) => {
  const meta = networkMeta(card.network);
  return `${meta.label} · ${card.display_name || `@${card.handle}`}`;
};

const profileSubheadline = (card: Pick<SocialDashboardCard, "network" | "handle">) => {
  const meta = networkMeta(card.network);
  return `${meta.label} · @${card.handle}`;
};

const resolveAvatarSrc = (card: Pick<SocialDashboardCard, "avatar_proxy_url" | "avatar_url" | "network">) => {
  if (card.avatar_proxy_url) {
    return card.avatar_proxy_url;
  }

  if (card.avatar_url && !isDirectAvatarBlocked(card)) {
    return card.avatar_url;
  }

  return null;
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

const SocialAvatar = ({
  card,
  size = "md",
}: {
  card: Pick<SocialDashboardCard, "avatar_proxy_url" | "avatar_url" | "network" | "display_name" | "handle">;
  size?: "md" | "lg";
}) => {
  const meta = networkMeta(card.network);
  const Icon = meta.icon;
  const [failed, setFailed] = useState(false);
  const src = failed ? null : resolveAvatarSrc(card);
  const className = size === "lg" ? "h-14 w-14 rounded-2xl" : "h-11 w-11 rounded-2xl";
  const iconClass = size === "lg" ? "h-6 w-6" : "h-5 w-5";

  return (
    <div className={cn("flex items-center justify-center overflow-hidden", className, meta.softClass)}>
      {src ? (
        <img
          src={src}
          alt={card.display_name || card.handle}
          className={cn("object-cover", className)}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <Icon className={cn(iconClass, meta.iconClass)} />
      )}
    </div>
  );
};

const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  toneClass = "text-primary",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Users;
  toneClass?: string;
}) => (
  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background shadow-sm">
        <Icon className={cn("h-5 w-5", toneClass)} />
      </div>
    </div>
  </div>
);

export function SocialMetricsWidget() {
  const [window, setWindow] = useState<SocialMetricsWindow>("30d");
  const [activeCompositionKey, setActiveCompositionKey] = useState<string | null>(null);
  const { data, isLoading, isFetching, isError, refetch } = useSocialDashboard(
    { window },
    true,
    { staleTime: 300000 }
  );
  const whatsappWindow: WhatsAppMetricsWindow = window === "7d" ? "7d" : "30d";
  const { data: whatsappData } = useWhatsAppGroupsDashboard(
    { window: whatsappWindow },
    true,
    { staleTime: 120000 }
  );

  const dashboard = data?.data;
  const whatsappDashboard = whatsappData?.data;
  const whatsappSummary = whatsappDashboard?.summary;
  const cards = dashboard?.cards ?? [];
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const instagramGradientId = `${useId().replace(/:/g, "")}-instagram`;

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

  const audienceComposition = useMemo(() => {
    const aggregated = new Map<
      string,
      {
        key: string;
        network: string;
        label: string;
        value: number;
        profileCount: number;
        groupsCount?: number;
      }
    >();

    cards.forEach((card) => {
      if (typeof card.current_value !== "number" || Number.isNaN(card.current_value)) {
        return;
      }

      const network = normalizeNetwork(card.network) || "other";
      const meta = networkMeta(card.network);
      const existing = aggregated.get(network) ?? {
        key: network,
        network,
        label: meta.label,
        value: 0,
        profileCount: 0,
      };

      existing.value += card.current_value;
      existing.profileCount += 1;
      aggregated.set(network, existing);
    });

    if (
      typeof whatsappSummary?.unique_members_current === "number" &&
      !Number.isNaN(whatsappSummary.unique_members_current) &&
      whatsappSummary.unique_members_current > 0
    ) {
      aggregated.set("whatsapp", {
        key: "whatsapp",
        network: "whatsapp",
        label: "WhatsApp",
        value: whatsappSummary.unique_members_current,
        profileCount: 0,
        groupsCount: whatsappSummary.groups_count,
      });
    }

    const items = Array.from(aggregated.values()).sort((a, b) => b.value - a.value);
    const total = items.reduce((sum, item) => sum + item.value, 0);

    return {
      total,
      items: items.map((item) => {
        const meta = networkMeta(item.network);
        const percent = total > 0 ? (item.value / total) * 100 : 0;

        return {
          ...item,
          percent,
          icon: meta.icon,
          iconClass: meta.iconClass,
          softClass: meta.softClass,
          description:
            item.network === "whatsapp"
              ? `${item.groupsCount ?? 0} grupo${(item.groupsCount ?? 0) === 1 ? "" : "s"} · usuários únicos`
              : `${item.profileCount} perfil${item.profileCount === 1 ? "" : "s"} monitorado${item.profileCount === 1 ? "" : "s"}`,
          pieFill: getNetworkPieFill(item.network, instagramGradientId),
        };
      }),
    };
  }, [cards, instagramGradientId, whatsappSummary?.groups_count, whatsappSummary?.unique_members_current]);

  const totalAudience = audienceComposition.total;

  const trackedNetworks = useMemo(() => {
    return audienceComposition.items.map((item) => networkMeta(item.network));
  }, [audienceComposition.items]);

  const chartConfig = useMemo<ChartConfig>(() => {
    return cards.reduce<ChartConfig>((config, card) => {
      const meta = networkMeta(card.network);
      config[card.id] = {
        label: `${meta.label} · ${card.display_name || `@${card.handle}`}`,
        icon: meta.icon,
        color: meta.lineColor,
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

  const compositionChartConfig = useMemo<ChartConfig>(() => {
    return audienceComposition.items.reduce<ChartConfig>((config, item) => {
      config[item.key] = {
        label: item.label,
        icon: item.icon,
        color:
          item.network === "instagram"
            ? "#dd2a7b"
            : item.network === "facebook"
              ? "#2563eb"
              : item.network === "youtube"
                ? "#dc2626"
                : item.network === "whatsapp"
                  ? "#16a34a"
                  : "hsl(var(--primary))",
      };

      return config;
    }, {});
  }, [audienceComposition.items]);

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
                Painel social com audiência consolidada, evolução diária e leitura por rede monitorada.
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
            {trackedNetworks.map((network) => {
              const Icon = network.icon;

              return (
                <Badge key={network.label} variant="outline" className="gap-1.5">
                  <Icon className={cn("h-3.5 w-3.5", network.iconClass)} />
                  {network.label}
                </Badge>
              );
            })}
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
              title="Audiência total"
              value={formatNumber(totalAudience)}
              subtitle="Redes sociais + WhatsApp grupos por usuários únicos"
              icon={Share2}
              toneClass="text-sky-600"
            />
            <SummaryCard
              title="Perfis ativos"
              value={formatNumber(dashboard.summary.profiles_count)}
              subtitle="Perfis monitorados no módulo Social"
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
              toneClass="text-amber-600"
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
                      Evolução diária por rede e perfil no período selecionado.
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
                            formatter={(value, name) => {
                              const currentCard = cards.find((card) => card.id === String(name));
                              const meta = networkMeta(currentCard?.network);
                              const Icon = meta.icon;

                              return (
                                <div className="flex min-w-[220px] items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Icon className={cn("h-3.5 w-3.5", meta.iconClass)} />
                                      <span className="text-xs font-medium">{meta.label}</span>
                                    </div>
                                    <p className="truncate text-xs text-muted-foreground">
                                      {currentCard?.display_name || `@${currentCard?.handle}` || String(name)}
                                    </p>
                                  </div>
                                  <span className="font-mono font-medium">
                                    {formatNumber(Number(value))}
                                  </span>
                                </div>
                              );
                            }}
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

                <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5" />
                  <span>Custo do dia: {formatCurrency(dashboard.summary.cost_today_usd)}</span>
                </div>

                <div className="mt-4 rounded-[24px] border border-border/60 bg-background/70 p-4">
                  <div className="flex flex-col gap-2 border-b border-border/50 pb-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-sm font-semibold">Distribuição atual da audiência</p>
                      <p className="text-xs text-muted-foreground">
                        Percentual e total por rede monitorada, somando o WhatsApp grupos por usuários únicos.
                      </p>
                    </div>
                    <Badge variant="outline">Base atual: {formatNumber(totalAudience)}</Badge>
                  </div>

                  {audienceComposition.items.length === 0 ? (
                    <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                      Sem dados consolidados para compor a distribuição.
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)]">
                      <div className="flex flex-col items-center">
                        <ChartContainer config={compositionChartConfig} className="mx-auto h-[320px] w-full max-w-[380px]">
                          <PieChart>
                            <defs>
                              <linearGradient id={instagramGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#f58529" />
                                <stop offset="22%" stopColor="#feda77" />
                                <stop offset="52%" stopColor="#dd2a7b" />
                                <stop offset="78%" stopColor="#8134af" />
                                <stop offset="100%" stopColor="#515bd4" />
                              </linearGradient>
                            </defs>
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  hideLabel
                                  formatter={(_, __, item) => {
                                    const entry = audienceComposition.items.find(
                                      (source) => source.key === String(item?.payload?.key ?? "")
                                    );

                                    if (!entry) {
                                      return null;
                                    }

                                    const Icon = entry.icon;

                                    return (
                                      <div className="flex min-w-[220px] items-center justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <Icon className={cn("h-3.5 w-3.5", entry.iconClass)} />
                                            <span className="text-xs font-medium">{entry.label}</span>
                                          </div>
                                          <p className="truncate text-xs text-muted-foreground">{entry.description}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-mono font-medium">{formatNumber(entry.value)}</p>
                                          <p className="text-[11px] text-muted-foreground">
                                            {entry.percent.toFixed(1)}%
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  }}
                                />
                              }
                            />
                            <Pie
                              data={audienceComposition.items}
                              dataKey="value"
                              nameKey="label"
                              outerRadius={118}
                              paddingAngle={2}
                              strokeWidth={2}
                              animationDuration={1100}
                              animationBegin={120}
                              onMouseLeave={() => setActiveCompositionKey(null)}
                            >
                              {audienceComposition.items.map((item) => (
                                <Cell
                                  key={item.key}
                                  fill={item.pieFill}
                                  stroke={item.key === activeCompositionKey ? "hsl(var(--foreground))" : "hsl(var(--background))"}
                                  strokeWidth={item.key === activeCompositionKey ? 4 : 2}
                                  fillOpacity={activeCompositionKey && item.key !== activeCompositionKey ? 0.58 : 1}
                                  onMouseEnter={() => setActiveCompositionKey(item.key)}
                                />
                              ))}
                            </Pie>
                          </PieChart>
                        </ChartContainer>
                        <div className="mt-2 flex flex-col items-center text-center">
                          <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Total</span>
                          <span className="text-3xl font-bold tracking-tight">{formatNumber(totalAudience)}</span>
                          <span className="text-sm text-muted-foreground">Audiência monitorada</span>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {audienceComposition.items.map((item, index) => {
                          const Icon = item.icon;
                          const firstProfile = cards.find(
                            (card) => normalizeNetwork(card.network) === item.network
                          );
                          const isActive = item.key === activeCompositionKey;

                          return (
                            <motion.button
                              key={item.key}
                              type="button"
                              whileHover={{ y: -2 }}
                              transition={{ duration: 0.18 }}
                              onMouseEnter={() => setActiveCompositionKey(item.key)}
                              onMouseLeave={() => setActiveCompositionKey(null)}
                              onClick={() => {
                                if (firstProfile) {
                                  setSelectedProfileId(firstProfile.id);
                                }
                              }}
                              className={cn(
                                "rounded-2xl border p-4 text-left transition-colors",
                                isActive
                                  ? "border-primary/40 bg-primary/5"
                                  : "border-border/60 bg-muted/20 hover:bg-muted/35"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span
                                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-sm"
                                    style={getNetworkSwatchStyle(item.network)}
                                  >
                                    <Icon className="h-5 w-5" />
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold">{item.label}</p>
                                    <p className="text-xs text-muted-foreground">{item.description}</p>
                                  </div>
                                </div>
                                <Badge variant="outline">#{index + 1}</Badge>
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                                    Total
                                  </p>
                                  <p className="mt-1 text-xl font-bold">{formatNumber(item.value)}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                                    Participação
                                  </p>
                                  <p className="mt-1 text-xl font-bold">{item.percent.toFixed(1)}%</p>
                                </div>
                              </div>

                              <div className="mt-4">
                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={getNetworkSwatchStyle(item.network)}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.percent}%` }}
                                    transition={{ duration: 0.55, delay: 0.05 }}
                                  />
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
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
                            <SocialAvatar card={card} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Icon className={cn("h-3.5 w-3.5 shrink-0", meta.iconClass)} />
                                    <p className="truncate text-sm font-semibold">{card.display_name}</p>
                                  </div>
                                  <p className="truncate text-xs text-muted-foreground">{profileSubheadline(card)}</p>
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
                              <div className="mt-3 space-y-1.5">
                                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                                  <span>Participação no total</span>
                                  <span>
                                    {totalAudience > 0 && typeof card.current_value === "number"
                                      ? `${((card.current_value / totalAudience) * 100).toFixed(1)}%`
                                      : "--"}
                                  </span>
                                </div>
                                <Progress
                                  value={
                                    totalAudience > 0 && typeof card.current_value === "number"
                                      ? Number(((card.current_value / totalAudience) * 100).toFixed(2))
                                      : 0
                                  }
                                  className="h-2"
                                />
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
                        <SocialAvatar card={selectedCard} size="lg" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {(() => {
                              const Icon = networkMeta(selectedCard.network).icon;
                              return <Icon className={cn("h-4 w-4", networkMeta(selectedCard.network).iconClass)} />;
                            })()}
                            <h4 className="text-lg font-bold tracking-tight">{profileHeadline(selectedCard)}</h4>
                            <Badge variant="outline">{networkMeta(selectedCard.network).label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{profileSubheadline(selectedCard)}</p>
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

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                            Atual
                          </p>
                          <p className="mt-2 text-2xl font-bold">{formatNumber(selectedCard.current_value)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{selectedCard.primary_metric_label}</p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                            Participação
                          </p>
                          <p className="mt-2 text-2xl font-bold">
                            {totalAudience > 0 && typeof selectedCard.current_value === "number"
                              ? `${((selectedCard.current_value / totalAudience) * 100).toFixed(1)}%`
                              : "--"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">Da audiência total monitorada</p>
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
                            className="overflow-hidden rounded-2xl border border-border/60 bg-muted/20 p-3"
                          >
                            <div className="flex min-w-0 flex-col gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {translateMetricLabel(metric.code, metric.label)}
                                </p>
                                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                                  {translateMetricGroup(metric.group)}
                                </p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-lg font-bold">
                                  {metric.value_number !== null
                                    ? formatNumber(metric.value_number)
                                    : metric.value_text || "--"}
                                </p>
                                {metric.unit && (
                                  <p className="truncate text-[11px] text-muted-foreground">
                                    {translateMetricUnit(metric.unit)}
                                  </p>
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










