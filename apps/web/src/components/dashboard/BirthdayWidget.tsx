import { useMemo } from "react";
import { motion } from "framer-motion";
import { Cake, Award, Calendar, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAniversarios } from "@/hooks/useColaboradores";
import type { Collaborator } from "@/services/colaborador.service";

interface DashboardCelebrationEvent {
  id: string;
  name: string;
  avatar?: string | null;
  dateLabel: string;
  daysUntil: number;
  type: "birthday" | "anniversary";
  years?: number;
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

const formatMonthLabel = (date: Date) => {
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
};

const formatDateLabel = (isoDate: string | null | undefined) => {
  if (!isoDate) return "--";

  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "--";

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  }).replace(".", "");
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const buildCelebrationEvents = (collaborators: Collaborator[]): DashboardCelebrationEvent[] => {
  const events: DashboardCelebrationEvent[] = [];

  for (const collaborator of collaborators) {
    if (
      collaborator.birth_date &&
      collaborator.days_until_birthday !== null &&
      collaborator.days_until_birthday !== undefined
    ) {
      events.push({
        id: `${collaborator.id}-birthday`,
        name: collaborator.name,
        avatar: collaborator.avatar_url,
        dateLabel: formatDateLabel(collaborator.birth_date),
        daysUntil: collaborator.days_until_birthday,
        type: "birthday",
      });
    }

    if (collaborator.upcoming_milestone) {
      events.push({
        id: `${collaborator.id}-anniversary-${collaborator.upcoming_milestone.years}`,
        name: collaborator.name,
        avatar: collaborator.avatar_url,
        dateLabel: formatDateLabel(collaborator.admission_date),
        daysUntil: collaborator.upcoming_milestone.days_until,
        type: "anniversary",
        years: collaborator.upcoming_milestone.years,
      });
    }
  }

  return events
    .filter((event) => event.daysUntil >= 0)
    .sort((a, b) => {
      if (a.daysUntil !== b.daysUntil) {
        return a.daysUntil - b.daysUntil;
      }

      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }

      return a.type === "birthday" ? -1 : 1;
    })
    .slice(0, 4);
};

const formatDaysUntilLabel = (daysUntil: number) => {
  if (daysUntil === 0) return "Hoje";
  if (daysUntil === 1) return "Amanha";
  return `Em ${daysUntil} dias`;
};

export function BirthdayWidget() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useAniversarios(365, { include_milestones: true });

  const events = useMemo(() => {
    return buildCelebrationEvents(data?.data ?? []);
  }, [data?.data]);

  const monthLabel = useMemo(() => formatMonthLabel(new Date()), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-card rounded-2xl shadow-lg border border-border/50 p-4 md:p-6 h-full"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Cake className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold">Aniversarios e Marcos</h3>
          <p className="text-xs text-muted-foreground">Proximos eventos · {monthLabel}</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando eventos...
        </div>
      )}

      {isError && !isLoading && (
        <div className="text-sm text-muted-foreground py-6">
          Nao foi possivel carregar os eventos agora.
        </div>
      )}

      {!isLoading && !isError && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            show: { transition: { staggerChildren: 0.08 } },
          }}
          className="space-y-2"
        >
          {events.map((event) => (
            <motion.div
              key={event.id}
              variants={itemVariants}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer",
                event.daysUntil === 0
                  ? "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
                  : "hover:bg-muted/50"
              )}
            >
              <Avatar className="h-10 w-10 ring-2 ring-background">
                <AvatarImage src={event.avatar ?? undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-sm font-semibold">
                  {getInitials(event.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{event.name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {event.type === "birthday" ? (
                    <>
                      <Cake className="w-3 h-3" />
                      <span>Aniversario</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-3 h-3" />
                      <span>{event.years} anos de casa</span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">{event.dateLabel}</span>
                </div>
                <p className={cn("text-[11px]", event.daysUntil === 0 ? "text-primary font-semibold" : "text-muted-foreground")}>
                  {formatDaysUntilLabel(event.daysUntil)}
                </p>
              </div>
            </motion.div>
          ))}

          {events.length === 0 && (
            <div className="text-sm text-muted-foreground py-4">
              Nenhum evento encontrado para o periodo selecionado.
            </div>
          )}
        </motion.div>
      )}

      <Button
        variant="ghost"
        className="w-full mt-4 text-primary hover:text-primary hover:bg-primary/5 rounded-xl"
        onClick={() => navigate("/pessoas/aniversarios")}
      >
        Ver todos
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </motion.div>
  );
}

