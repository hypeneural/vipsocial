import { useState } from "react";
import { motion } from "framer-motion";
import {
    Power,
    PowerOff,
    Newspaper,
    ChevronDown,
    CheckCircle2,
    XCircle,
    Clock,
    Send,
    Trash2,
    RefreshCw,
    AlertTriangle,
    Globe,
    MessageCircle,
    Radio,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ChannelStatus {
    name: string;
    icon: React.ElementType;
    status: "sent" | "pending" | "failed" | "not_sent";
    sentAt?: string;
}

interface NewsItem {
    id: string;
    title: string;
    publishedAt: string;
    author: string;
    channels: ChannelStatus[];
}

const mockNews: NewsItem[] = [
    {
        id: "1",
        title: "Governo anuncia novo pacote de medidas econômicas",
        publishedAt: "2026-01-20 14:30",
        author: "Maria Santos",
        channels: [
            { name: "Portal", icon: Globe, status: "sent", sentAt: "14:31" },
            { name: "WhatsApp", icon: MessageCircle, status: "sent", sentAt: "14:32" },
            { name: "App", icon: Radio, status: "sent", sentAt: "14:33" },
        ],
    },
    {
        id: "2",
        title: "Previsão indica chuvas fortes para o final de semana",
        publishedAt: "2026-01-20 12:15",
        author: "Carlos Oliveira",
        channels: [
            { name: "Portal", icon: Globe, status: "sent", sentAt: "12:16" },
            { name: "WhatsApp", icon: MessageCircle, status: "pending" },
            { name: "App", icon: Radio, status: "not_sent" },
        ],
    },
    {
        id: "3",
        title: "Nova linha de ônibus começa a operar amanhã",
        publishedAt: "2026-01-20 10:00",
        author: "Ana Costa",
        channels: [
            { name: "Portal", icon: Globe, status: "sent", sentAt: "10:01" },
            { name: "WhatsApp", icon: MessageCircle, status: "failed" },
            { name: "App", icon: Radio, status: "sent", sentAt: "10:05" },
        ],
    },
    {
        id: "4",
        title: "Prefeitura abre inscrições para programa de capacitação",
        publishedAt: "2026-01-20 08:45",
        author: "Pedro Almeida",
        channels: [
            { name: "Portal", icon: Globe, status: "sent", sentAt: "08:46" },
            { name: "WhatsApp", icon: MessageCircle, status: "sent", sentAt: "08:47" },
            { name: "App", icon: Radio, status: "sent", sentAt: "08:48" },
        ],
    },
];

const statusConfig = {
    sent: { label: "Enviado", color: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
    pending: { label: "Pendente", color: "bg-warning/15 text-warning border-warning/30", icon: Clock },
    failed: { label: "Falhou", color: "bg-destructive/15 text-destructive border-destructive/30", icon: XCircle },
    not_sent: { label: "Não enviado", color: "bg-muted text-muted-foreground border-muted", icon: XCircle },
};

const Distribuicao = () => {
    const [isDistributionActive, setIsDistributionActive] = useState(true);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingAction, setPendingAction] = useState<boolean | null>(null);
    const [news] = useState<NewsItem[]>(mockNews);

    const handleToggleDistribution = (newValue: boolean) => {
        setPendingAction(newValue);
        setShowConfirmDialog(true);
    };

    const confirmToggle = () => {
        if (pendingAction !== null) {
            setIsDistributionActive(pendingAction);
        }
        setShowConfirmDialog(false);
        setPendingAction(null);
    };

    const totalSent = news.reduce(
        (acc, n) => acc + n.channels.filter((c) => c.status === "sent").length,
        0
    );
    const totalFailed = news.reduce(
        (acc, n) => acc + n.channels.filter((c) => c.status === "failed").length,
        0
    );
    const totalPending = news.reduce(
        (acc, n) => acc + n.channels.filter((c) => c.status === "pending").length,
        0
    );

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
                        <h1 className="text-xl md:text-2xl font-bold">Fluxo de Distribuição</h1>
                        <p className="text-sm text-muted-foreground">
                            Controle centralizado da distribuição de conteúdo
                        </p>
                    </div>

                    <Button variant="outline" className="rounded-xl">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sincronizar
                    </Button>
                </div>
            </motion.div>

            {/* Master Toggle */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    "distribution-toggle mb-6",
                    isDistributionActive ? "active" : "inactive"
                )}
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div
                            className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
                                isDistributionActive
                                    ? "bg-success/20 text-success"
                                    : "bg-destructive/20 text-destructive"
                            )}
                        >
                            {isDistributionActive ? (
                                <Power className="w-8 h-8" />
                            ) : (
                                <PowerOff className="w-8 h-8" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <StatusIndicator
                                    status={isDistributionActive ? "online" : "offline"}
                                    size="lg"
                                    showLabel
                                    label={isDistributionActive ? "Distribuição Ativa" : "Distribuição Pausada"}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                {isDistributionActive
                                    ? "Conteúdo está sendo distribuído automaticamente"
                                    : "Distribuição pausada - conteúdo não será enviado"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                            {isDistributionActive ? "Ativo" : "Inativo"}
                        </span>
                        <Switch
                            checked={isDistributionActive}
                            onCheckedChange={handleToggleDistribution}
                            className="data-[state=checked]:bg-success"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-success/10 rounded-xl p-4 border border-success/30 text-center"
                >
                    <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-2" />
                    <p className="text-2xl font-bold text-success">{totalSent}</p>
                    <p className="text-xs text-muted-foreground">Enviados</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-warning/10 rounded-xl p-4 border border-warning/30 text-center"
                >
                    <Clock className="w-6 h-6 text-warning mx-auto mb-2" />
                    <p className="text-2xl font-bold text-warning">{totalPending}</p>
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-destructive/10 rounded-xl p-4 border border-destructive/30 text-center"
                >
                    <XCircle className="w-6 h-6 text-destructive mx-auto mb-2" />
                    <p className="text-2xl font-bold text-destructive">{totalFailed}</p>
                    <p className="text-xs text-muted-foreground">Falhas</p>
                </motion.div>
            </div>

            {/* News List with Distribution Status */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="pb-20 md:pb-0"
            >
                <h3 className="text-lg font-semibold mb-4">Histórico de Distribuição</h3>
                <Accordion type="single" collapsible className="space-y-3">
                    {news.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <AccordionItem
                                value={item.id}
                                className="bg-card rounded-2xl border border-border/50 overflow-hidden"
                            >
                                <AccordionTrigger className="px-4 py-4 hover:no-underline">
                                    <div className="flex items-start gap-3 w-full text-left">
                                        <Newspaper className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm line-clamp-1">{item.title}</h4>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                <span>{item.publishedAt}</span>
                                                <span>•</span>
                                                <span>{item.author}</span>
                                            </div>
                                            <div className="flex items-center gap-1 mt-2">
                                                {item.channels.map((channel) => {
                                                    const config = statusConfig[channel.status];
                                                    return (
                                                        <Badge
                                                            key={channel.name}
                                                            className={cn("text-[9px] rounded-full px-1.5", config.color)}
                                                        >
                                                            <channel.icon className="w-2.5 h-2.5 mr-0.5" />
                                                            {channel.name}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4">
                                    <div className="space-y-2">
                                        {item.channels.map((channel) => {
                                            const config = statusConfig[channel.status];
                                            const StatusIcon = config.icon;

                                            return (
                                                <div
                                                    key={channel.name}
                                                    className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <channel.icon className="w-4 h-4 text-muted-foreground" />
                                                        <span className="font-medium text-sm">{channel.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Badge className={cn("text-[10px] rounded-full", config.color)}>
                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                            {config.label}
                                                        </Badge>
                                                        {channel.sentAt && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {channel.sentAt}
                                                            </span>
                                                        )}
                                                        {channel.status === "failed" && (
                                                            <Button size="sm" variant="ghost" className="h-6 text-xs">
                                                                <RefreshCw className="w-3 h-3 mr-1" />
                                                                Reenviar
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                                        <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg flex-1">
                                            <Send className="w-3 h-3 mr-1" />
                                            Redistribuir
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-xs rounded-lg text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="w-3 h-3 mr-1" />
                                            Remover de Todos
                                        </Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </motion.div>
                    ))}
                </Accordion>
            </motion.div>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingAction ? "Ativar Distribuição?" : "Pausar Distribuição?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingAction
                                ? "O conteúdo publicado será distribuído automaticamente para todos os canais configurados."
                                : "O conteúdo publicado NÃO será distribuído até que a distribuição seja reativada. Notícias publicadas durante a pausa não serão enviadas automaticamente."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmToggle}
                            className={pendingAction ? "bg-success hover:bg-success/90" : "bg-destructive hover:bg-destructive/90"}
                        >
                            {pendingAction ? "Ativar" : "Pausar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppShell>
    );
};

export default Distribuicao;
