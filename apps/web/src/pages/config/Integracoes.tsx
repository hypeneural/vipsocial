import { useState } from "react";
import { motion } from "framer-motion";
import {
    Plug,
    Plus,
    Search,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    ExternalLink,
    Settings,
    Zap,
    MessageCircle,
    Database,
    Cloud,
    RefreshCw,
    MoreVertical,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

// ==========================================
// TYPES
// ==========================================

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    status: "connected" | "disconnected" | "error";
    lastSync?: string;
    config?: Record<string, string>;
}

// ==========================================
// INITIAL DATA
// ==========================================

const initialIntegrations: Integration[] = [
    {
        id: "1",
        name: "WhatsApp Business API",
        description: "Envio de alertas e mensagens automáticas",
        icon: MessageCircle,
        status: "connected",
        lastSync: "2026-01-21T06:30:00",
    },
    {
        id: "2",
        name: "Google Analytics",
        description: "Métricas e analytics do engajamento",
        icon: Database,
        status: "connected",
        lastSync: "2026-01-21T06:00:00",
    },
    {
        id: "3",
        name: "AWS S3",
        description: "Armazenamento de mídias e backups",
        icon: Cloud,
        status: "connected",
        lastSync: "2026-01-21T05:45:00",
    },
    {
        id: "4",
        name: "Telegram Bot",
        description: "Distribuição via Telegram",
        icon: Zap,
        status: "disconnected",
    },
    {
        id: "5",
        name: "RSS Feeds",
        description: "Importação automática de notícias",
        icon: RefreshCw,
        status: "error",
        lastSync: "2026-01-20T23:00:00",
    },
];

// ==========================================
// STATUS BADGE
// ==========================================

function StatusBadge({ status }: { status: Integration["status"] }) {
    const config = {
        connected: { label: "Conectado", color: "bg-success/15 text-success", icon: CheckCircle },
        disconnected: { label: "Desconectado", color: "bg-muted text-muted-foreground", icon: XCircle },
        error: { label: "Erro", color: "bg-destructive/15 text-destructive", icon: XCircle },
    };

    const { label, color, icon: Icon } = config[status];

    return (
        <Badge className={cn("gap-1", color)}>
            <Icon className="w-3 h-3" />
            {label}
        </Badge>
    );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

const Integracoes = () => {
    const [integrations, setIntegrations] = useState(initialIntegrations);
    const [search, setSearch] = useState("");
    const [configDialog, setConfigDialog] = useState<Integration | null>(null);

    const filteredIntegrations = integrations.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleToggle = (id: string) => {
        setIntegrations((prev) =>
            prev.map((i) =>
                i.id === id
                    ? { ...i, status: i.status === "connected" ? "disconnected" : "connected" }
                    : i
            )
        );
        toast.success("Status da integração atualizado");
    };

    const handleSync = (id: string) => {
        toast.loading("Sincronizando...");
        setTimeout(() => {
            setIntegrations((prev) =>
                prev.map((i) =>
                    i.id === id ? { ...i, lastSync: new Date().toISOString(), status: "connected" } : i
                )
            );
            toast.dismiss();
            toast.success("Sincronização concluída");
        }, 1500);
    };

    const connectedCount = integrations.filter((i) => i.status === "connected").length;

    return (
        <AppShell>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                            <Plug className="w-6 h-6 text-primary" />
                            Integrações
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {connectedCount} de {integrations.length} integrações ativas
                        </p>
                    </div>

                    <Button className="rounded-xl">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Integração
                    </Button>
                </div>
            </motion.div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar integrações..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 rounded-xl"
                    />
                </div>
            </div>

            {/* Integrations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredIntegrations.map((integration, i) => {
                    const Icon = integration.icon;
                    return (
                        <motion.div
                            key={integration.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{integration.name}</h3>
                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                            {integration.description}
                                        </p>
                                    </div>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setConfigDialog(integration)}>
                                            <Settings className="w-4 h-4 mr-2" />
                                            Configurar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleSync(integration.id)}>
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Sincronizar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Documentação
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-center justify-between">
                                <StatusBadge status={integration.status} />
                                <Switch
                                    checked={integration.status === "connected"}
                                    onCheckedChange={() => handleToggle(integration.id)}
                                />
                            </div>

                            {integration.lastSync && (
                                <p className="text-xs text-muted-foreground mt-3">
                                    Última sync: {new Date(integration.lastSync).toLocaleString("pt-BR")}
                                </p>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {filteredIntegrations.length === 0 && (
                <div className="text-center py-12">
                    <Plug className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhuma integração encontrada</p>
                </div>
            )}

            {/* Config Dialog */}
            <Dialog open={!!configDialog} onOpenChange={() => setConfigDialog(null)}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Configurar {configDialog?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>API Key</Label>
                            <Input placeholder="••••••••••••••••" type="password" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label>Webhook URL</Label>
                            <Input placeholder="https://..." className="rounded-xl" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setConfigDialog(null)}>
                            Cancelar
                        </Button>
                        <Button className="rounded-xl" onClick={() => { setConfigDialog(null); toast.success("Configurações salvas"); }}>
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppShell>
    );
};

export default Integracoes;
