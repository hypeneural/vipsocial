import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rss,
  ExternalLink,
  FileEdit,
  X,
  Tag,
  AlertTriangle,
  Star,
  Copy,
  Filter,
  RefreshCw,
  Clock,
  Globe,
  Image as ImageIcon,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ScrapedItem {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  timestamp: string;
  excerpt: string;
  imageUrl?: string;
  isNew?: boolean;
  isDuplicate?: boolean;
  isHighRelevance?: boolean;
  tags?: string[];
}

const mockItems: ScrapedItem[] = [
  {
    id: "1",
    title: "Governo anuncia novo pacote de medidas econômicas para estimular crescimento",
    source: "G1",
    sourceUrl: "g1.globo.com",
    timestamp: "2 min",
    excerpt: "O governo federal anunciou nesta segunda-feira um novo pacote de medidas para estimular a economia brasileira, incluindo redução de impostos e incentivos fiscais para empresas.",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&h=120&fit=crop",
    isNew: true,
    isHighRelevance: true,
    tags: ["economia", "governo"],
  },
  {
    id: "2",
    title: "Previsão indica chuvas fortes para o final de semana em toda região",
    source: "Climatempo",
    sourceUrl: "climatempo.com.br",
    timestamp: "5 min",
    excerpt: "Meteorologistas alertam para a possibilidade de chuvas intensas na região metropolitana durante o próximo final de semana.",
    isNew: true,
    tags: ["clima"],
  },
  {
    id: "3",
    title: "Time local vence e avança na Copa do Brasil após partida emocionante",
    source: "ESPN",
    sourceUrl: "espn.com.br",
    timestamp: "8 min",
    excerpt: "Com gol nos acréscimos, equipe garantiu classificação para as quartas de final da competição nacional.",
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=120&fit=crop",
    isDuplicate: true,
    tags: ["esportes", "futebol"],
  },
  {
    id: "4",
    title: "Nova linha de ônibus começa a operar amanhã ligando centro ao distrito industrial",
    source: "Folha Local",
    sourceUrl: "folhalocal.com.br",
    timestamp: "12 min",
    excerpt: "A nova linha que liga o centro ao distrito industrial terá horários estendidos durante a semana.",
    tags: ["transporte", "cidade"],
  },
  {
    id: "5",
    title: "Prefeitura abre inscrições para programa de capacitação profissional gratuito",
    source: "Portal Municipal",
    sourceUrl: "prefeitura.gov.br",
    timestamp: "15 min",
    excerpt: "São oferecidas 500 vagas em cursos de tecnologia, administração e serviços.",
    isHighRelevance: true,
    tags: ["educação", "emprego"],
  },
  {
    id: "6",
    title: "Feira de artesanato local acontece neste domingo na praça central",
    source: "Agenda Cultural",
    sourceUrl: "agendacultural.com.br",
    timestamp: "20 min",
    excerpt: "Mais de 50 artesãos locais participarão do evento com produtos exclusivos.",
    imageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=120&fit=crop",
    tags: ["cultura", "eventos"],
  },
];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -100 },
};

const statsData = [
  { label: "Itens/min", value: "12", icon: TrendingUp, color: "text-success" },
  { label: "Tempo médio", value: "1.2s", icon: Clock, color: "text-info" },
  { label: "Na fila", value: "34", icon: Rss, color: "text-warning" },
];

const RaspagemFeed = () => {
  const [items, setItems] = useState<ScrapedItem[]>(mockItems);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  const filteredItems = items.filter((item) => {
    if (filter === "new" && !item.isNew) return false;
    if (filter === "duplicate" && !item.isDuplicate) return false;
    if (filter === "high" && !item.isHighRelevance) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleDismiss = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <AppShell>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-3 h-3 rounded-full bg-success"
              />
              <h1 className="text-xl md:text-2xl font-bold">Feed ao Vivo</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Monitorando {items.length} fontes em tempo real
            </p>
          </div>

          <Button
            onClick={handleRefresh}
            variant="outline"
            className="rounded-xl"
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-xl p-3 md:p-4 border border-border/50 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <stat.icon className={cn("w-4 h-4", stat.color)} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-lg md:text-xl font-bold mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col md:flex-row gap-3 mb-6"
      >
        <div className="flex-1">
          <Input
            placeholder="Buscar notícias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl bg-secondary/50"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-[180px] rounded-xl">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="new">Novos</SelectItem>
            <SelectItem value="duplicate">Duplicados</SelectItem>
            <SelectItem value="high">Alta Relevância</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Feed Items */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        className="space-y-3 pb-20 md:pb-0"
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              layout
              exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
              whileHover={{ scale: 1.01 }}
              className={cn(
                "bg-card rounded-2xl border shadow-sm overflow-hidden transition-all",
                item.isDuplicate
                  ? "border-warning/50 bg-warning/5"
                  : item.isHighRelevance
                  ? "border-primary/50 bg-primary/5"
                  : "border-border/50 hover:border-primary/30 hover:shadow-md"
              )}
            >
              <div className="p-4">
                {/* Badges Row */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {item.isNew && (
                    <Badge className="bg-success/15 text-success border-success/30 text-[10px] rounded-full">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Novo
                    </Badge>
                  )}
                  {item.isDuplicate && (
                    <Badge variant="outline" className="border-warning text-warning bg-warning/10 text-[10px] rounded-full">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Duplicado?
                    </Badge>
                  )}
                  {item.isHighRelevance && (
                    <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] rounded-full">
                      <Star className="w-3 h-3 mr-1" />
                      Alta Relevância
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="flex gap-4">
                  {item.imageUrl && (
                    <div className="hidden sm:block flex-shrink-0">
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-24 h-16 md:w-32 md:h-20 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm md:text-base line-clamp-2 mb-1">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span className="font-medium text-foreground/80">{item.source}</span>
                      </span>
                      <span>•</span>
                      <span>{item.sourceUrl}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.timestamp} atrás
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 hidden md:block">
                      {item.excerpt}
                    </p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        {item.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px] rounded-full px-2 py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50 flex-wrap">
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-primary hover:bg-primary-dark rounded-lg flex-1 sm:flex-none"
                  >
                    <FileEdit className="w-3 h-3 mr-1" />
                    Criar Rascunho
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg">
                    <Tag className="w-3 h-3 mr-1" />
                    Tags
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg">
                    <Copy className="w-3 h-3 mr-1" />
                    Duplicado
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-muted-foreground rounded-lg"
                    onClick={() => handleDismiss(item.id)}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Ignorar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground ml-auto"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Rss className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma notícia encontrada</p>
            <p className="text-sm text-muted-foreground/70">Tente ajustar os filtros</p>
          </motion.div>
        )}
      </motion.div>
    </AppShell>
  );
};

export default RaspagemFeed;
