import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    Filter,
    Vote,
    ChevronDown,
    ChevronRight,
    BarChart3,
    Calendar,
    Clock,
    Users,
    MoreVertical,
    Edit,
    Copy,
    Trash2,
    Share2,
    ExternalLink,
    MessageCircle,
    Sparkles,
    Play,
    Pause,
    CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PollOption {
    id: string;
    text: string;
    votes: number;
    percentage: number;
}

interface Poll {
    id: string;
    question: string;
    options: PollOption[];
    status: "active" | "scheduled" | "ended" | "draft";
    totalVotes: number;
    startDate: string;
    endDate: string;
    createdBy: string;
    channels: string[];
    allowMultiple: boolean;
}

const mockPolls: Poll[] = [
    {
        id: "1",
        question: "Qual a prioridade para melhorias na cidade?",
        options: [
            { id: "1a", text: "Transporte público", votes: 1250, percentage: 42 },
            { id: "1b", text: "Saúde", votes: 980, percentage: 33 },
            { id: "1c", text: "Educação", votes: 520, percentage: 17 },
            { id: "1d", text: "Segurança", votes: 250, percentage: 8 },
        ],
        status: "active",
        totalVotes: 3000,
        startDate: "2026-01-15",
        endDate: "2026-01-25",
        createdBy: "Maria Santos",
        channels: ["WhatsApp", "Portal", "App"],
        allowMultiple: false,
    },
    {
        id: "2",
        question: "Você é favorável à nova ciclovia na Av. Principal?",
        options: [
            { id: "2a", text: "Sim, totalmente", votes: 450, percentage: 60 },
            { id: "2b", text: "Parcialmente", votes: 180, percentage: 24 },
            { id: "2c", text: "Não", votes: 120, percentage: 16 },
        ],
        status: "active",
        totalVotes: 750,
        startDate: "2026-01-18",
        endDate: "2026-01-28",
        createdBy: "Carlos Oliveira",
        channels: ["WhatsApp", "Portal"],
        allowMultiple: false,
    },
    {
        id: "3",
        question: "Como você avalia os serviços públicos em 2025?",
        options: [
            { id: "3a", text: "Excelente", votes: 120, percentage: 8 },
            { id: "3b", text: "Bom", votes: 380, percentage: 25 },
            { id: "3c", text: "Regular", votes: 520, percentage: 35 },
            { id: "3d", text: "Ruim", votes: 480, percentage: 32 },
        ],
        status: "ended",
        totalVotes: 1500,
        startDate: "2025-12-01",
        endDate: "2025-12-31",
        createdBy: "Ana Costa",
        channels: ["Portal"],
        allowMultiple: false,
    },
    {
        id: "4",
        question: "Qual evento cultural você gostaria de ver na cidade?",
        options: [
            { id: "4a", text: "Festival de música", votes: 0, percentage: 0 },
            { id: "4b", text: "Feira gastronômica", votes: 0, percentage: 0 },
            { id: "4c", text: "Mostra de cinema", votes: 0, percentage: 0 },
            { id: "4d", text: "Exposição de arte", votes: 0, percentage: 0 },
        ],
        status: "scheduled",
        totalVotes: 0,
        startDate: "2026-02-01",
        endDate: "2026-02-15",
        createdBy: "Pedro Almeida",
        channels: ["WhatsApp", "Portal", "App"],
        allowMultiple: true,
    },
    {
        id: "5",
        question: "Rascunho: Preferência de horário para eventos",
        options: [
            { id: "5a", text: "Manhã", votes: 0, percentage: 0 },
            { id: "5b", text: "Tarde", votes: 0, percentage: 0 },
            { id: "5c", text: "Noite", votes: 0, percentage: 0 },
        ],
        status: "draft",
        totalVotes: 0,
        startDate: "",
        endDate: "",
        createdBy: "Maria Santos",
        channels: [],
        allowMultiple: false,
    },
];

const statusConfig = {
    active: {
        label: "Ativa",
        color: "bg-success/15 text-success border-success/30",
        indicator: "online" as const,
    },
    scheduled: {
        label: "Agendada",
        color: "bg-info/15 text-info border-info/30",
        indicator: "loading" as const,
    },
    ended: {
        label: "Encerrada",
        color: "bg-muted text-muted-foreground border-muted",
        indicator: "offline" as const,
    },
    draft: {
        label: "Rascunho",
        color: "bg-warning/15 text-warning border-warning/30",
        indicator: "warning" as const,
    },
};

const Enquetes = () => {
    const [polls] = useState<Poll[]>(mockPolls);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const filteredPolls = polls.filter((poll) => {
        if (searchQuery && !poll.question.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterStatus !== "all" && poll.status !== filterStatus) return false;
        return true;
    });

    const activeCount = polls.filter((p) => p.status === "active").length;
    const totalVotesAllPolls = polls.reduce((acc, p) => acc + p.totalVotes, 0);

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
                        <h1 className="text-xl md:text-2xl font-bold">Enquetes</h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie suas enquetes e visualize resultados
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" className="rounded-xl">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Criar com IA
                        </Button>
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary hover:bg-primary-dark rounded-xl">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Nova Enquete
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>Criar Nova Enquete</DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                    <p className="text-sm text-muted-foreground">
                                        Formulário de criação será implementado aqui.
                                    </p>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
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
                        <Vote className="w-4 h-4" />
                        Total
                    </div>
                    <p className="text-2xl font-bold mt-1">{polls.length}</p>
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
                        <Users className="w-4 h-4" />
                        Total Votos
                    </div>
                    <p className="text-2xl font-bold mt-1 text-primary">
                        {totalVotesAllPolls.toLocaleString()}
                    </p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-info/10 rounded-xl p-4 border border-info/30"
                >
                    <div className="flex items-center gap-2 text-info text-sm">
                        <Calendar className="w-4 h-4" />
                        Agendadas
                    </div>
                    <p className="text-2xl font-bold mt-1 text-info">
                        {polls.filter((p) => p.status === "scheduled").length}
                    </p>
                </motion.div>
            </div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col md:flex-row gap-3 mb-6"
            >
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar enquetes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-xl bg-secondary/50"
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-[150px] rounded-xl">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativas</SelectItem>
                        <SelectItem value="scheduled">Agendadas</SelectItem>
                        <SelectItem value="ended">Encerradas</SelectItem>
                        <SelectItem value="draft">Rascunhos</SelectItem>
                    </SelectContent>
                </Select>
            </motion.div>

            {/* Polls Accordion List */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="pb-20 md:pb-0"
            >
                <Accordion type="single" collapsible className="space-y-3">
                    {filteredPolls.map((poll, index) => {
                        const config = statusConfig[poll.status];

                        return (
                            <motion.div
                                key={poll.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <AccordionItem
                                    value={poll.id}
                                    className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <AccordionTrigger className="px-4 py-4 hover:no-underline">
                                        <div className="flex items-start gap-4 w-full text-left">
                                            <StatusIndicator status={config.indicator} size="md" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <Badge className={cn("text-[10px] rounded-full", config.color)}>
                                                        {config.label}
                                                    </Badge>
                                                    {poll.allowMultiple && (
                                                        <Badge variant="outline" className="text-[10px] rounded-full">
                                                            Múltipla escolha
                                                        </Badge>
                                                    )}
                                                </div>
                                                <h3 className="font-semibold text-sm md:text-base line-clamp-2">
                                                    {poll.question}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3 h-3" />
                                                        {poll.totalVotes.toLocaleString()} votos
                                                    </span>
                                                    {poll.startDate && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(poll.startDate).toLocaleDateString("pt-BR")}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <MessageCircle className="w-3 h-3" />
                                                        {poll.channels.length} canais
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4">
                                        {/* Options with Progress Bars */}
                                        <div className="space-y-3 mb-4">
                                            {poll.options.map((option) => (
                                                <div key={option.id} className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span>{option.text}</span>
                                                        <span className="font-semibold">{option.percentage}%</span>
                                                    </div>
                                                    <Progress
                                                        value={option.percentage}
                                                        className="h-2"
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        {option.votes.toLocaleString()} votos
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Channels */}
                                        {poll.channels.length > 0 && (
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-xs text-muted-foreground">Canais:</span>
                                                {poll.channels.map((channel) => (
                                                    <Badge key={channel} variant="secondary" className="text-[10px]">
                                                        {channel}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-3 border-t border-border/50 flex-wrap">
                                            <Button
                                                size="sm"
                                                className="h-8 text-xs rounded-lg"
                                                onClick={() => window.location.href = `/engajamento/enquetes/${poll.id}/resultados`}
                                            >
                                                <BarChart3 className="w-3 h-3 mr-1" />
                                                Ver Resultados
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg">
                                                <Share2 className="w-3 h-3 mr-1" />
                                                Embed
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg">
                                                <MessageCircle className="w-3 h-3 mr-1" />
                                                WhatsApp
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 ml-auto">
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
                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                        Abrir no Portal
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {poll.status === "active" ? (
                                                        <DropdownMenuItem>
                                                            <Pause className="w-4 h-4 mr-2" />
                                                            Encerrar
                                                        </DropdownMenuItem>
                                                    ) : poll.status === "draft" || poll.status === "scheduled" ? (
                                                        <DropdownMenuItem>
                                                            <Play className="w-4 h-4 mr-2" />
                                                            Ativar
                                                        </DropdownMenuItem>
                                                    ) : null}
                                                    <DropdownMenuItem className="text-destructive">
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </motion.div>
                        );
                    })}
                </Accordion>

                {filteredPolls.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="empty-state"
                    >
                        <Vote className="empty-state-icon" />
                        <p className="text-muted-foreground">Nenhuma enquete encontrada</p>
                        <p className="text-sm text-muted-foreground/70">Tente ajustar os filtros</p>
                    </motion.div>
                )}
            </motion.div>
        </AppShell>
    );
};

export default Enquetes;
