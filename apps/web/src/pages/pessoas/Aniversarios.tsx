import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Cake,
  Award,
  Calendar,
  ChevronRight,
  PartyPopper,
  Gift,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAniversarios } from "@/hooks/useColaboradores";
import type { Collaborator } from "@/services/colaborador.service";

// ==========================================
// TYPES & HELPERS
// ==========================================

interface CelebrationItem {
  id: number;
  name: string;
  date: string;
  daysUntil: number;
  type: "birthday" | "milestone";
  years?: number;
  avatar?: string | null;
  department: string;
}

const milestoneLabels: Record<number, string> = {
  1: "1 ano de casa",
  2: "2 anos de casa",
  3: "3 anos de casa",
  5: "5 anos de casa",
  8: "8 anos de casa",
  10: "10 anos de casa",
  15: "15 anos de casa",
  20: "20 anos de casa",
  25: "25 anos de casa",
  30: "30 anos de casa",
};

function formatBirthDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Transform Collaborator API data into CelebrationItems (birthdays + milestones)
 */
function transformCollaborators(collaborators: Collaborator[]): CelebrationItem[] {
  const items: CelebrationItem[] = [];

  for (const c of collaborators) {
    // Birthday
    if (c.birth_date && c.days_until_birthday !== null && c.days_until_birthday !== undefined) {
      items.push({
        id: c.id,
        name: c.name,
        date: formatBirthDate(c.birth_date),
        daysUntil: c.days_until_birthday,
        type: "birthday",
        avatar: c.avatar_url,
        department: c.department || "—",
      });
    }

    // Milestone
    if (c.upcoming_milestone && c.upcoming_milestone.days_until <= 30) {
      items.push({
        id: c.id * 10000, // unique key for milestone vs birthday
        name: c.name,
        date: formatBirthDate(c.admission_date),
        daysUntil: c.upcoming_milestone.days_until,
        type: "milestone",
        years: c.upcoming_milestone.years,
        avatar: c.avatar_url,
        department: c.department || "—",
      });
    }
  }

  // Sort by daysUntil ascending
  return items.sort((a, b) => a.daysUntil - b.daysUntil);
}

// ==========================================
// MAIN COMPONENT
// ==========================================

const PessoasAniversarios = () => {
  const { data: aniversariosData, isLoading, isError } = useAniversarios(60);

  const celebrations = useMemo(() => {
    if (!aniversariosData?.data) return [];
    return transformCollaborators(aniversariosData.data);
  }, [aniversariosData]);

  const birthdays = useMemo(() => celebrations.filter((c) => c.type === "birthday"), [celebrations]);
  const milestones = useMemo(() => celebrations.filter((c) => c.type === "milestone"), [celebrations]);
  const todayCelebrations = useMemo(() => celebrations.filter((c) => c.daysUntil === 0), [celebrations]);
  const weekCelebrations = useMemo(() => celebrations.filter((c) => c.daysUntil <= 7), [celebrations]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Carregando aniversários...</span>
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-destructive font-semibold">Erro ao carregar aniversários</p>
          <p className="text-sm text-muted-foreground mt-1">Tente novamente mais tarde.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-xl md:text-2xl font-bold">Aniversários & Marcos</h1>
        <p className="text-sm text-muted-foreground">
          Celebre as conquistas da equipe
        </p>
      </motion.div>

      {/* Today's Celebrations */}
      {todayCelebrations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-6 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 rounded-2xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <PartyPopper className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-bold">Celebrações de Hoje!</h2>
          </div>
          <div className="flex flex-wrap gap-4">
            {todayCelebrations.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-card rounded-xl p-3 shadow-md"
              >
                <Avatar className="h-12 w-12 ring-2 ring-primary">
                  <AvatarImage src={item.avatar || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {getInitials(item.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <div className="flex items-center gap-1 text-sm text-primary">
                    {item.type === "birthday" ? (
                      <>
                        <Cake className="w-4 h-4" />
                        <span>Aniversário!</span>
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        <span>{item.years} anos de casa!</span>
                      </>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="outline" className="ml-auto rounded-lg">
                  <Gift className="w-4 h-4 mr-1" />
                  Parabenizar
                </Button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 rounded-xl p-4 border border-primary/30"
        >
          <div className="flex items-center gap-2 text-primary text-sm">
            <Cake className="w-4 h-4" />
            Aniversários
          </div>
          <p className="text-2xl font-bold mt-1 text-primary">{birthdays.length}</p>
          <p className="text-[10px] text-muted-foreground">próximos 60 dias</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-warning/10 rounded-xl p-4 border border-warning/30"
        >
          <div className="flex items-center gap-2 text-warning text-sm">
            <Award className="w-4 h-4" />
            Marcos
          </div>
          <p className="text-2xl font-bold mt-1 text-warning">{milestones.length}</p>
          <p className="text-[10px] text-muted-foreground">próximos 30 dias</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-success/10 rounded-xl p-4 border border-success/30"
        >
          <div className="flex items-center gap-2 text-success text-sm">
            <PartyPopper className="w-4 h-4" />
            Hoje
          </div>
          <p className="text-2xl font-bold mt-1 text-success">{todayCelebrations.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl p-4 border border-border/50"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="w-4 h-4" />
            Esta Semana
          </div>
          <p className="text-2xl font-bold mt-1">
            {weekCelebrations.length}
          </p>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg py-2 text-xs md:text-sm">
            Todos
          </TabsTrigger>
          <TabsTrigger value="birthdays" className="rounded-lg py-2 text-xs md:text-sm">
            <Cake className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">Aniversários</span>
          </TabsTrigger>
          <TabsTrigger value="milestones" className="rounded-lg py-2 text-xs md:text-sm">
            <Award className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">Marcos</span>
          </TabsTrigger>
        </TabsList>

        {/* All Tab */}
        <TabsContent value="all">
          <CelebrationList items={celebrations} />
        </TabsContent>

        {/* Birthdays Tab */}
        <TabsContent value="birthdays">
          <CelebrationList items={birthdays} />
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones">
          <CelebrationList items={milestones} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

function CelebrationList({ items }: { items: CelebrationItem[] }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-3 pb-20 md:pb-0"
    >
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "bg-card rounded-2xl border p-4 transition-all hover:shadow-md flex items-center gap-4",
            item.daysUntil === 0
              ? "border-primary/50 bg-gradient-to-r from-primary/10 to-transparent"
              : "border-border/50"
          )}
        >
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={item.avatar || undefined} />
            <AvatarFallback
              className={cn(
                "font-bold",
                item.type === "birthday"
                  ? "bg-primary/20 text-primary"
                  : "bg-warning/20 text-warning"
              )}
            >
              {getInitials(item.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{item.name}</h3>
              <Badge
                className={cn(
                  "text-[10px] rounded-full",
                  item.type === "birthday"
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-warning/15 text-warning border-warning/30"
                )}
              >
                {item.type === "birthday" ? (
                  <>
                    <Cake className="w-3 h-3 mr-1" />
                    Aniversário
                  </>
                ) : (
                  <>
                    <Award className="w-3 h-3 mr-1" />
                    {milestoneLabels[item.years || 0] || `${item.years} anos`}
                  </>
                )}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{item.department}</p>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{item.date}</span>
            </div>
            <p
              className={cn(
                "text-xs",
                item.daysUntil === 0 ? "text-primary font-semibold" : "text-muted-foreground"
              )}
            >
              {item.daysUntil === 0 ? "Hoje!" : `em ${item.daysUntil} dias`}
            </p>
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </motion.div>
      ))}

      {items.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma celebração encontrada</p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default PessoasAniversarios;
