import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  MessageCircle,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { useWhatsAppGroupsDashboard } from "@/hooks/useWhatsApp";
import type {
  WhatsAppGroupsDashboardGroup,
  WhatsAppMetricsWindow,
} from "@/services/whatsapp.service";

const compactFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("pt-BR");

const formatCompactNumber = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return compactFormatter.format(value);
};

const formatNumber = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return numberFormatter.format(value);
};

const formatPercent = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return `${value.toFixed(1)}%`;
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

const windowOptions: Array<{ value: WhatsAppMetricsWindow; label: string }> = [
  { value: "7d", label: "7 dias" },
  { value: "15d", label: "15 dias" },
  { value: "30d", label: "30 dias" },
];

const whatsappChartConfig = {
  unique_members_current: {
    label: "Usuários únicos",
    color: "#0f766e",
  },
  total_memberships_current: {
    label: "Participações ativas",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const resolveGrowthTone = (delta: number) => {
  if (delta > 0) return "text-emerald-600";
  if (delta < 0) return "text-rose-600";
  return "text-muted-foreground";
};

const resolveGrowthIcon = (delta: number) => {
  if (delta < 0) return ArrowDownRight;
  return ArrowUpRight;
};

const KpiCard = ({
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

export function WhatsAppGroupsWidget() {
  const navigate = useNavigate();
  const [window, setWindow] = useState<WhatsAppMetricsWindow>("30d");
  const { data, isLoading, isFetching, isError, refetch } = useWhatsAppGroupsDashboard(
    { window },
    true,
    { staleTime: 120000 }
  );

  const dashboard = data?.data;
  const summary = dashboard?.summary;
  const groups = dashboard?.groups ?? [];
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!groups.length) {
      setSelectedGroupId(null);
      return;
    }

    if (!selectedGroupId || !groups.some((group) => group.group_id === selectedGroupId)) {
      setSelectedGroupId(groups[0].group_id);
    }
  }, [groups, selectedGroupId]);

  const selectedGroup = useMemo<WhatsAppGroupsDashboardGroup | null>(() => {
    if (!selectedGroupId) return groups[0] ?? null;
    return groups.find((group) => group.group_id === selectedGroupId) ?? groups[0] ?? null;
  }, [groups, selectedGroupId]);

  const chartData = useMemo(() => {
    return (dashboard?.series ?? []).map((point) => ({
      date: point.date,
      label: point.label,
      source: point.source,
      unique_members_current: point.unique_members_current,
      total_memberships_current: point.total_memberships_current,
    }));
  }, [dashboard?.series]);

  const growthIcon = resolveGrowthIcon(summary?.unique_growth.delta ?? 0);
  const GrowthIcon = growthIcon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="overflow-hidden rounded-[28px] border border-border/60 bg-card p-4 shadow-lg md:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-border/50 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/12">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Grupos WhatsApp</h3>
              <p className="text-sm text-muted-foreground">
                Panorama dos grupos monitorados, participação ativa e evolução diária de usuários únicos.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              Fonte: banco consolidado
            </Badge>
            {data?.meta?.generated_at && (
              <Badge variant="outline">
                Atualizado às {formatHourMinute(data.meta.generated_at)}
              </Badge>
            )}
            {summary && !summary.unique_growth.has_history && (
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700">
                Histórico diário em formação
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
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl"
            onClick={() => navigate("/automacao/grupos")}
          >
            Abrir automação
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4 py-8 lg:grid-cols-2">
          <div className="min-w-0 space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-2xl bg-muted/40" />
              ))}
            </div>
            <div className="h-[320px] animate-pulse rounded-3xl bg-muted/40" />
          </div>
          <div className="h-[420px] animate-pulse rounded-3xl bg-muted/40" />
        </div>
      )}

      {!isLoading && isError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Não foi possível carregar as métricas dos grupos do WhatsApp agora.
        </div>
      )}

      {!isLoading && !isError && summary && (
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
          <div className="min-w-0 space-y-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              <KpiCard
                title="Usuários únicos"
                value={formatNumber(summary.unique_members_current)}
                subtitle="Deduplicado entre todos os grupos"
                icon={Users}
              />
              <KpiCard
                title="Participações"
                value={formatNumber(summary.total_memberships_current)}
                subtitle="Soma sem dedupe dos membros ativos"
                icon={MessageCircle}
              />
              <KpiCard
                title="Grupos ativos"
                value={formatNumber(summary.groups_count)}
                subtitle="Grupos monitorados com sync"
                icon={BarChart3}
              />
              <KpiCard
                title="Em vários grupos"
                value={formatNumber(summary.multi_group_members_current)}
                subtitle={`${formatPercent(summary.multi_group_ratio * 100)} do universo único`}
                icon={Activity}
              />
            </div>

            <div className="rounded-[24px] border border-border/60 bg-gradient-to-br from-background to-muted/20 p-4 md:p-5">
              <div className="flex flex-col gap-3 border-b border-border/50 pb-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold">Evolução diária de base</p>
                  <p className="text-xs text-muted-foreground">
                    Snapshot diário de usuários únicos e participações ativas no período selecionado.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={resolveGrowthTone(summary.unique_growth.delta)}>
                    <GrowthIcon className="mr-1 h-3.5 w-3.5" />
                    {summary.unique_growth.delta >= 0 ? "+" : ""}
                    {formatNumber(summary.unique_growth.delta)} usuários no período
                  </Badge>
                  {summary.unique_growth.delta_pct !== null && (
                    <Badge variant="outline">
                      {summary.unique_growth.delta_pct >= 0 ? "+" : ""}
                      {summary.unique_growth.delta_pct.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>

              {chartData.length === 0 ? (
                <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground sm:h-[300px]">
                  Sem snapshots disponíveis para o período.
                </div>
              ) : (
                <ChartContainer config={whatsappChartConfig} className="mt-4 h-[260px] w-full sm:h-[300px]">
                  <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fill-unique-members" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-unique_members_current)" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="var(--color-unique_members_current)" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="fill-total-memberships" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-total_memberships_current)" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="var(--color-total_memberships_current)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
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
                          formatter={(value, name, item) => (
                            <div className="flex min-w-[180px] items-center justify-between gap-3">
                              <span>{name === "unique_members_current" ? "Usuários únicos" : "Participações"}</span>
                              <span className="font-mono font-medium">
                                {formatNumber(Number(value))}
                                {item?.payload?.source === "live" ? " (ao vivo)" : ""}
                              </span>
                            </div>
                          )}
                        />
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey="total_memberships_current"
                      stroke="var(--color-total_memberships_current)"
                      fill="url(#fill-total-memberships)"
                      strokeWidth={2.25}
                      activeDot={{ r: 4 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="unique_members_current"
                      stroke="var(--color-unique_members_current)"
                      fill="url(#fill-unique-members)"
                      strokeWidth={2.5}
                      activeDot={{ r: 4 }}
                    />
                  </AreaChart>
                </ChartContainer>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl bg-background/80 p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Base inicial</p>
                  <p className="mt-2 text-lg font-semibold">{formatNumber(summary.unique_growth.baseline)}</p>
                  <p className="text-xs text-muted-foreground">
                    {summary.unique_growth.first_snapshot_date
                      ? `Primeiro snapshot em ${summary.unique_growth.first_snapshot_date.split("-").reverse().join("/")}`
                      : "Ainda sem snapshot histórico"}
                  </p>
                </div>
                <div className="rounded-2xl bg-background/80 p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Movimento</p>
                  <p className="mt-2 text-lg font-semibold">
                    +{formatNumber(summary.movement.joins)} / -{formatNumber(summary.movement.leaves)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Entradas e saídas no intervalo selecionado
                  </p>
                </div>
                <div className="rounded-2xl bg-background/80 p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Último snapshot</p>
                  <p className="mt-2 text-lg font-semibold">
                    {summary.unique_growth.last_snapshot_date
                      ? summary.unique_growth.last_snapshot_date.split("-").reverse().join("/")
                      : "Hoje"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {summary.unique_growth.captured_points} ponto(s) diário(s) disponível(is)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <div className="rounded-[24px] border border-border/60 bg-muted/15 p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Grupo em destaque</p>
                  <p className="text-xs text-muted-foreground">
                    Clique na lista para detalhar participação, share e movimento.
                  </p>
                </div>
                <Badge variant="outline">
                  {groups.length} grupo(s)
                </Badge>
              </div>

              {selectedGroup ? (
                <motion.div
                  key={selectedGroup.group_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-[22px] border border-border/60 bg-background/85 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{selectedGroup.name || selectedGroup.subject || "Grupo sem nome"}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{selectedGroup.group_id}</p>
                    </div>
                    <Badge variant="outline">#{selectedGroup.rank}</Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-muted/30 p-3">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Membros</p>
                      <p className="mt-2 text-lg font-semibold">{formatNumber(selectedGroup.members_current)}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/30 p-3">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Share</p>
                      <p className="mt-2 text-lg font-semibold">{formatPercent(selectedGroup.share_of_total_memberships_pct)}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/30 p-3">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Crescimento</p>
                      <p className={cn("mt-2 text-lg font-semibold", resolveGrowthTone(selectedGroup.movement.net_growth))}>
                        {selectedGroup.movement.net_growth >= 0 ? "+" : ""}
                        {formatNumber(selectedGroup.movement.net_growth)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Participação no total monitorado</span>
                      <span>{formatPercent(selectedGroup.share_of_total_memberships_pct)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-primary to-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(selectedGroup.share_of_total_memberships_pct, 100)}%` }}
                        transition={{ duration: 0.45 }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-1">
                      +{formatNumber(selectedGroup.movement.joins)} entradas
                    </span>
                    <span className="rounded-full bg-muted px-2 py-1">
                      -{formatNumber(selectedGroup.movement.leaves)} saídas
                    </span>
                    <span className="rounded-full bg-muted px-2 py-1">
                      Sync às {formatHourMinute(selectedGroup.last_synced_at)}
                    </span>
                  </div>
                </motion.div>
              ) : (
                <div className="mt-4 rounded-2xl bg-background/70 p-4 text-sm text-muted-foreground">
                  Nenhum grupo monitorado encontrado.
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-border/60 bg-muted/15 p-4 md:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Distribuição por grupo</p>
                  <p className="text-xs text-muted-foreground">
                    Cada linha representa a participação do grupo no total de membros ativos.
                  </p>
                </div>
                <Badge variant="outline">
                  Total monitorado: {formatNumber(summary.total_memberships_current)}
                </Badge>
              </div>

              <div className="space-y-3">
                {groups.map((group) => {
                  const isSelected = group.group_id === selectedGroup?.group_id;
                  const share = Math.min(group.share_of_total_memberships_pct, 100);

                  return (
                    <motion.button
                      key={group.group_id}
                      type="button"
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.995 }}
                      onClick={() => setSelectedGroupId(group.group_id)}
                      className={cn(
                        "w-full rounded-[20px] border p-3 text-left transition-all",
                        isSelected
                          ? "border-primary/40 bg-primary/6 shadow-sm"
                          : "border-border/60 bg-background/70 hover:bg-background"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground">#{group.rank}</span>
                            <p className="truncate text-sm font-semibold">
                              {group.name || group.subject || "Grupo sem nome"}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatNumber(group.members_current)} membros ativos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatPercent(group.share_of_total_memberships_pct)}</p>
                          <p className={cn("text-xs", resolveGrowthTone(group.movement.net_growth))}>
                            {group.movement.net_growth >= 0 ? "+" : ""}
                            {formatNumber(group.movement.net_growth)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className={cn(
                            "h-full rounded-full",
                            isSelected
                              ? "bg-gradient-to-r from-primary to-emerald-500"
                              : "bg-primary/70"
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${share}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                    </motion.button>
                  );
                })}

                {groups.length === 0 && (
                  <div className="rounded-2xl bg-background/70 p-4 text-sm text-muted-foreground">
                    Nenhum grupo disponível para exibir.
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1">
                  <Users className="h-3.5 w-3.5" />
                  Únicos: {formatNumber(summary.unique_members_current)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Participações: {formatNumber(summary.total_memberships_current)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Net growth: {summary.movement.net_growth >= 0 ? "+" : ""}
                  {formatNumber(summary.movement.net_growth)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
}

export default WhatsAppGroupsWidget;


