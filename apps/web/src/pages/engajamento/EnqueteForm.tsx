import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Trash2,
  Vote,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import PollOptionImageManager from "@/components/enquetes/PollOptionImageManager";
import PollPlacementsManager from "@/components/enquetes/PollPlacementsManager";
import PollSitesManager from "@/components/enquetes/PollSitesManager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePoll, usePoll, useUpdatePoll } from "@/hooks/useEnquetes";
import type {
  CreatePollDTO,
  PollAfterEndBehavior,
  PollOption as PollOptionResource,
  PollResultValueMode,
  PollResultsVisibility,
  PollSelectionType,
  PollStatus,
  PollVoteLimitMode,
  PollWidgetTemplate,
  UpdatePollDTO,
} from "@/services/enquete.service";
import showToast from "@/lib/toast";

interface FormOption {
  id?: number;
  local_id: string;
  label: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  image_url?: string | null;
  image_thumb_url?: string | null;
}

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function normalizeDateTimeLocal(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function makeBlankOption(order: number): FormOption {
  return {
    local_id: `${Date.now()}-${order}-${Math.random().toString(16).slice(2, 8)}`,
    label: "",
    description: "",
    sort_order: order,
    is_active: true,
  };
}

const EnqueteForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const pollId = Number(id);
  const isEditing = Number.isFinite(pollId);

  const pollQuery = usePoll(isEditing ? pollId : undefined);
  const createMutation = useCreatePoll();
  const updateMutation = useUpdatePoll();

  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<PollStatus>("draft");
  const [selectionType, setSelectionType] = useState<PollSelectionType>("single");
  const [maxChoices, setMaxChoices] = useState("1");
  const [voteLimitMode, setVoteLimitMode] = useState<PollVoteLimitMode>("once_ever");
  const [voteCooldownMinutes, setVoteCooldownMinutes] = useState("");
  const [resultsVisibility, setResultsVisibility] = useState<PollResultsVisibility>("live");
  const [afterEndBehavior, setAfterEndBehavior] = useState<PollAfterEndBehavior>("show_results_only");
  const [widgetTemplate, setWidgetTemplate] = useState<PollWidgetTemplate>("clean_white");
  const [resultValueMode, setResultValueMode] = useState<PollResultValueMode>("both");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [options, setOptions] = useState<FormOption[]>([makeBlankOption(0), makeBlankOption(1)]);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(false);
  }, [pollId]);

  useEffect(() => {
    if (!pollQuery.data?.data || hasHydrated) return;

    const poll = pollQuery.data.data;
    setTitle(poll.title);
    setQuestion(poll.question);
    setSlug(poll.slug ?? "");
    setStatus(poll.status);
    setSelectionType(poll.selection_type);
    setMaxChoices(String(poll.max_choices ?? (poll.selection_type === "single" ? 1 : 2)));
    setVoteLimitMode(poll.vote_limit_mode);
    setVoteCooldownMinutes(poll.vote_cooldown_minutes ? String(poll.vote_cooldown_minutes) : "");
    setResultsVisibility(poll.results_visibility);
    setAfterEndBehavior(poll.after_end_behavior);
    setWidgetTemplate(
      poll.settings?.widget_template === "clean_white" ? "clean_white" : "editorial_card"
    );
    setResultValueMode(
      poll.settings?.result_value_mode === "percentage" || poll.settings?.result_value_mode === "votes"
        ? poll.settings.result_value_mode
        : "both"
    );
    setStartsAt(toDateTimeLocal(poll.starts_at));
    setEndsAt(toDateTimeLocal(poll.ends_at));
    setTimezone(poll.timezone || DEFAULT_TIMEZONE);
    setOptions(
      poll.options
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((option) => ({
          id: option.id,
          local_id: `existing-${option.id}`,
          label: option.label,
          description: option.description ?? "",
          sort_order: option.sort_order,
          is_active: option.is_active,
          image_url: option.image_url,
          image_thumb_url: option.image_thumb_url,
        }))
    );
    setHasHydrated(true);
  }, [hasHydrated, pollQuery.data]);

  const isLoading = isEditing && pollQuery.isLoading;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const canAddOption = options.length < 10;
  const cleanedOptions = useMemo(
    () =>
      options.map((option, index) => ({
        id: option.id,
        label: option.label.trim(),
        description: option.description.trim() || null,
        sort_order: index,
        is_active: option.is_active,
      })),
    [options]
  );

  const addOption = () => {
    if (!canAddOption) return;
    setOptions((current) => [...current, makeBlankOption(current.length)]);
  };

  const removeOption = (localId: string) => {
    if (options.length <= 2) {
      showToast.error("A enquete precisa ter pelo menos 2 opcoes");
      return;
    }

    setOptions((current) =>
      current
        .filter((option) => option.local_id !== localId)
        .map((option, index) => ({ ...option, sort_order: index }))
    );
  };

  const updateOption = (localId: string, field: keyof Omit<FormOption, "id" | "local_id">, value: string | number | boolean) => {
    setOptions((current) =>
      current.map((option) =>
        option.local_id === localId ? { ...option, [field]: value } : option
      )
    );
  };

  const handleOptionImageUpdated = (localId: string, updatedOption: PollOptionResource) => {
    setOptions((current) =>
      current.map((option) =>
        option.local_id === localId
          ? {
            ...option,
            image_url: updatedOption.image_url,
            image_thumb_url: updatedOption.image_thumb_url,
          }
          : option
      )
    );
  };

  const buildPayload = (forcedStatus?: PollStatus): CreatePollDTO | UpdatePollDTO | null => {
    if (!title.trim()) {
      showToast.error("Informe o titulo interno da enquete");
      return null;
    }

    if (!question.trim()) {
      showToast.error("Informe a pergunta da enquete");
      return null;
    }

    if (cleanedOptions.some((option) => !option.label)) {
      showToast.error("Preencha todas as opcoes ativas da enquete");
      return null;
    }

    if (selectionType === "multiple" && (!maxChoices || Number(maxChoices) < 2)) {
      showToast.error("Em enquete multipla, informe max_choices maior ou igual a 2");
      return null;
    }

    if (voteLimitMode === "once_per_window" && (!voteCooldownMinutes || Number(voteCooldownMinutes) < 1)) {
      showToast.error("Informe a janela de minutos para once_per_window");
      return null;
    }

    return {
      title: title.trim(),
      question: question.trim(),
      slug: slug.trim() || null,
      status: forcedStatus ?? status,
      selection_type: selectionType,
      max_choices: selectionType === "single" ? 1 : Number(maxChoices),
      vote_limit_mode: voteLimitMode,
      vote_cooldown_minutes:
        voteLimitMode === "once_per_window" ? Number(voteCooldownMinutes) : null,
      results_visibility: resultsVisibility,
      after_end_behavior: afterEndBehavior,
      starts_at: normalizeDateTimeLocal(startsAt),
      ends_at: normalizeDateTimeLocal(endsAt),
      timezone,
      settings: {
        widget_template: widgetTemplate,
        result_value_mode: resultValueMode,
      },
      options: cleanedOptions,
    };
  };

  const handleSave = async (forcedStatus?: PollStatus) => {
    const payload = buildPayload(forcedStatus);

    if (!payload) return;

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: pollId, data: payload });
      } else {
        await createMutation.mutateAsync(payload as CreatePollDTO);
      }

      navigate("/engajamento/enquetes");
    } catch {
      return;
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (isEditing && pollQuery.isError) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
          Nao foi possivel carregar a enquete para edicao.
        </div>
      </AppShell>
    );
  }

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

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold md:text-2xl">
              {isEditing ? "Editar Enquete" : "Nova Enquete"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure pergunta, opcoes, politica de voto e janela de exibicao.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-5xl space-y-6 pb-20 md:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-border/50 bg-card p-6"
        >
          <h2 className="mb-4 text-lg font-semibold">Conteudo</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Titulo interno *</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex: Enquete Programacao TV VIP"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="programacao-tv-vip"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="question">Pergunta da enquete *</Label>
              <Textarea
                id="question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ex: Qual programa voce mais acompanha?"
                className="min-h-[110px] rounded-xl"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border/50 bg-card p-6"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Opcoes</h2>
              <p className="text-sm text-muted-foreground">Minimo 2, maximo 10 opcoes.</p>
            </div>
            <Button variant="outline" className="rounded-xl" onClick={addOption} disabled={!canAddOption}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={option.local_id} className="rounded-xl border border-border/50 bg-secondary/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{index + 1}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeOption(option.local_id)}
                    disabled={options.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr,1fr,120px]">
                  <div className="space-y-2">
                    <Label>Label *</Label>
                    <Input
                      value={option.label}
                      onChange={(event) => updateOption(option.local_id, "label", event.target.value)}
                      placeholder={`Opcao ${index + 1}`}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descricao</Label>
                    <Input
                      value={option.description}
                      onChange={(event) => updateOption(option.local_id, "description", event.target.value)}
                      placeholder="Descricao opcional"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ativa</Label>
                    <Select
                      value={option.is_active ? "true" : "false"}
                      onValueChange={(value) => updateOption(option.local_id, "is_active", value === "true")}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sim</SelectItem>
                        <SelectItem value="false">Nao</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-3">
                  <PollOptionImageManager
                    optionId={option.id}
                    imageUrl={option.image_url}
                    imageThumbUrl={option.image_thumb_url}
                    onUpdated={(updatedOption) => handleOptionImageUpdated(option.local_id, updatedOption)}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-border/50 bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <Vote className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Votacao</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de selecao</Label>
                <Select value={selectionType} onValueChange={(value) => setSelectionType(value as PollSelectionType)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Escolha unica</SelectItem>
                    <SelectItem value="multiple">Multipla escolha</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectionType === "multiple" ? (
                <div className="space-y-2">
                  <Label htmlFor="maxChoices">Maximo de escolhas</Label>
                  <Input
                    id="maxChoices"
                    type="number"
                    min={2}
                    max={20}
                    value={maxChoices}
                    onChange={(event) => setMaxChoices(event.target.value)}
                    className="rounded-xl"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Politica de voto</Label>
                <Select value={voteLimitMode} onValueChange={(value) => setVoteLimitMode(value as PollVoteLimitMode)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once_ever">Uma vez para sempre</SelectItem>
                    <SelectItem value="once_per_day">Uma vez por dia</SelectItem>
                    <SelectItem value="once_per_window">Uma vez por janela</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {voteLimitMode === "once_per_window" ? (
                <div className="space-y-2">
                  <Label htmlFor="voteCooldownMinutes">Janela em minutos</Label>
                  <Input
                    id="voteCooldownMinutes"
                    type="number"
                    min={1}
                    max={10080}
                    value={voteCooldownMinutes}
                    onChange={(event) => setVoteCooldownMinutes(event.target.value)}
                    className="rounded-xl"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as PollStatus)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="scheduled">Agendada</SelectItem>
                    <SelectItem value="live">Ao vivo</SelectItem>
                    <SelectItem value="paused">Pausada</SelectItem>
                    <SelectItem value="closed">Encerrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border/50 bg-card p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">Resultado e encerramento</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Visibilidade dos resultados</Label>
                <Select
                  value={resultsVisibility}
                  onValueChange={(value) => setResultsVisibility(value as PollResultsVisibility)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">Ao vivo</SelectItem>
                    <SelectItem value="after_vote">Depois do voto</SelectItem>
                    <SelectItem value="after_end">Depois do fim</SelectItem>
                    <SelectItem value="never">Nunca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Comportamento apos o fim</Label>
                <Select
                  value={afterEndBehavior}
                  onValueChange={(value) => setAfterEndBehavior(value as PollAfterEndBehavior)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hide_widget">Esconder widget</SelectItem>
                    <SelectItem value="show_closed_message">Mostrar mensagem de encerrada</SelectItem>
                    <SelectItem value="show_results_only">Mostrar apenas resultados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="rounded-2xl border border-border/50 bg-card p-6"
        >
          <h2 className="mb-4 text-lg font-semibold">Widget e incorporacao</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Template do widget</Label>
              <Select
                value={widgetTemplate}
                onValueChange={(value) => setWidgetTemplate(value as PollWidgetTemplate)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editorial_card">Editorial com destaque</SelectItem>
                  <SelectItem value="clean_white">Branco nativo do site</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Use o template branco para embed mais discreto e integrado ao layout do portal.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Exibicao do valor nos resultados</Label>
              <Select
                value={resultValueMode}
                onValueChange={(value) => setResultValueMode(value as PollResultValueMode)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Somente porcentagem</SelectItem>
                  <SelectItem value="votes">Somente quantidade de votos</SelectItem>
                  <SelectItem value="both">Quantidade + porcentagem</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Quando a visibilidade estiver em <span className="font-medium">Depois do voto</span>, o widget passa a exibir apenas o resultado apos voto aceito ou bloqueio por repeticao.
              </p>
            </div>
          </div>
        </motion.div>

        {status === "scheduled" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border border-border/50 bg-card p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">Agendamento</h2>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="startsAt" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Inicia em
                </Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endsAt" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Termina em
                </Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          </motion.div>
        )}

        {isEditing ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.27 }}
            >
              <div className="mb-3 flex flex-wrap gap-2">
                <Link to={`/engajamento/enquetes/${pollId}/placements`}>
                  <Button variant="outline" className="rounded-xl">
                    Gerenciar incorporações
                  </Button>
                </Link>
                <Link to={`/engajamento/enquetes/${pollId}/resultados`}>
                  <Button variant="outline" className="rounded-xl">
                    Ver resultados
                  </Button>
                </Link>
              </div>
              <PollPlacementsManager pollId={pollId} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.29 }}
            >
              <div className="mb-3 flex flex-wrap gap-2">
                <Link to="/engajamento/enquetes/sites">
                  <Button variant="outline" className="rounded-xl">
                    Abrir pagina de sites
                  </Button>
                </Link>
              </div>
              <PollSitesManager />
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.27 }}
            className="rounded-2xl border border-border/50 bg-card p-6"
          >
            <h2 className="mb-2 text-lg font-semibold">Próximos ajustes após salvar</h2>
            <p className="text-sm text-muted-foreground">
              Depois de criar a enquete, você poderá cadastrar placements, parceiros autorizados e enviar imagem por opção na tela de edição.
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-3"
        >
          <Button variant="outline" onClick={() => navigate("/engajamento/enquetes")} className="rounded-xl">
            Cancelar
          </Button>
          <Button variant="outline" onClick={() => handleSave("draft")} className="rounded-xl">
            Salvar rascunho
          </Button>
          <div className="flex-1" />
          <Button
            onClick={() => handleSave()}
            disabled={isSaving}
            className="min-w-[160px] rounded-xl bg-primary hover:bg-primary-dark"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Salvar alteracoes" : "Criar enquete"}
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </AppShell>
  );
};

export default EnqueteForm;
