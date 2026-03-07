import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Calendar,
  Copy,
  Filter,
  MoreVertical,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
  Users,
  Vote,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  useArchivePoll,
  useClosePoll,
  useDuplicatePoll,
  usePausePoll,
  usePolls,
  usePollsOverview,
  useReopenPoll,
} from "@/hooks/useEnquetes";
import type { Poll, PollStatus } from "@/services/enquete.service";
import { cn } from "@/lib/utils";

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

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSchedule(poll: Poll) {
  const start = formatDate(poll.starts_at);
  const end = formatDate(poll.ends_at);

  if (start && end) return `${start} - ${end}`;
  if (start) return `Inicia em ${start}`;
  if (end) return `Encerra em ${end}`;
  return "Sem janela agendada";
}

const Enquetes = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | PollStatus>("all");
  const [pollPendingArchive, setPollPendingArchive] = useState<Poll | null>(null);

  const overviewQuery = usePollsOverview();
  const pollsQuery = usePolls({
    per_page: 100,
    search: searchQuery || undefined,
    include_archived: false,
    status: filterStatus === "all" ? undefined : filterStatus,
  });

  const duplicateMutation = useDuplicatePoll();
  const pauseMutation = usePausePoll();
  const closeMutation = useClosePoll();
  const reopenMutation = useReopenPoll();
  const archiveMutation = useArchivePoll();

  const polls = pollsQuery.data?.data ?? [];
  const stats = overviewQuery.data?.data;

  const totalBlocked = useMemo(
    () => polls.reduce((sum, poll) => sum + poll.blocked_attempts_count, 0),
    [polls]
  );

  const handleDuplicate = async (id: number) => {
    try {
      await duplicateMutation.mutateAsync(id);
    } catch {
      return;
    }
  };

  const handlePause = async (id: number) => {
    try {
      await pauseMutation.mutateAsync(id);
    } catch {
      return;
    }
  };

  const handleClose = async (id: number) => {
    try {
      await closeMutation.mutateAsync(id);
    } catch {
      return;
    }
  };

  const handleReopen = async (id: number) => {
    try {
      await reopenMutation.mutateAsync(id);
    } catch {
      return;
    }
  };

  const handleArchive = async () => {
    if (!pollPendingArchive) return;

    try {
      await archiveMutation.mutateAsync(pollPendingArchive.id);
      setPollPendingArchive(null);
    } catch {
      return;
    }
  };

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold md:text-2xl">Enquetes</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie enquetes, incorporações e acompanhe resultados reais.
            </p>
          </div>

          <div className="flex gap-2">
            <Link to="/engajamento/enquetes/sites">
              <Button variant="outline" className="rounded-xl">
                Sites
              </Button>
            </Link>
            <Link to="/engajamento/enquetes/nova">
              <Button className="rounded-xl bg-primary hover:bg-primary-dark">
                <Plus className="mr-2 h-4 w-4" />
                Nova Enquete
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Vote className="h-4 w-4" />
            Total
          </div>
          <p className="mt-1 text-2xl font-bold">{stats?.total_polls ?? polls.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-success/30 bg-success/10 p-4"
        >
          <div className="flex items-center gap-2 text-sm text-success">
            <Play className="h-4 w-4" />
            Ao vivo
          </div>
          <p className="mt-1 text-2xl font-bold text-success">{stats?.live_polls ?? 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-primary/30 bg-primary/10 p-4"
        >
          <div className="flex items-center gap-2 text-sm text-primary">
            <Users className="h-4 w-4" />
            Votos válidos
          </div>
          <p className="mt-1 text-2xl font-bold text-primary">
            {(stats?.votes_accepted ?? 0).toLocaleString("pt-BR")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-warning/30 bg-warning/10 p-4"
        >
          <div className="flex items-center gap-2 text-sm text-warning">
            <XCircle className="h-4 w-4" />
            Bloqueados
          </div>
          <p className="mt-1 text-2xl font-bold text-warning">
            {(stats?.votes_blocked ?? totalBlocked).toLocaleString("pt-BR")}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex flex-col gap-3 md:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar por título, pergunta ou slug..."
            className="rounded-xl bg-secondary/50 pl-10"
          />
        </div>

        <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as "all" | PollStatus)}>
          <SelectTrigger className="w-full rounded-xl md:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunhos</SelectItem>
            <SelectItem value="scheduled">Agendadas</SelectItem>
            <SelectItem value="live">Ao vivo</SelectItem>
            <SelectItem value="paused">Pausadas</SelectItem>
            <SelectItem value="closed">Encerradas</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {pollsQuery.isLoading ? (
        <div className="rounded-2xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
          Carregando enquetes...
        </div>
      ) : pollsQuery.isError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
          Nao foi possivel carregar as enquetes.
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Accordion type="single" collapsible className="space-y-3">
            {polls.map((poll, index) => {
              const config = statusConfig[poll.status];

              return (
                <motion.div
                  key={poll.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <AccordionItem
                    value={String(poll.id)}
                    className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm"
                  >
                    <AccordionTrigger className="px-4 py-4 hover:no-underline">
                      <div className="flex w-full items-start gap-4 text-left">
                        <StatusIndicator status={config.indicator} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <Badge className={cn("rounded-full text-[10px]", config.badgeClass)}>
                              {config.label}
                            </Badge>
                            <Badge variant="outline" className="rounded-full text-[10px]">
                              {poll.selection_type === "multiple" ? "Multipla" : "Unica"}
                            </Badge>
                            {poll.max_choices && poll.selection_type === "multiple" ? (
                              <Badge variant="outline" className="rounded-full text-[10px]">
                                Ate {poll.max_choices} opcoes
                              </Badge>
                            ) : null}
                          </div>

                          <h3 className="line-clamp-1 font-semibold text-sm md:text-base">{poll.title}</h3>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{poll.question}</p>

                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {poll.valid_votes_count.toLocaleString("pt-BR")} votos
                            </span>
                            <span className="flex items-center gap-1">
                              <Vote className="h-3 w-3" />
                              {poll.options_count} opcoes
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" />
                              {poll.placements_count} incorporações
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatSchedule(poll)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-4 pb-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Votos válidos</p>
                          <p className="mt-1 text-lg font-semibold">{poll.valid_votes_count.toLocaleString("pt-BR")}</p>
                        </div>
                        <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Bloqueios</p>
                          <p className="mt-1 text-lg font-semibold">{poll.blocked_attempts_count.toLocaleString("pt-BR")}</p>
                        </div>
                        <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Visibilidade</p>
                          <p className="mt-1 text-sm font-semibold">
                            {{ live: "Ao vivo", after_vote: "Após o voto", after_end: "Após encerrar", never: "Nunca" }[poll.results_visibility] ?? poll.results_visibility}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
                        <Button
                          size="sm"
                          className="h-8 rounded-lg text-xs"
                          onClick={() => navigate(`/engajamento/enquetes/${poll.id}/resultados`)}
                        >
                          <BarChart3 className="mr-1 h-3 w-3" />
                          Ver Resultados
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg text-xs"
                          onClick={() => navigate(`/engajamento/enquetes/${poll.id}/editar`)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg text-xs"
                          onClick={() => navigate(`/engajamento/enquetes/${poll.id}/placements`)}
                        >
                          Incorporações
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="ml-auto h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDuplicate(poll.id)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>

                            {poll.status === "live" ? (
                              <DropdownMenuItem onClick={() => handlePause(poll.id)}>
                                <Pause className="mr-2 h-4 w-4" />
                                Pausar
                              </DropdownMenuItem>
                            ) : null}

                            {poll.status === "paused" ? (
                              <DropdownMenuItem onClick={() => handleReopen(poll.id)}>
                                <Play className="mr-2 h-4 w-4" />
                                Reabrir
                              </DropdownMenuItem>
                            ) : null}

                            {(poll.status === "live" || poll.status === "paused" || poll.status === "scheduled") ? (
                              <DropdownMenuItem onClick={() => handleClose(poll.id)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Encerrar
                              </DropdownMenuItem>
                            ) : null}

                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setPollPendingArchive(poll)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Arquivar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              );
            })}
          </Accordion>

          {polls.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-card py-12 text-center text-muted-foreground">
              <Vote className="mx-auto mb-4 h-10 w-10 opacity-50" />
              <p>Nenhuma enquete encontrada.</p>
              <p className="text-sm text-muted-foreground/70">Ajuste os filtros ou crie uma nova enquete.</p>
            </div>
          ) : null}
        </motion.div>
      )}

      <ConfirmDialog
        open={pollPendingArchive !== null}
        onOpenChange={(open) => {
          if (!open) setPollPendingArchive(null);
        }}
        title="Arquivar enquete?"
        description={
          pollPendingArchive
            ? `A enquete "${pollPendingArchive.title}" sera arquivada. O historico de votos e tentativas sera preservado.`
            : ""
        }
        confirmText="Arquivar enquete"
        variant="danger"
        loading={archiveMutation.isPending}
        onConfirm={handleArchive}
      />
    </AppShell>
  );
};

export default Enquetes;
