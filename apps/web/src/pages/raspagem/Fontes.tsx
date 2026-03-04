import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Settings,
  Trash2,
  Edit,
  MoreVertical,
  RefreshCw,
  Zap,
  TrendingUp,
  ExternalLink,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Source {
  id: string;
  name: string;
  url: string;
  frequency: string;
  selector?: string;
  status: "ok" | "error" | "pending";
  lastCollection: string;
  itemsCollected: number;
  avgResponseTime: string;
  active: boolean;
  errorMessage?: string;
}

const mockSources: Source[] = [
  {
    id: "1",
    name: "G1 - Economia",
    url: "g1.globo.com/economia",
    frequency: "5 min",
    selector: ".feed-post-body",
    status: "ok",
    lastCollection: "2 min atrás",
    itemsCollected: 1245,
    avgResponseTime: "0.8s",
    active: true,
  },
  {
    id: "2",
    name: "Folha de São Paulo",
    url: "folha.uol.com.br",
    frequency: "10 min",
    selector: ".c-headline__title",
    status: "ok",
    lastCollection: "5 min atrás",
    itemsCollected: 892,
    avgResponseTime: "1.2s",
    active: true,
  },
  {
    id: "3",
    name: "UOL Notícias",
    url: "noticias.uol.com.br",
    frequency: "5 min",
    status: "error",
    lastCollection: "1h atrás",
    itemsCollected: 0,
    avgResponseTime: "-",
    active: true,
    errorMessage: "Timeout após 30s - Verificar seletor CSS",
  },
  {
    id: "4",
    name: "Estadão",
    url: "estadao.com.br",
    frequency: "15 min",
    selector: ".title",
    status: "ok",
    lastCollection: "8 min atrás",
    itemsCollected: 567,
    avgResponseTime: "1.5s",
    active: true,
  },
  {
    id: "5",
    name: "Portal Local",
    url: "portallocal.com.br",
    frequency: "30 min",
    status: "pending",
    lastCollection: "Nunca",
    itemsCollected: 0,
    avgResponseTime: "-",
    active: false,
  },
];

const statusConfig = {
  ok: {
    icon: CheckCircle2,
    label: "OK",
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
  },
  error: {
    icon: XCircle,
    label: "Erro",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
  },
  pending: {
    icon: AlertCircle,
    label: "Pendente",
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-muted",
  },
};

const RaspagemFontes = () => {
  const [sources, setSources] = useState<Source[]>(mockSources);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSource, setNewSource] = useState({
    name: "",
    url: "",
    frequency: "5",
    selector: "",
  });

  const filteredSources = sources.filter(
    (source) =>
      source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSource = (id: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const healthySources = sources.filter((s) => s.status === "ok").length;
  const errorSources = sources.filter((s) => s.status === "error").length;

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
            <h1 className="text-xl md:text-2xl font-bold">Fontes de Raspagem</h1>
            <p className="text-sm text-muted-foreground">
              {sources.length} fontes configuradas
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-dark rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Nova Fonte
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Fonte</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome da Fonte</Label>
                  <Input
                    placeholder="Ex: G1 Economia"
                    value={newSource.name}
                    onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    placeholder="https://exemplo.com"
                    value={newSource.url}
                    onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequência</Label>
                    <Select
                      value={newSource.frequency}
                      onValueChange={(v) => setNewSource({ ...newSource, frequency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutos</SelectItem>
                        <SelectItem value="10">10 minutos</SelectItem>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Seletor CSS (opcional)</Label>
                    <Input
                      placeholder=".article-title"
                      value={newSource.selector}
                      onChange={(e) => setNewSource({ ...newSource, selector: e.target.value })}
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={() => setIsAddDialogOpen(false)}>
                  Adicionar Fonte
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-4 border border-border/50"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Globe className="w-4 h-4" />
            Total
          </div>
          <p className="text-2xl font-bold mt-1">{sources.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-success/10 rounded-xl p-4 border border-success/30"
        >
          <div className="flex items-center gap-2 text-success text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Saudáveis
          </div>
          <p className="text-2xl font-bold mt-1 text-success">{healthySources}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-destructive/10 rounded-xl p-4 border border-destructive/30"
        >
          <div className="flex items-center gap-2 text-destructive text-sm">
            <XCircle className="w-4 h-4" />
            Com Erro
          </div>
          <p className="text-2xl font-bold mt-1 text-destructive">{errorSources}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl p-4 border border-border/50"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <TrendingUp className="w-4 h-4" />
            Itens Hoje
          </div>
          <p className="text-2xl font-bold mt-1">2.7k</p>
        </motion.div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar fontes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-secondary/50"
          />
        </div>
      </div>

      {/* Sources List */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        className="space-y-3 pb-20 md:pb-0"
      >
        {filteredSources.map((source, index) => {
          const status = statusConfig[source.status];
          const StatusIcon = status.icon;

          return (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "bg-card rounded-2xl border p-4 transition-all",
                !source.active && "opacity-60",
                source.status === "error" ? "border-destructive/30" : "border-border/50"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{source.name}</h3>
                    <Badge
                      className={cn(
                        "text-[10px] rounded-full",
                        status.bg,
                        status.color,
                        status.border
                      )}
                    >
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Globe className="w-3 h-3" />
                    <span className="truncate">{source.url}</span>
                  </div>

                  {source.errorMessage && (
                    <div className="mt-2 p-2 bg-destructive/10 rounded-lg text-xs text-destructive">
                      {source.errorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Frequência</span>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {source.frequency}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Última Coleta</span>
                      <p className="font-medium">{source.lastCollection}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Itens Coletados</span>
                      <p className="font-medium">{source.itemsCollected.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tempo Médio</span>
                      <p className="font-medium flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {source.avgResponseTime}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={source.active}
                    onCheckedChange={() => toggleSource(source.id)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Testar Agora
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir Site
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </AppShell>
  );
};

export default RaspagemFontes;
