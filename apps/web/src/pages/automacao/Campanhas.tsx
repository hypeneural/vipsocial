import { useState } from "react";
import { motion } from "framer-motion";
import {
    Plus,
    Search,
    Calendar,
    Clock,
    Play,
    Pause,
    MoreVertical,
    Edit,
    Copy,
    Trash2,
    Send,
    Users,
    Bell,
    RefreshCw,
    CheckCircle2,
    Timer,
    Repeat,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
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
    DropdownMenuSeparator,
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

interface Campaign {
    id: string;
    name: string;
    description: string;
    template: string;
    schedule: {
        type: "daily" | "weekly" | "custom";
        time: string;
        days?: string[];
    };
    groups: string[];
    status: "active" | "paused" | "scheduled";
    lastRun?: string;
    nextRun: string;
    successRate: number;
    totalSent: number;
}

const mockCampaigns: Campaign[] = [
    {
        id: "1",
        name: "Bom Dia VIP",
        description: "Envio diário das principais manchetes do dia",
        template: "Bom Dia VIP",
        schedule: { type: "daily", time: "07:00" },
        groups: ["VIP Social - Notícias Geral", "VIP Campinas"],
        status: "active",
        lastRun: "Hoje, 07:00",
        nextRun: "Amanhã, 07:00",
        successRate: 98.5,
        totalSent: 1250,
    },
    {
        id: "2",
        name: "Resumo do Dia",
        description: "Compilado das notícias do dia ao final da tarde",
        template: "Resumo do Dia",
        schedule: { type: "daily", time: "18:00" },
        groups: ["VIP Social - Notícias Geral"],
        status: "active",
        lastRun: "Ontem, 18:00",
        nextRun: "Hoje, 18:00",
        successRate: 97.2,
        totalSent: 890,
    },
    {
        id: "3",
        name: "Alerta Semanal",
        description: "Resumo semanal enviado toda segunda-feira",
        template: "Resumo Semanal",
        schedule: { type: "weekly", time: "09:00", days: ["Segunda"] },
        groups: ["Parceiros - Assessorias"],
        status: "paused",
        lastRun: "Seg, 13/01, 09:00",
        nextRun: "Seg, 27/01, 09:00",
        successRate: 95.0,
        totalSent: 45,
    },
    {
        id: "4",
        name: "Enquete Semanal",
        description: "Disparo de enquete toda sexta-feira",
        template: "Enquete",
        schedule: { type: "weekly", time: "10:00", days: ["Sexta"] },
        groups: ["VIP Social - Notícias Geral", "Guarulhos News"],
        status: "scheduled",
        nextRun: "Sex, 24/01, 10:00",
        successRate: 0,
        totalSent: 0,
    },
];

const statusConfig = {
    active: { label: "Ativa", color: "bg-success/15 text-success border-success/30", indicator: "online" as const },
    paused: { label: "Pausada", color: "bg-warning/15 text-warning border-warning/30", indicator: "warning" as const },
    scheduled: { label: "Agendada", color: "bg-info/15 text-info border-info/30", indicator: "loading" as const },
};

const Campanhas = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const filteredCampaigns = campaigns.filter((campaign) => {
        if (searchQuery && !campaign.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const toggleCampaign = (id: string) => {
        setCampaigns((prev) =>
            prev.map((c) =>
                c.id === id
                    ? { ...c, status: c.status === "active" ? "paused" : "active" }
                    : c
            )
        );
    };

    const activeCount = campaigns.filter((c) => c.status === "active").length;
    const totalSent = campaigns.reduce((acc, c) => acc + c.totalSent, 0);

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
                        <h1 className="text-xl md:text-2xl font-bold">Campanhas & Rotinas</h1>
                        <p className="text-sm text-muted-foreground">
                            Agendamentos recorrentes de mensagens
                        </p>
                    </div>

                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary-dark rounded-xl">
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Campanha
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px]">
                            <DialogHeader>
                                <DialogTitle>Criar Campanha</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nome da Campanha</Label>
                                    <Input placeholder="Ex: Bom Dia VIP" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Descrição</Label>
                                    <Input placeholder="Breve descrição do objetivo" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Template</Label>
                                        <Select>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bom-dia">Bom Dia VIP</SelectItem>
                                                <SelectItem value="resumo">Resumo do Dia</SelectItem>
                                                <SelectItem value="alerta">Alerta Urgente</SelectItem>
                                                <SelectItem value="enquete">Enquete</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Frequência</Label>
                                        <Select defaultValue="daily">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">Diário</SelectItem>
                                                <SelectItem value="weekly">Semanal</SelectItem>
                                                <SelectItem value="custom">Personalizado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Horário de Envio</Label>
                                    <Input type="time" defaultValue="07:00" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Grupos Destinatários</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione os grupos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os grupos</SelectItem>
                                            <SelectItem value="vip">VIP Social - Notícias Geral</SelectItem>
                                            <SelectItem value="campinas">VIP Campinas</SelectItem>
                                            <SelectItem value="parceiros">Parceiros - Assessorias</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button className="w-full" onClick={() => setIsCreateDialogOpen(false)}>
                                    Criar Campanha
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
                        <Repeat className="w-4 h-4" />
                        Total
                    </div>
                    <p className="text-2xl font-bold mt-1">{campaigns.length}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-success/10 rounded-xl p-4 border border-success/30"
                >
                    <div className="flex items-center gap-2 text-success text-sm">
                        <Play className="w-4 h-4" />
                        Ativas
                    </div>
                    <p className="text-2xl font-bold mt-1 text-success">{activeCount}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-primary/10 rounded-xl p-4 border border-primary/30"
                >
                    <div className="flex items-center gap-2 text-primary text-sm">
                        <Send className="w-4 h-4" />
                        Enviadas
                    </div>
                    <p className="text-2xl font-bold mt-1 text-primary">{totalSent.toLocaleString()}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-info/10 rounded-xl p-4 border border-info/30"
                >
                    <div className="flex items-center gap-2 text-info text-sm">
                        <Timer className="w-4 h-4" />
                        Próximo Envio
                    </div>
                    <p className="text-sm font-bold mt-1 text-info">Hoje, 18:00</p>
                </motion.div>
            </div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
            >
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar campanhas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-xl bg-secondary/50"
                    />
                </div>
            </motion.div>

            {/* Campaigns List */}
            <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                className="space-y-4 pb-20 md:pb-0"
            >
                {filteredCampaigns.map((campaign, index) => {
                    const config = statusConfig[campaign.status];

                    return (
                        <motion.div
                            key={campaign.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-md transition-all"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <StatusIndicator status={config.indicator} size="md" />
                                        <h3 className="font-semibold text-lg">{campaign.name}</h3>
                                        <Badge className={cn("text-xs rounded-full", config.color)}>
                                            {config.label}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {campaign.description}
                                    </p>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground text-xs mb-1">Template</p>
                                            <p className="font-medium">{campaign.template}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs mb-1">Horário</p>
                                            <p className="font-medium flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {campaign.schedule.time}
                                                <span className="text-muted-foreground">
                                                    ({campaign.schedule.type === "daily" ? "Diário" : "Semanal"})
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs mb-1">Próximo Envio</p>
                                            <p className="font-medium flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {campaign.nextRun}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs mb-1">Taxa de Sucesso</p>
                                            <p className="font-medium text-success">{campaign.successRate}%</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-3">
                                        <Users className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                            {campaign.groups.join(", ")}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {campaign.status === "active" ? "Ativa" : "Pausada"}
                                        </span>
                                        <Switch
                                            checked={campaign.status === "active"}
                                            onCheckedChange={() => toggleCampaign(campaign.id)}
                                            disabled={campaign.status === "scheduled"}
                                        />
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Copy className="w-4 h-4 mr-2" />
                                                Duplicar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Send className="w-4 h-4 mr-2" />
                                                Executar Agora
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive">
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {filteredCampaigns.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="empty-state"
                    >
                        <Repeat className="empty-state-icon" />
                        <p className="text-muted-foreground">Nenhuma campanha encontrada</p>
                    </motion.div>
                )}
            </motion.div>
        </AppShell>
    );
};

export default Campanhas;
