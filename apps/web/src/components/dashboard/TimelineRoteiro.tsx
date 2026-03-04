import { motion } from "framer-motion";
import { Clock, User, CheckCircle2, Circle, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface RoteiroItem {
  id: string;
  time: string;
  title: string;
  responsible: string;
  duration: string;
  status: "ready" | "pending" | "late";
}

const mockRoteiro: RoteiroItem[] = [
  {
    id: "1",
    time: "07:00",
    title: "Manchete do Dia - Economia",
    responsible: "João Silva",
    duration: "02:30",
    status: "ready",
  },
  {
    id: "2",
    time: "07:05",
    title: "Entrevista Prefeito",
    responsible: "Maria Santos",
    duration: "05:00",
    status: "ready",
  },
  {
    id: "3",
    time: "07:15",
    title: "Clima e Previsão do Tempo",
    responsible: "Carlos Oliveira",
    duration: "01:30",
    status: "pending",
  },
  {
    id: "4",
    time: "07:20",
    title: "Esportes - Rodada do Brasileirão",
    responsible: "Ana Costa",
    duration: "03:00",
    status: "pending",
  },
  {
    id: "5",
    time: "07:30",
    title: "Política Nacional",
    responsible: "Pedro Almeida",
    duration: "02:00",
    status: "late",
  },
];

const statusConfig = {
  ready: {
    icon: CheckCircle2,
    label: "Pronto",
    color: "text-success",
    bg: "bg-success/10",
    dot: "bg-success",
    border: "border-success/30",
  },
  pending: {
    icon: Circle,
    label: "Em produção",
    color: "text-warning",
    bg: "bg-warning/10",
    dot: "bg-warning",
    border: "border-warning/30",
  },
  late: {
    icon: AlertCircle,
    label: "Atrasado",
    color: "text-destructive",
    bg: "bg-destructive/10",
    dot: "bg-destructive",
    border: "border-destructive/30",
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

export function TimelineRoteiro() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-2xl shadow-lg border border-border/50 p-4 md:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h3 className="text-lg font-bold">Roteiro do Dia</h3>
          <p className="text-sm text-muted-foreground">Segunda-feira, 20 Jan 2026</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success"></span>
            <span className="text-muted-foreground">Pronto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning"></span>
            <span className="text-muted-foreground">Pendente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-destructive"></span>
            <span className="text-muted-foreground">Atrasado</span>
          </div>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-0"
      >
        {mockRoteiro.map((item, index) => {
          const status = statusConfig[item.status];
          const StatusIcon = status.icon;

          return (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className={cn(
                "relative pl-6 md:pl-8 pb-4 md:pb-6",
                index !== mockRoteiro.length - 1 && "border-l-2 border-border ml-1.5 md:ml-2"
              )}
            >
              {/* Timeline dot */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1, type: "spring" }}
                className={cn(
                  "absolute left-0 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-background",
                  status.dot,
                  index === mockRoteiro.length - 1 && "ml-1.5 md:ml-2"
                )}
              />

              {/* Content */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  "p-3 md:p-4 rounded-xl border bg-card ml-2 md:ml-4 cursor-pointer transition-shadow hover:shadow-md",
                  status.bg,
                  status.border
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-primary">
                        {item.time}
                      </span>
                      <span className="text-sm font-medium truncate">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.responsible}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.duration}
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold self-start",
                      status.bg,
                      status.color
                    )}
                  >
                    <StatusIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">{status.label}</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>

      <Button variant="ghost" className="w-full mt-2 text-primary hover:text-primary hover:bg-primary/5 rounded-xl">
        Ver roteiro completo
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </motion.div>
  );
}
