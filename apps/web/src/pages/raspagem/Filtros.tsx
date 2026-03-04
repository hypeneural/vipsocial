import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Tag,
  AlertTriangle,
  Trash2,
  Edit,
  Copy,
  Zap,
  Search,
  Filter,
  ChevronRight,
  Globe,
  Hash,
  ArrowRight,
  ToggleLeft,
  Settings,
  Activity,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface Rule {
  id: string;
  name: string;
  condition: {
    type: "contains" | "domain" | "regex";
    value: string;
  };
  action: {
    type: "tag" | "priority" | "ignore" | "duplicate";
    value?: string;
  };
  active: boolean;
  matchCount: number;
}

const mockRules: Rule[] = [
  {
    id: "1",
    name: "Notícias de Economia",
    condition: { type: "contains", value: "economia, inflação, PIB" },
    action: { type: "tag", value: "economia" },
    active: true,
    matchCount: 234,
  },
  {
    id: "2",
    name: "Política Nacional",
    condition: { type: "contains", value: "governo, congresso, senado" },
    action: { type: "priority", value: "alta" },
    active: true,
    matchCount: 156,
  },
  {
    id: "3",
    name: "Ignorar Horóscopo",
    condition: { type: "contains", value: "horóscopo, signo, astrologia" },
    action: { type: "ignore" },
    active: true,
    matchCount: 89,
  },
  {
    id: "4",
    name: "Esportes",
    condition: { type: "domain", value: "espn.com.br, ge.globo.com" },
    action: { type: "tag", value: "esportes" },
    active: true,
    matchCount: 445,
  },
  {
    id: "5",
    name: "Fontes Não Confiáveis",
    condition: { type: "domain", value: "fake.news.com" },
    action: { type: "ignore" },
    active: false,
    matchCount: 0,
  },
];

const actionIcons = {
  tag: Tag,
  priority: Zap,
  ignore: AlertTriangle,
  duplicate: Copy,
};

const actionLabels = {
  tag: "Aplicar Tag",
  priority: "Prioridade",
  ignore: "Ignorar",
  duplicate: "Marcar Duplicado",
};

const actionColors = {
  tag: "bg-info/10 text-info border-info/30",
  priority: "bg-warning/10 text-warning border-warning/30",
  ignore: "bg-destructive/10 text-destructive border-destructive/30",
  duplicate: "bg-muted text-muted-foreground border-muted",
};

const RaspagemFiltros = () => {
  const [rules, setRules] = useState<Rule[]>(mockRules);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [dedupeThreshold, setDedupeThreshold] = useState([75]);

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  const activeRules = rules.filter((r) => r.active).length;
  const totalMatches = rules.reduce((acc, r) => acc + r.matchCount, 0);

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
            <h1 className="text-xl md:text-2xl font-bold">Filtros & Regras</h1>
            <p className="text-sm text-muted-foreground">
              Automatize a classificação de conteúdo
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-dark rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Criar Nova Regra</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome da Regra</Label>
                  <Input placeholder="Ex: Notícias de Economia" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Condição</Label>
                  <Select defaultValue="contains">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">Contém palavras</SelectItem>
                      <SelectItem value="domain">Domínio específico</SelectItem>
                      <SelectItem value="regex">Expressão Regular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input placeholder="economia, inflação, PIB" />
                  <p className="text-xs text-muted-foreground">
                    Separe múltiplos valores com vírgula
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Ação</Label>
                  <Select defaultValue="tag">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tag">Aplicar Tag</SelectItem>
                      <SelectItem value="priority">Definir Prioridade Alta</SelectItem>
                      <SelectItem value="ignore">Ignorar</SelectItem>
                      <SelectItem value="duplicate">Marcar como Duplicado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tag (se aplicável)</Label>
                  <Input placeholder="economia" />
                </div>
                <Button className="w-full" onClick={() => setIsAddDialogOpen(false)}>
                  Criar Regra
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="rules" className="rounded-lg py-2">
            <Filter className="w-4 h-4 mr-2" />
            Regras
          </TabsTrigger>
          <TabsTrigger value="dedupe" className="rounded-lg py-2">
            <Copy className="w-4 h-4 mr-2" />
            Dedupe
          </TabsTrigger>
          <TabsTrigger value="monitor" className="rounded-lg py-2">
            <Activity className="w-4 h-4 mr-2" />
            Monitor
          </TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-4 border border-border/50"
            >
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <ToggleLeft className="w-4 h-4" />
                Regras Ativas
              </div>
              <p className="text-2xl font-bold mt-1">
                {activeRules}/{rules.length}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-primary/10 rounded-xl p-4 border border-primary/30"
            >
              <div className="flex items-center gap-2 text-primary text-sm">
                <Zap className="w-4 h-4" />
                Matches Hoje
              </div>
              <p className="text-2xl font-bold mt-1 text-primary">
                {totalMatches.toLocaleString()}
              </p>
            </motion.div>
          </div>

          {/* Rules List */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            className="space-y-3"
          >
            {rules.map((rule, index) => {
              const ActionIcon = actionIcons[rule.action.type];

              return (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "bg-card rounded-2xl border p-4 transition-all",
                    !rule.active && "opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{rule.name}</h3>
                        <Badge className="text-[10px] rounded-full bg-muted text-muted-foreground">
                          {rule.matchCount} matches
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mt-3 flex-wrap text-sm">
                        <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-lg">
                          {rule.condition.type === "contains" && <Hash className="w-3 h-3" />}
                          {rule.condition.type === "domain" && <Globe className="w-3 h-3" />}
                          <span className="text-xs">
                            {rule.condition.type === "contains"
                              ? "Contém"
                              : rule.condition.type === "domain"
                              ? "Domínio"
                              : "Regex"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground truncate max-w-[150px] md:max-w-[300px]">
                          {rule.condition.value}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <Badge
                          className={cn(
                            "text-[10px] rounded-full",
                            actionColors[rule.action.type]
                          )}
                        >
                          <ActionIcon className="w-3 h-3 mr-1" />
                          {actionLabels[rule.action.type]}
                          {rule.action.value && `: ${rule.action.value}`}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.active}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </TabsContent>

        {/* Dedupe Tab */}
        <TabsContent value="dedupe" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border/50 p-6"
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Copy className="w-5 h-5 text-primary" />
              Detecção de Duplicados
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Configura o limiar de similaridade para detectar notícias duplicadas automaticamente.
            </p>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Limiar de Similaridade</Label>
                  <span className="text-2xl font-bold text-primary">{dedupeThreshold[0]}%</span>
                </div>
                <Slider
                  value={dedupeThreshold}
                  onValueChange={setDedupeThreshold}
                  max={100}
                  min={50}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Menos restritivo</span>
                  <span>Mais restritivo</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">Duplicados detectados hoje</p>
                  <p className="text-2xl font-bold mt-1">47</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">Agrupamentos criados</p>
                  <p className="text-2xl font-bold mt-1">12</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-warning/10 border border-warning/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <div>
                    <p className="font-medium">Auto-agrupar duplicados</p>
                    <p className="text-xs text-muted-foreground">
                      Agrupa automaticamente notícias similares
                    </p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Monitor Tab */}
        <TabsContent value="monitor" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border/50 p-6"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Erros Recentes
              </h3>
              <div className="space-y-3">
                {[
                  { source: "UOL Notícias", error: "Timeout após 30s", time: "1h atrás" },
                  { source: "Portal Local", error: "Seletor não encontrado", time: "3h atrás" },
                  { source: "Folha", error: "Rate limit excedido", time: "5h atrás" },
                ].map((error, i) => (
                  <div
                    key={i}
                    className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{error.source}</span>
                      <span className="text-xs text-muted-foreground">{error.time}</span>
                    </div>
                    <p className="text-xs text-destructive mt-1">{error.error}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl border border-border/50 p-6"
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-success" />
                Performance
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tempo médio de coleta</span>
                    <span className="font-bold">1.2s</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <div className="h-full w-1/4 bg-success rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Itens processados/min</span>
                    <span className="font-bold">12.5</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <div className="h-full w-3/4 bg-primary rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de sucesso</span>
                    <span className="font-bold text-success">94.2%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <div className="h-full w-[94%] bg-success rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

export default RaspagemFiltros;
