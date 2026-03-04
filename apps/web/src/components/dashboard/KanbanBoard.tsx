import { motion } from "framer-motion";
import { GripVertical, MoreVertical, User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

interface KanbanCard {
  id: string;
  title: string;
  category: string;
  author: string;
  priority: "low" | "medium" | "high";
}

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  cards: KanbanCard[];
}

const columns: KanbanColumn[] = [
  {
    id: "ideias",
    title: "Ideias",
    color: "bg-muted-foreground",
    cards: [
      {
        id: "1",
        title: "Matéria sobre nova ponte",
        category: "Infraestrutura",
        author: "João",
        priority: "medium",
      },
      {
        id: "2",
        title: "Evento cultural no centro",
        category: "Cultura",
        author: "Maria",
        priority: "low",
      },
    ],
  },
  {
    id: "rascunho",
    title: "Rascunho",
    color: "bg-warning",
    cards: [
      {
        id: "3",
        title: "Aumento do IPTU 2026",
        category: "Economia",
        author: "Carlos",
        priority: "high",
      },
      {
        id: "4",
        title: "Vacinação nas escolas",
        category: "Saúde",
        author: "Ana",
        priority: "medium",
      },
    ],
  },
  {
    id: "revisao",
    title: "Em Revisão",
    color: "bg-info",
    cards: [
      {
        id: "5",
        title: "Resultado eleições 2026",
        category: "Política",
        author: "Pedro",
        priority: "high",
      },
    ],
  },
  {
    id: "publicado",
    title: "Publicado",
    color: "bg-success",
    cards: [
      {
        id: "6",
        title: "Inauguração do hospital",
        category: "Saúde",
        author: "Maria",
        priority: "high",
      },
      {
        id: "7",
        title: "Campeonato de futebol",
        category: "Esportes",
        author: "João",
        priority: "medium",
      },
      {
        id: "8",
        title: "Feira do livro",
        category: "Cultura",
        author: "Ana",
        priority: "low",
      },
    ],
  },
];

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/15 text-warning border border-warning/30",
  high: "bg-destructive/15 text-destructive border border-destructive/30",
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function KanbanBoard() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-card rounded-2xl shadow-lg border border-border/50 p-4 md:p-6"
    >
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h3 className="text-lg font-bold">Fila de Conteúdo</h3>
          <p className="text-sm text-muted-foreground hidden sm:block">Arraste para reorganizar</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl">
          Ver Todos
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Mobile: Horizontal scroll / Desktop: Grid */}
      <div
        ref={scrollRef}
        className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar snap-x snap-mandatory md:snap-none"
      >
        {columns.map((column, colIndex) => (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: colIndex * 0.1 }}
            className="kanban-column min-w-[280px] md:min-w-0 snap-start"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className={cn("w-3 h-3 rounded-full", column.color)} />
              <h4 className="font-semibold text-sm">{column.title}</h4>
              <span className="ml-auto text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full font-medium">
                {column.cards.length}
              </span>
            </div>

            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                show: { transition: { staggerChildren: 0.05, delayChildren: colIndex * 0.1 } },
              }}
              className="space-y-2"
            >
              {column.cards.map((card) => (
                <motion.div
                  key={card.id}
                  variants={cardVariants}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="kanban-card group"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 cursor-grab flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{card.title}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {card.category}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                            priorityColors[card.priority]
                          )}
                        >
                          {card.priority === "high"
                            ? "Alta"
                            : card.priority === "medium"
                            ? "Média"
                            : "Baixa"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        {card.author}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
