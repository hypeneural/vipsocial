import { useState } from "react";
import { motion } from "framer-motion";
import {
  Cake,
  Award,
  Calendar,
  ChevronRight,
  PartyPopper,
  Gift,
  Bell,
  Clock,
  Star,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CelebrationItem {
  id: string;
  name: string;
  date: string;
  daysUntil: number;
  type: "birthday" | "milestone";
  years?: number;
  avatar?: string;
  department: string;
}

const mockCelebrations: CelebrationItem[] = [
  {
    id: "1",
    name: "Maria Santos",
    date: "20 Jan",
    daysUntil: 0,
    type: "birthday",
    department: "Redação",
  },
  {
    id: "2",
    name: "Carlos Oliveira",
    date: "22 Jan",
    daysUntil: 2,
    type: "milestone",
    years: 5,
    department: "Economia",
  },
  {
    id: "3",
    name: "Ana Costa",
    date: "25 Jan",
    daysUntil: 5,
    type: "birthday",
    department: "Mídias Sociais",
  },
  {
    id: "4",
    name: "Pedro Almeida",
    date: "28 Jan",
    daysUntil: 8,
    type: "milestone",
    years: 8,
    department: "TI",
  },
  {
    id: "5",
    name: "Julia Lima",
    date: "02 Fev",
    daysUntil: 13,
    type: "birthday",
    department: "RH",
  },
  {
    id: "6",
    name: "Fernando Souza",
    date: "05 Fev",
    daysUntil: 16,
    type: "milestone",
    years: 10,
    department: "Diretoria",
  },
  {
    id: "7",
    name: "Camila Rocha",
    date: "10 Fev",
    daysUntil: 21,
    type: "birthday",
    department: "Marketing",
  },
  {
    id: "8",
    name: "Roberto Dias",
    date: "15 Fev",
    daysUntil: 26,
    type: "milestone",
    years: 2,
    department: "Comercial",
  },
];

const milestoneLabels: Record<number, string> = {
  1: "1 ano de casa",
  2: "2 anos de casa",
  5: "5 anos de casa",
  8: "8 anos de casa",
  10: "10 anos de casa",
  15: "15 anos de casa",
  20: "20 anos de casa",
};

const PessoasAniversarios = () => {
  const [notifications, setNotifications] = useState({
    birthday1Day: true,
    birthdayToday: true,
    milestone1Day: true,
    milestoneToday: true,
  });

  const birthdays = mockCelebrations.filter((c) => c.type === "birthday");
  const milestones = mockCelebrations.filter((c) => c.type === "milestone");
  const todayCelebrations = mockCelebrations.filter((c) => c.daysUntil === 0);

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
                  <AvatarImage src={item.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {item.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
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
          <p className="text-[10px] text-muted-foreground">próximos 30 dias</p>
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
            {mockCelebrations.filter((c) => c.daysUntil <= 7).length}
          </p>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50 rounded-xl">
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
          <TabsTrigger value="settings" className="rounded-lg py-2 text-xs md:text-sm">
            <Bell className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">Notificações</span>
          </TabsTrigger>
        </TabsList>

        {/* All Tab */}
        <TabsContent value="all">
          <CelebrationList items={mockCelebrations} />
        </TabsContent>

        {/* Birthdays Tab */}
        <TabsContent value="birthdays">
          <CelebrationList items={birthdays} />
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones">
          <CelebrationList items={milestones} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border/50 p-6 space-y-6"
          >
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notificações Automáticas
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Configure quando deseja receber alertas sobre aniversários e marcos.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Cake className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Aniversário - 1 dia antes</p>
                      <p className="text-xs text-muted-foreground">
                        Receber lembrete no dia anterior
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.birthday1Day}
                    onCheckedChange={(v) =>
                      setNotifications({ ...notifications, birthday1Day: v })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <PartyPopper className="w-5 h-5 text-success" />
                    <div>
                      <p className="font-medium">Aniversário - No dia</p>
                      <p className="text-xs text-muted-foreground">
                        Receber notificação no dia do aniversário
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.birthdayToday}
                    onCheckedChange={(v) =>
                      setNotifications({ ...notifications, birthdayToday: v })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-warning" />
                    <div>
                      <p className="font-medium">Marco - 1 dia antes</p>
                      <p className="text-xs text-muted-foreground">
                        Alertar sobre 1, 2, 5, 10, 15, 20 anos de empresa
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.milestone1Day}
                    onCheckedChange={(v) =>
                      setNotifications({ ...notifications, milestone1Day: v })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-warning" />
                    <div>
                      <p className="font-medium">Marco - No dia</p>
                      <p className="text-xs text-muted-foreground">
                        Celebrar o marco no dia exato
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.milestoneToday}
                    onCheckedChange={(v) =>
                      setNotifications({ ...notifications, milestoneToday: v })
                    }
                  />
                </div>
              </div>
            </div>

            <Button className="w-full">Salvar Configurações</Button>
          </motion.div>
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
            <AvatarImage src={item.avatar} />
            <AvatarFallback
              className={cn(
                "font-bold",
                item.type === "birthday"
                  ? "bg-primary/20 text-primary"
                  : "bg-warning/20 text-warning"
              )}
            >
              {item.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
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
