import { motion, AnimatePresence } from "framer-motion";
import { Rss, ExternalLink, FileEdit, X, Tag, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScrapedItem {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  timestamp: string;
  excerpt: string;
  isDuplicate?: boolean;
}

const mockItems: ScrapedItem[] = [
  {
    id: "1",
    title: "Governo anuncia novo pacote de medidas econômicas",
    source: "G1",
    sourceUrl: "g1.globo.com",
    timestamp: "2 min",
    excerpt:
      "O governo federal anunciou nesta segunda-feira um novo pacote de medidas para estimular a economia...",
  },
  {
    id: "2",
    title: "Previsão indica chuvas fortes para o final de semana",
    source: "Climatempo",
    sourceUrl: "climatempo.com.br",
    timestamp: "5 min",
    excerpt:
      "Meteorologistas alertam para a possibilidade de chuvas intensas na região metropolitana...",
  },
  {
    id: "3",
    title: "Time local vence e avança na Copa do Brasil",
    source: "ESPN",
    sourceUrl: "espn.com.br",
    timestamp: "8 min",
    excerpt: "Com gol nos acréscimos, equipe garantiu classificação para as quartas de final...",
    isDuplicate: true,
  },
  {
    id: "4",
    title: "Nova linha de ônibus começa a operar amanhã",
    source: "Folha Local",
    sourceUrl: "folhalocal.com.br",
    timestamp: "12 min",
    excerpt:
      "A nova linha que liga o centro ao distrito industrial terá horários estendidos...",
  },
];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -100 },
};

export function ScrapingFeed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-card rounded-2xl shadow-lg border border-border/50 p-4 md:p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2.5 h-2.5 rounded-full bg-success"
          />
          <h3 className="text-lg font-bold">Feed de Raspagem</h3>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl">
          <Rss className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Ver Todos</span>
        </Button>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          show: { transition: { staggerChildren: 0.1 } },
        }}
        className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar"
      >
        <AnimatePresence>
          {mockItems.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              layout
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "p-3 md:p-4 rounded-xl border transition-all cursor-pointer",
                item.isDuplicate
                  ? "border-warning/50 bg-warning/5"
                  : "border-border/50 hover:border-primary/30 hover:shadow-md bg-card"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  {item.isDuplicate && (
                    <div className="flex items-center gap-1 mb-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] border-warning text-warning bg-warning/10 rounded-full"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Possível duplicado
                      </Badge>
                    </div>
                  )}
                  <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="font-semibold text-foreground/80">{item.source}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{item.sourceUrl}</span>
                    <span>•</span>
                    <span>{item.timestamp} atrás</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 hidden sm:block">
                    {item.excerpt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                <Button
                  size="sm"
                  className="h-8 text-xs bg-primary hover:bg-primary-dark rounded-lg flex-1 sm:flex-none"
                >
                  <FileEdit className="w-3 h-3 mr-1" />
                  Criar Rascunho
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg hidden sm:flex">
                  <Tag className="w-3 h-3 mr-1" />
                  Tags
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground rounded-lg">
                  <X className="w-3 h-3 sm:mr-1" />
                  <span className="hidden sm:inline">Ignorar</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground ml-auto"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
