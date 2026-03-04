import { useState } from "react";
import { motion } from "framer-motion";
import {
    Plus,
    Search,
    Filter,
    Users,
    Tag,
    MoreVertical,
    Edit,
    Trash2,
    MapPin,
    MessageCircle,
    CheckCircle2,
    XCircle,
    Smartphone,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface WhatsAppGroup {
    id: string;
    name: string;
    phone: string;
    city: string;
    type: "news" | "internal" | "partners" | "vip";
    participants: number;
    status: "connected" | "disconnected";
    lastMessage: string;
    tags: string[];
}

const mockGroups: WhatsAppGroup[] = [
    {
        id: "1",
        name: "VIP Social - Notícias Geral",
        phone: "+55 11 99999-1234",
        city: "São Paulo",
        type: "news",
        participants: 256,
        status: "connected",
        lastMessage: "Há 5 min",
        tags: ["notícias", "geral"],
    },
    {
        id: "2",
        name: "Redação - Time Interno",
        phone: "+55 11 99999-5678",
        city: "São Paulo",
        type: "internal",
        participants: 15,
        status: "connected",
        lastMessage: "Há 2 min",
        tags: ["interno", "redação"],
    },
    {
        id: "3",
        name: "Parceiros - Assessorias",
        phone: "+55 11 99999-9012",
        city: "São Paulo",
        type: "partners",
        participants: 45,
        status: "connected",
        lastMessage: "Há 30 min",
        tags: ["parceiros", "assessoria"],
    },
    {
        id: "4",
        name: "VIP Campinas",
        phone: "+55 19 99999-3456",
        city: "Campinas",
        type: "vip",
        participants: 128,
        status: "disconnected",
        lastMessage: "Há 2 horas",
        tags: ["vip", "regional"],
    },
    {
        id: "5",
        name: "Guarulhos News",
        phone: "+55 11 99999-7890",
        city: "Guarulhos",
        type: "news",
        participants: 89,
        status: "connected",
        lastMessage: "Há 15 min",
        tags: ["notícias", "regional"],
    },
];

const typeConfig = {
    news: { label: "Notícias", color: "bg-primary/15 text-primary border-primary/30" },
    internal: { label: "Interno", color: "bg-info/15 text-info border-info/30" },
    partners: { label: "Parceiros", color: "bg-warning/15 text-warning border-warning/30" },
    vip: { label: "VIP", color: "bg-success/15 text-success border-success/30" },
};

const Grupos = () => {
    const [groups] = useState<WhatsAppGroup[]>(mockGroups);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const filteredGroups = groups.filter((group) => {
        if (searchQuery && !group.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterType !== "all" && group.type !== filterType) return false;
        if (filterStatus !== "all" && group.status !== filterStatus) return false;
        return true;
    });

    const connectedCount = groups.filter((g) => g.status === "connected").length;
    const totalParticipants = groups.reduce((acc, g) => acc + g.participants, 0);

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
                        <h1 className="text-xl md:text-2xl font-bold">Grupos WhatsApp</h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie seus grupos e canais de distribuição
                        </p>
                    </div>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary-dark rounded-xl">
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Grupo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Adicionar Grupo</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nome do Grupo</Label>
                                    <Input placeholder="Ex: VIP Social - Notícias" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Cidade</Label>
                                        <Input placeholder="São Paulo" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tipo</Label>
                                        <Select defaultValue="news">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="news">Notícias</SelectItem>
                                                <SelectItem value="internal">Interno</SelectItem>
                                                <SelectItem value="partners">Parceiros</SelectItem>
                                                <SelectItem value="vip">VIP</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tags (separadas por vírgula)</Label>
                                    <Input placeholder="notícias, regional, vip" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Observações</Label>
                                    <Textarea placeholder="Informações adicionais sobre o grupo..." />
                                </div>
                                <Button className="w-full" onClick={() => setIsAddDialogOpen(false)}>
                                    Adicionar Grupo
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
                        <Users className="w-4 h-4" />
                        Total Grupos
                    </div>
                    <p className="text-2xl font-bold mt-1">{groups.length}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-success/10 rounded-xl p-4 border border-success/30"
                >
                    <div className="flex items-center gap-2 text-success text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Conectados
                    </div>
                    <p className="text-2xl font-bold mt-1 text-success">{connectedCount}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-primary/10 rounded-xl p-4 border border-primary/30"
                >
                    <div className="flex items-center gap-2 text-primary text-sm">
                        <Smartphone className="w-4 h-4" />
                        Participantes
                    </div>
                    <p className="text-2xl font-bold mt-1 text-primary">{totalParticipants}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-destructive/10 rounded-xl p-4 border border-destructive/30"
                >
                    <div className="flex items-center gap-2 text-destructive text-sm">
                        <XCircle className="w-4 h-4" />
                        Desconectados
                    </div>
                    <p className="text-2xl font-bold mt-1 text-destructive">
                        {groups.length - connectedCount}
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
                        placeholder="Buscar grupos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-xl bg-secondary/50"
                    />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full md:w-[150px] rounded-xl">
                        <Tag className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="news">Notícias</SelectItem>
                        <SelectItem value="internal">Interno</SelectItem>
                        <SelectItem value="partners">Parceiros</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-[150px] rounded-xl">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="connected">Conectados</SelectItem>
                        <SelectItem value="disconnected">Desconectados</SelectItem>
                    </SelectContent>
                </Select>
            </motion.div>

            {/* Groups List */}
            <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                className="space-y-3 pb-20 md:pb-0"
            >
                {filteredGroups.map((group, index) => {
                    const type = typeConfig[group.type];

                    return (
                        <motion.div
                            key={group.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                                "bg-card rounded-2xl border p-4 transition-all hover:shadow-md",
                                group.status === "disconnected" && "opacity-70 border-destructive/30"
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div
                                    className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                        group.status === "connected"
                                            ? "bg-success/15 text-success"
                                            : "bg-destructive/15 text-destructive"
                                    )}
                                >
                                    <MessageCircle className="w-6 h-6" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h3 className="font-semibold">{group.name}</h3>
                                        <StatusIndicator
                                            status={group.status === "connected" ? "online" : "offline"}
                                            size="sm"
                                        />
                                        <Badge className={cn("text-[10px] rounded-full", type.color)}>
                                            {type.label}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {group.city}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {group.participants} participantes
                                        </span>
                                        <span>Última msg: {group.lastMessage}</span>
                                    </div>

                                    {group.tags.length > 0 && (
                                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                                            {group.tags.map((tag) => (
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

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            Enviar Mensagem
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Remover
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </motion.div>
                    );
                })}

                {filteredGroups.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="empty-state"
                    >
                        <Users className="empty-state-icon" />
                        <p className="text-muted-foreground">Nenhum grupo encontrado</p>
                        <p className="text-sm text-muted-foreground/70">Tente ajustar os filtros</p>
                    </motion.div>
                )}
            </motion.div>
        </AppShell >
    );
};

export default Grupos;
