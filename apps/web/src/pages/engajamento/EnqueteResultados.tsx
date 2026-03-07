import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Copy,
  Download,
  Globe,
  Link2,
  MapPin,
  MonitorSmartphone,
  RefreshCw,
  ShieldAlert,
  Users,
  Vote,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import {
  useInvalidatePollVote,
  usePollBrowsersMetrics,
  usePollDashboard,
  usePollDevicesMetrics,
  usePollLocationsMetrics,
  usePollPlacements,
  usePollPlacementsMetrics,
  usePollProvidersMetrics,
  usePollTimeSeries,
  usePollVoteAttempts,
  usePollVotes,
} from "@/hooks/useEnquetes";
import enqueteService, { type PollStatus, type PollVoteLog } from "@/services/enquete.service";
import showToast from "@/lib/toast";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["#FF8000", "#22C55E", "#3B82F6", "#EAB308", "#EF4444", "#8B5CF6"];

const statusConfig: Record<
  PollStatus,
  {
    label: string;
    indicator: "online" | "offline" | "loading" | "warning";
    badgeClass: string;
  }
> = {
  draft: {
    label: "Rascunho",
    indicator: "warning",
    badgeClass: "bg-warning/15 text-warning border-warning/30",
  },
  scheduled: {
    label: "Agendada",
    indicator: "loading",
    badgeClass: "bg-info/15 text-info border-info/30",
  },
  live: {
    label: "Ao vivo",
    indicator: "online",
    badgeClass: "bg-success/15 text-success border-success/30",
  },
  paused: {
    label: "Pausada",
    indicator: "warning",
    badgeClass: "bg-warning/15 text-warning border-warning/30",
  },
  closed: {
    label: "Encerrada",
    indicator: "offline",
    badgeClass: "bg-muted text-muted-foreground border-muted",
  },
  archived: {
    label: "Arquivada",
    indicator: "offline",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

type BreakdownRow = {
  label: string;
  helper?: string | null;
  attempts: number;
  accepted: number;
  blocked: number;
};

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("pt-BR");
}

function formatPercent(value: number | null | undefined, isRatio = false) {
  const numeric = value ?? 0;
  const resolved = isRatio ? numeric * 100 : numeric;
  return `${resolved.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
}

function formatBucketLabel(value: string, bucketType: "hour" | "day") {
  const date = new Date(value);

  return date.toLocaleString(
    "pt-BR",
    bucketType === "hour"
      ? { hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "2-digit" }
  );
}

function formatWindow(poll: { starts_at: string | null; ends_at: string | null }) {
  if (poll.starts_at && poll.ends_at) {
    return `${formatDateTime(poll.starts_at)} - ${formatDateTime(poll.ends_at)}`;
  }

  if (poll.starts_at) {
    return `Inicia em ${formatDateTime(poll.starts_at)}`;
  }

  if (poll.ends_at) {
    return `Encerra em ${formatDateTime(poll.ends_at)}`;
  }

  return "Sem janela agendada";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function buildLocationLabel(country: string, region: string, city: string) {
  if (city && city !== "Desconhecido") return city;
  if (region && region !== "Desconhecido") return region;
  return country || "Desconhecido";
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function BreakdownCard({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
        <Badge variant="outline" className="rounded-full text-[10px]">
          {formatNumber(rows.length)} itens
        </Badge>
      </div>

      {rows.length === 0 ? (
        <EmptyState message="Sem dados suficientes para este recorte." />
      ) : (
        <div className="space-y-3">
          {rows.slice(0, 8).map((row) => (
            <div key={`${title}-${row.label}`} className="rounded-xl border border-border/40 bg-secondary/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.label}</p>
                  {row.helper ? <p className="truncate text-xs text-muted-foreground">{row.helper}</p> : null}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>{formatNumber(row.attempts)} tentativas</div>
                  <div className="text-success">{formatNumber(row.accepted)} aceitos</div>
                  <div className="text-warning">{formatNumber(row.blocked)} bloqueados</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const EnqueteResultados = () => {
  const { id } = useParams<{ id: string }>();
  const pollId = Number(id);
  const isValidPollId = Number.isInteger(pollId) && pollId > 0;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [votePendingInvalidation, setVotePendingInvalidation] = useState<PollVoteLog | null>(null);
  const dashboardQuery = usePollDashboard(isValidPollId ? pollId : undefined);
  const placementsQuery = usePollPlacements(isValidPollId ? pollId : undefined);
  const placementsMetricsQuery = usePollPlacementsMetrics(isValidPollId ? pollId : undefined);
  const locationsQuery = usePollLocationsMetrics(isValidPollId ? pollId : undefined);
  const providersQuery = usePollProvidersMetrics(isValidPollId ? pollId : undefined);
  const devicesQuery = usePollDevicesMetrics(isValidPollId ? pollId : undefined);
  const browsersQuery = usePollBrowsersMetrics(isValidPollId ? pollId : undefined);
  const votesQuery = usePollVotes(isValidPollId ? pollId : undefined, { per_page: 8 });
  const attemptsQuery = usePollVoteAttempts(isValidPollId ? pollId : undefined, { per_page: 8 });
  const timelineQuery = usePollTimeSeries(isValidPollId ? pollId : undefined, {
    window: "30d",
    bucket_type: "day",
  });
  const hourlyQuery = usePollTimeSeries(isValidPollId ? pollId : undefined, {
    window: "24h",
    bucket_type: "hour",
  });
  const invalidateVoteMutation = useInvalidatePollVote();

  const dashboard = dashboardQuery.data?.data;
  const poll = dashboard?.poll;
  const overview = dashboard?.overview;
  const options = dashboard?.options ?? [];
  const placements = placementsQuery.data?.data ?? [];
  const placementMetrics = placementsMetricsQuery.data?.data ?? [];
  const recentVotes = votesQuery.data?.data ?? [];
  const recentAttempts = attemptsQuery.data?.data ?? [];

  const activePlacement = useMemo(
    () => placements.find((placement) => placement.is_active) ?? placements[0] ?? null,
    [placements]
  );

  const optionsChartData = useMemo(
    () => options.map((option, index) => ({ ...option, fill: CHART_COLORS[index % CHART_COLORS.length] })),
    [options]
  );

  const topOption = useMemo(
    () => [...optionsChartData].sort((left, right) => (right.votes ?? 0) - (left.votes ?? 0))[0] ?? null,
    [optionsChartData]
  );

  const timelineData = useMemo(
    () =>
      (timelineQuery.data?.data.series ?? dashboard?.timeseries ?? []).map((point) => ({
        label: formatBucketLabel(point.bucket_at, point.bucket_type),
        votes_accepted: point.votes_accepted,
        votes_blocked: point.votes_blocked,
        impressions: point.impressions,
        unique_sessions: point.unique_sessions,
      })),
    [dashboard?.timeseries, timelineQuery.data?.data.series]
  );

  const hourlyData = useMemo(
    () =>
      (hourlyQuery.data?.data.series ?? []).map((point) => ({
        label: formatBucketLabel(point.bucket_at, point.bucket_type),
        votes_accepted: point.votes_accepted,
        votes_blocked: point.votes_blocked,
        impressions: point.impressions,
      })),
    [hourlyQuery.data?.data.series]
  );

  const locationRows = useMemo<BreakdownRow[]>(
    () =>
      (locationsQuery.data?.data ?? []).map((row) => ({
        label: buildLocationLabel(row.country, row.region, row.city),
        helper: [row.region, row.country].filter(Boolean).join(" / "),
        attempts: row.attempts,
        accepted: row.accepted,
        blocked: row.blocked,
      })),
    [locationsQuery.data?.data]
  );

  const providerRows = useMemo<BreakdownRow[]>(
    () =>
      (providersQuery.data?.data ?? []).map((row) => ({
        label: row.provider || "Desconhecido",
        attempts: row.attempts,
        accepted: row.accepted,
        blocked: row.blocked,
      })),
    [providersQuery.data?.data]
  );

  const deviceRows = useMemo<BreakdownRow[]>(
    () =>
      (devicesQuery.data?.data ?? []).map((row) => ({
        label: row.device_type || "Desconhecido",
        attempts: row.attempts,
        accepted: row.accepted,
        blocked: row.blocked,
      })),
    [devicesQuery.data?.data]
  );

  const browserRows = useMemo<BreakdownRow[]>(
    () =>
      (browsersQuery.data?.data ?? []).map((row) => ({
        label: row.browser_family || "Desconhecido",
        attempts: row.attempts,
        accepted: row.accepted,
        blocked: row.blocked,
      })),
    [browsersQuery.data?.data]
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await Promise.all([
        dashboardQuery.refetch(),
        placementsQuery.refetch(),
        placementsMetricsQuery.refetch(),
        locationsQuery.refetch(),
        providersQuery.refetch(),
        devicesQuery.refetch(),
        browsersQuery.refetch(),
        votesQuery.refetch(),
        attemptsQuery.refetch(),
        timelineQuery.refetch(),
        hourlyQuery.refetch(),
      ]);
      showToast.success("Resultados atualizados");
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Falha ao atualizar a tela");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyEmbed = async (embedUrl?: string | null) => {
    if (!embedUrl) {
      showToast.warning("Nenhum placement ativo com embed disponivel");
      return;
    }

    try {
      await navigator.clipboard.writeText(embedUrl);
      showToast.success("URL de embed copiada");
    } catch {
      showToast.error("Nao foi possivel copiar a URL de embed");
    }
  };

  const handleExport = async (fileName: string, loader: () => Promise<Blob>) => {
    try {
      const blob = await loader();
      downloadBlob(blob, fileName);
      showToast.success("Export concluido");
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Falha ao exportar CSV");
    }
  };

  const handleInvalidateVote = async () => {
    if (!votePendingInvalidation) return;

    await invalidateVoteMutation.mutateAsync({
      voteId: votePendingInvalidation.id,
      reason: "Invalidado manualmente pelo administrador",
    });

    setVotePendingInvalidation(null);
  };

  if (!isValidPollId) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
          Identificador de enquete invalido.
        </div>
      </AppShell>
    );
  }

  if (dashboardQuery.isLoading && !dashboard) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
          Carregando resultados da enquete...
        </div>
      </AppShell>
    );
  }

  if (dashboardQuery.isError || !poll || !overview) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
          Nao foi possivel carregar os resultados desta enquete.
        </div>
      </AppShell>
    );
  }

  const status = statusConfig[poll.status];

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Link
          to="/engajamento/enquetes"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Enquetes
        </Link>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusIndicator status={status.indicator} size="md" />
              <Badge className={cn("rounded-full text-[10px]", status.badgeClass)}>{status.label}</Badge>
              <Badge variant="outline" className="rounded-full text-[10px]">
                {poll.selection_type === "multiple" ? "Multipla" : "Unica"}
              </Badge>
              <Badge variant="outline" className="rounded-full text-[10px]">
                {poll.results_visibility}
              </Badge>
            </div>

            <h1 className="text-xl font-bold md:text-2xl">{poll.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{poll.question}</p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                {poll.placements_count} placements
              </span>
              <span className="flex items-center gap-1">
                <Vote className="h-3 w-3" />
                {poll.options_count} opcoes
              </span>
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {formatWindow(poll)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => handleExport(`enquete-${poll.id}-opcoes.csv`, () => enqueteService.exportOptionsSummaryCsv(poll.id))}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar opcoes
            </Button>
            <Button
              size="sm"
              className="rounded-xl"
              onClick={() => handleCopyEmbed(activePlacement?.embed_url)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar embed
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-primary/30 bg-primary/10 p-4">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Vote className="h-4 w-4" />
            Votos validos
          </div>
          <p className="mt-1 text-2xl font-bold text-primary">{formatNumber(overview.votes_accepted)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            Lider
          </div>
          <p className="mt-1 truncate text-base font-semibold">{topOption?.label ?? "Sem votos"}</p>
          <p className="text-sm text-primary">{formatPercent(topOption?.percentage)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-success/30 bg-success/10 p-4">
          <div className="flex items-center gap-2 text-sm text-success">
            <Users className="h-4 w-4" />
            Sessoes unicas
          </div>
          <p className="mt-1 text-2xl font-bold text-success">{formatNumber(overview.unique_sessions)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-warning/30 bg-warning/10 p-4">
          <div className="flex items-center gap-2 text-sm text-warning">
            <ShieldAlert className="h-4 w-4" />
            Bloqueios
          </div>
          <p className="mt-1 text-2xl font-bold text-warning">{formatNumber(overview.votes_blocked)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-info/30 bg-info/10 p-4">
          <div className="flex items-center gap-2 text-sm text-info">
            <Activity className="h-4 w-4" />
            Conversao
          </div>
          <p className="mt-1 text-2xl font-bold text-info">{formatPercent(overview.conversion_rate, true)}</p>
          <p className="text-xs text-muted-foreground">{formatNumber(overview.impressions)} impressoes</p>
        </motion.div>
      </div>

      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 gap-1 md:grid-cols-5">
          <TabsTrigger value="distribution">Distribuicao</TabsTrigger>
          <TabsTrigger value="timeline">Evolucao</TabsTrigger>
          <TabsTrigger value="hourly">Por horario</TabsTrigger>
          <TabsTrigger value="audience">Audiencia</TabsTrigger>
          <TabsTrigger value="operations">Operacao</TabsTrigger>
        </TabsList>
        <TabsContent value="distribution" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Distribuicao por opcao</h3>
              {optionsChartData.length === 0 ? (
                <EmptyState message="Ainda nao existem votos validos para distribuir." />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={optionsChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={104}
                      dataKey="votes"
                      nameKey="label"
                      label={({ percentage }) => formatPercent(percentage)}
                    >
                      {optionsChartData.map((entry) => (
                        <Cell key={entry.public_id} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Ranking de votos</h3>
              {optionsChartData.length === 0 ? (
                <EmptyState message="Sem votos validos para montar o ranking." />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={optionsChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" />
                    <YAxis dataKey="label" type="category" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                    <Bar dataKey="votes" radius={[0, 6, 6, 0]}>
                      {optionsChartData.map((entry) => (
                        <Cell key={entry.public_id} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Detalhes por opcao</h3>
            {optionsChartData.length === 0 ? (
              <EmptyState message="Sem opcoes com resultado para exibir." />
            ) : (
              <div className="space-y-3">
                {optionsChartData.map((option, index) => (
                  <div key={option.public_id} className="rounded-xl border border-border/40 bg-secondary/20 p-4">
                    <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: option.fill }} />
                          <p className="truncate font-medium">{option.label}</p>
                          {index === 0 ? <Badge className="rounded-full bg-primary/15 text-primary">Lider</Badge> : null}
                        </div>
                        {option.description ? (
                          <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                        ) : null}
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-semibold">{formatNumber(option.votes)} votos</div>
                        <div className="text-primary">{formatPercent(option.percentage)}</div>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${option.percentage ?? 0}%`,
                          backgroundColor: option.fill,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Serie diaria</h3>
            {timelineData.length === 0 ? (
              <EmptyState message="Ainda nao existem snapshots diarios para esta enquete." />
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="votes_accepted" name="Votos validos" stroke="#FF8000" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="impressions" name="Impressoes" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>

        <TabsContent value="hourly">
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Ultimas 24 horas</h3>
            {hourlyData.length === 0 ? (
              <EmptyState message="Ainda nao existem snapshots horarios para esta enquete." />
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="votes_accepted" name="Votos validos" fill="#FF8000" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="votes_blocked" name="Bloqueados" fill="#EAB308" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>
        <TabsContent value="audience" className="space-y-6">
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Placements</h3>
                <p className="text-sm text-muted-foreground">Desempenho por pagina, artigo e embed.</p>
              </div>
              <Badge variant="outline" className="rounded-full text-[10px]">
                {formatNumber(placementMetrics.length)} placements
              </Badge>
            </div>

            {placementMetrics.length === 0 ? (
              <EmptyState message="Nenhum placement cadastrado para esta enquete." />
            ) : (
              <div className="grid gap-3 xl:grid-cols-2">
                {placementMetrics.map((placement) => {
                  const fullPlacement = placements.find((item) => item.id === placement.id);

                  return (
                    <div key={placement.public_id} className="rounded-xl border border-border/40 bg-secondary/20 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <Badge
                              className={cn(
                                "rounded-full text-[10px]",
                                placement.is_active
                                  ? "bg-success/15 text-success border-success/30"
                                  : "bg-muted text-muted-foreground border-muted"
                              )}
                            >
                              {placement.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                            {placement.site_name ? (
                              <Badge variant="outline" className="rounded-full text-[10px]">
                                {placement.site_name}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="font-medium">{placement.placement_name}</p>
                          <p className="mt-1 break-all text-xs text-muted-foreground">
                            {placement.canonical_url || "Sem URL canonica"}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {fullPlacement?.embed_url ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg text-xs"
                              onClick={() => handleCopyEmbed(fullPlacement.embed_url)}
                            >
                              <Copy className="mr-1 h-3 w-3" />
                              Copiar embed
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div className="rounded-lg border border-border/40 bg-background/60 p-3">
                          <p className="text-xs text-muted-foreground">Aceitos</p>
                          <p className="mt-1 font-semibold text-success">{formatNumber(placement.votes_accepted)}</p>
                        </div>
                        <div className="rounded-lg border border-border/40 bg-background/60 p-3">
                          <p className="text-xs text-muted-foreground">Bloqueados</p>
                          <p className="mt-1 font-semibold text-warning">{formatNumber(placement.votes_blocked)}</p>
                        </div>
                        <div className="rounded-lg border border-border/40 bg-background/60 p-3">
                          <p className="text-xs text-muted-foreground">Sessoes</p>
                          <p className="mt-1 font-semibold">{formatNumber(placement.unique_sessions)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-semibold">Localizacao</h3>
              </div>
              <BreakdownCard title="Top cidades" rows={locationRows} />
            </div>

            <div className="grid gap-6">
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <h3 className="text-lg font-semibold">Providers</h3>
                  </div>
                  <BreakdownCard title="Origem de rede" rows={providerRows} />
                </div>

                <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <MonitorSmartphone className="h-4 w-4 text-primary" />
                    <h3 className="text-lg font-semibold">Dispositivos</h3>
                  </div>
                  <BreakdownCard title="Tipos de device" rows={deviceRows} />
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-semibold">Browsers</h3>
                </div>
                <BreakdownCard title="Familias de navegador" rows={browserRows} />
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="operations" className="space-y-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Button
              variant="outline"
              className="justify-start rounded-xl"
              onClick={() => handleExport(`enquete-${poll.id}-votes.csv`, () => enqueteService.exportVotesCsv(poll.id))}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar votos
            </Button>
            <Button
              variant="outline"
              className="justify-start rounded-xl"
              onClick={() => handleExport(`enquete-${poll.id}-attempts.csv`, () => enqueteService.exportVoteAttemptsCsv(poll.id))}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar tentativas
            </Button>
            <Button
              variant="outline"
              className="justify-start rounded-xl"
              onClick={() => handleExport(`enquete-${poll.id}-options.csv`, () => enqueteService.exportOptionsSummaryCsv(poll.id))}
            >
              <Download className="mr-2 h-4 w-4" />
              Resumo por opcao
            </Button>
            <Button
              variant="outline"
              className="justify-start rounded-xl"
              onClick={() => handleExport(`enquete-${poll.id}-placements.csv`, () => enqueteService.exportPlacementsSummaryCsv(poll.id))}
            >
              <Download className="mr-2 h-4 w-4" />
              Resumo por placement
            </Button>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Ultimos votos aceitos</h3>
                  <p className="text-sm text-muted-foreground">Registros validos mais recentes.</p>
                </div>
                <Badge variant="outline" className="rounded-full text-[10px]">
                  {formatNumber(votesQuery.data?.meta?.total ?? recentVotes.length)} votos
                </Badge>
              </div>

              {recentVotes.length === 0 ? (
                <EmptyState message="Nenhum voto aceito registrado ate agora." />
              ) : (
                <div className="space-y-3">
                  {recentVotes.map((vote) => (
                    <div key={vote.id} className="rounded-xl border border-border/40 bg-secondary/20 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex items-center gap-2">
                            <Badge
                              className={cn(
                                "rounded-full text-[10px]",
                                vote.status === "valid"
                                  ? "bg-success/15 text-success border-success/30"
                                  : "bg-destructive/10 text-destructive border-destructive/30"
                              )}
                            >
                              {vote.status === "valid" ? "Valido" : "Invalidado"}
                            </Badge>
                            {vote.placement_name ? (
                              <Badge variant="outline" className="rounded-full text-[10px]">
                                {vote.placement_name}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="font-medium">{vote.option_label || "Opcao removida"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Aceito em {formatDateTime(vote.accepted_at || vote.created_at)}
                          </p>
                          {vote.invalidated_reason ? (
                            <p className="mt-1 text-xs text-destructive">Motivo: {vote.invalidated_reason}</p>
                          ) : null}
                        </div>

                        {vote.status === "valid" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg text-xs"
                            onClick={() => setVotePendingInvalidation(vote)}
                          >
                            Invalidar
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Ultimas tentativas</h3>
                  <p className="text-sm text-muted-foreground">Aceitas, bloqueadas ou invalidas.</p>
                </div>
                <Badge variant="outline" className="rounded-full text-[10px]">
                  {formatNumber(attemptsQuery.data?.meta?.total ?? recentAttempts.length)} tentativas
                </Badge>
              </div>

              {recentAttempts.length === 0 ? (
                <EmptyState message="Nenhuma tentativa registrada ate agora." />
              ) : (
                <div className="space-y-3">
                  {recentAttempts.map((attempt) => {
                    const optionIds = Array.isArray(attempt.meta?.option_ids)
                      ? (attempt.meta.option_ids as Array<number | string>)
                      : [];

                    return (
                      <div key={attempt.id} className="rounded-xl border border-border/40 bg-secondary/20 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge
                            className={cn(
                              "rounded-full text-[10px]",
                              attempt.status === "accepted"
                                ? "bg-success/15 text-success border-success/30"
                                : attempt.status === "blocked"
                                  ? "bg-warning/15 text-warning border-warning/30"
                                  : "bg-muted text-muted-foreground border-muted"
                            )}
                          >
                            {attempt.status}
                          </Badge>
                          {attempt.block_reason ? (
                            <Badge variant="outline" className="rounded-full text-[10px]">
                              {attempt.block_reason}
                            </Badge>
                          ) : null}
                        </div>

                        <div className="grid gap-2 text-sm md:grid-cols-2">
                          <div>
                            <p className="font-medium">
                              {attempt.city || attempt.region || attempt.country || "Localizacao desconhecida"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {attempt.device_type || "device"} / {attempt.browser_family || "browser"}
                            </p>
                          </div>
                          <div className="text-left md:text-right">
                            <p className="text-xs text-muted-foreground">{formatDateTime(attempt.created_at)}</p>
                            <p className="text-xs text-muted-foreground">
                              {attempt.provider || "Provider desconhecido"}
                            </p>
                          </div>
                        </div>

                        {optionIds.length > 0 ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            option_ids: {optionIds.join(", ")}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={votePendingInvalidation !== null}
        onOpenChange={(open) => {
          if (!open) setVotePendingInvalidation(null);
        }}
        title="Invalidar voto?"
        description={
          votePendingInvalidation
            ? `O voto ${votePendingInvalidation.id} sera invalidado. O historico sera preservado.`
            : ""
        }
        confirmText="Invalidar voto"
        variant="warning"
        loading={invalidateVoteMutation.isPending}
        onConfirm={handleInvalidateVote}
      />
    </AppShell>
  );
};

export default EnqueteResultados;
