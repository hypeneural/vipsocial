import { useState } from "react";
import { motion } from "framer-motion";
import {
    Search,
    Filter,
    Download,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    Send,
    Users,
    MessageCircle,
    Calendar,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
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

interface LogEntry {
    id: string;
    campaign: string;
    group: string;
    status: "sent" | "failed" | "pending";
    timestamp: string;
    duration: string;
    recipients: number;
    delivered: number;
    error?: string;
}

const mockLogs: LogEntry[] = [
    {
        id: "1",
        campaign: "Bom Dia VIP",
        group: "VIP Social - Notícias Geral",
        status: "sent",
        timestamp: "20/01/2026 07:00:15",
        duration: "2.3s",
        recipients: 256,
        delivered: 254,
    },
    {
        id: "2",
        campaign: "Bom Dia VIP",
        group: "VIP Campinas",
        status: "sent",
        timestamp: "20/01/2026 07:00:18",
        duration: "1.8s",
        recipients: 128,
        delivered: 128,
    },
    {
        id: "3",
        campaign: "Resumo do Dia",
        group: "VIP Social - Notícias Geral",
        status: "failed",
        timestamp: "19/01/2026 18:00:05",
        duration: "5.2s",
        recipients: 256,
        delivered: 0,
        error: "Conexão perdida com o dispositivo",
    },
    {
        id: "4",
        campaign: "Alerta Urgente",
        group: "VIP Social - Notícias Geral",
        status: "sent",
        timestamp: "19/01/2026 15:30:22",
        duration: "3.1s",
        recipients: 256,
        delivered: 250,
    },
    {
        id: "5",
        campaign: "Enquete Semanal",
        group: "Guarulhos News",
        status: "pending",
        timestamp: "19/01/2026 10:00:00",
        duration: "-",
        recipients: 89,
        delivered: 0,
    },
    {
        id: "6",
        campaign: "Bom Dia VIP",
        group: "VIP Social - Notícias Geral",
        status: "sent",
        timestamp: "19/01/2026 07:00:12",
        duration: "2.1s",
        recipients: 256,
        delivered: 255,
    },
    {
        id: "7",
        campaign: "Resumo do Dia",
        group: "VIP Social - Notícias Geral",
        status: "sent",
        timestamp: "18/01/2026 18:00:08",
        duration: "2.5s",
        recipients: 256,
        delivered: 252,
    },
    {
        id: "8",
        campaign: "Bom Dia VIP",
        group: "VIP Campinas",
        status: "failed",
        timestamp: "18/01/2026 07:00:25",
        duration: "10.0s",
        recipients: 128,
        delivered: 45,
        error: "Timeout na conexão",
    },
];

const statusConfig = {
    sent: { label: "Enviado", color: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
    failed: { label: "Falhou", color: "bg-destructive/15 text-destructive border-destructive/30", icon: XCircle },
    pending: { label: "Pendente", color: "bg-warning/15 text-warning border-warning/30", icon: Clock },
};

const LogsEnvio = () => {
    const [logs] = useState<LogEntry[]>(mockLogs);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPeriod, setFilterPeriod] = useState("today");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const filteredLogs = logs.filter((log) => {
        if (searchQuery && !log.campaign.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !log.group.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterStatus !== "all" && log.status !== filterStatus) return false;
        return true;
    });

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const handleExport = () => {
        const csvContent = [
            ["ID", "Campanha", "Grupo", "Status", "Data/Hora", "Duração", "Destinatários", "Entregues", "Erro"],
            ...logs.map((log) => [
                log.id,
                log.campaign,
                log.group,
                log.status,
                log.timestamp,
                log.duration,
                log.recipients,
                log.delivered,
                log.error || "",
            ]),
        ]
            .map((row) => row.join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "logs-envio.csv";
        a.click();
    };

    const sentCount = logs.filter((l) => l.status === "sent").length;
    const failedCount = logs.filter((l) => l.status === "failed").length;
    const totalDelivered = logs.reduce((acc, l) => acc + l.delivered, 0);

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
                        <h1 className="text-xl md:text-2xl font-bold">Logs de Envio</h1>
                        <p className="text-sm text-muted-foreground">
                            Histórico detalhado de mensagens enviadas
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
                            Atualizar
                        </Button>
                        <Button variant="outline" className="rounded-xl" onClick={handleExport}>
                            <Download className="w-4 h-4 mr-2" />
                            Exportar CSV
                        </Button>
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
                        <Send className="w-4 h-4" />
                        Total
                    </div>
                    <p className="text-2xl font-bold mt-1">{logs.length}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-success/10 rounded-xl p-4 border border-success/30"
                >
                    <div className="flex items-center gap-2 text-success text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Sucesso
                    </div>
                    <p className="text-2xl font-bold mt-1 text-success">{sentCount}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-destructive/10 rounded-xl p-4 border border-destructive/30"
                >
                    <div className="flex items-center gap-2 text-destructive text-sm">
                        <XCircle className="w-4 h-4" />
                        Falhas
                    </div>
                    <p className="text-2xl font-bold mt-1 text-destructive">{failedCount}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-primary/10 rounded-xl p-4 border border-primary/30"
                >
                    <div className="flex items-center gap-2 text-primary text-sm">
                        <Users className="w-4 h-4" />
                        Entregues
                    </div>
                    <p className="text-2xl font-bold mt-1 text-primary">{totalDelivered.toLocaleString()}</p>
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
                        placeholder="Buscar por campanha ou grupo..."
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
                        <SelectItem value="sent">Enviados</SelectItem>
                        <SelectItem value="failed">Falhas</SelectItem>
                        <SelectItem value="pending">Pendentes</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger className="w-full md:w-[150px] rounded-xl">
                        <Calendar className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="week">Últimos 7 dias</SelectItem>
                        <SelectItem value="month">Últimos 30 dias</SelectItem>
                        <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                </Select>
            </motion.div>

            {/* Logs Table */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-2xl border border-border/50 overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold">Campanha</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold hidden md:table-cell">Grupo</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold">Data/Hora</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold hidden md:table-cell">Duração</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold">Entregues</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log, index) => {
                                const config = statusConfig[log.status];
                                const StatusIcon = config.icon;

                                return (
                                    <motion.tr
                                        key={log.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        className={cn(
                                            "border-b border-border/50 hover:bg-muted/30 transition-colors",
                                            log.status === "failed" && "bg-destructive/5"
                                        )}
                                    >
                                        <td className="py-3 px-4">
                                            <Badge className={cn("text-[10px] rounded-full", config.color)}>
                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                {config.label}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div>
                                                <p className="font-medium text-sm">{log.campaign}</p>
                                                <p className="text-xs text-muted-foreground md:hidden">{log.group}</p>
                                                {log.error && (
                                                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        {log.error}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
                                            <div className="flex items-center gap-1">
                                                <MessageCircle className="w-3 h-3" />
                                                {log.group}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm">{log.timestamp}</td>
                                        <td className="py-3 px-4 text-sm text-right hidden md:table-cell">
                                            {log.duration}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right">
                                            <span className={log.delivered < log.recipients ? "text-warning" : "text-success"}>
                                                {log.delivered}
                                            </span>
                                            <span className="text-muted-foreground">/{log.recipients}</span>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {filteredLogs.length} de {logs.length} registros
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 rounded-lg bg-primary text-primary-foreground">
                            1
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 rounded-lg">
                            2
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 rounded-lg">
                            3
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 rounded-lg">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </motion.div>
        </AppShell>
    );
};

export default LogsEnvio;
