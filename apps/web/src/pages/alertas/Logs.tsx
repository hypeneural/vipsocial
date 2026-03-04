import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Search,
    CheckCircle,
    XCircle,
    RotateCcw,
    Download,
    Calendar,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertLog } from "@/types/alertas";
import { cn } from "@/lib/utils";

// Mock logs
const mockLogs: AlertLog[] = [
    { log_id: 1, alert_id: 1, alert_title: "Jornal VIP Meio-dia", destination_id: 1, destination_name: "VIP Tijucas", sent_at: "2026-01-20T11:45:00", success: true, response_message_id: "3F8A1B2C3D", error_message: null, created_at: "2026-01-20T11:45:00" },
    { log_id: 2, alert_id: 1, alert_title: "Jornal VIP Meio-dia", destination_id: 2, destination_name: "VIP Itapema", sent_at: "2026-01-20T11:45:00", success: true, response_message_id: "4G9B2C3D4E", error_message: null, created_at: "2026-01-20T11:45:00" },
    { log_id: 3, alert_id: 1, alert_title: "Jornal VIP Meio-dia", destination_id: 3, destination_name: "VIP Barra Velha", sent_at: "2026-01-20T11:45:00", success: true, response_message_id: "5H0C3D4E5F", error_message: null, created_at: "2026-01-20T11:45:00" },
    { log_id: 4, alert_id: 2, alert_title: "Jornal VIP Manhã", destination_id: 1, destination_name: "VIP Tijucas", sent_at: "2026-01-20T07:45:00", success: true, response_message_id: "6I1D4E5F6G", error_message: null, created_at: "2026-01-20T07:45:00" },
    { log_id: 5, alert_id: 3, alert_title: "Bom Dia VIP", destination_id: 1, destination_name: "VIP Tijucas", sent_at: "2026-01-20T06:00:00", success: true, response_message_id: "7J2E5F6G7H", error_message: null, created_at: "2026-01-20T06:00:00" },
    { log_id: 6, alert_id: 1, alert_title: "Jornal VIP Noite", destination_id: 3, destination_name: "VIP Barra Velha", sent_at: "2026-01-19T19:00:00", success: false, response_message_id: null, error_message: "Connection timeout após 30s", created_at: "2026-01-19T19:00:00" },
    { log_id: 7, alert_id: 1, alert_title: "Jornal VIP Noite", destination_id: 1, destination_name: "VIP Tijucas", sent_at: "2026-01-19T19:00:00", success: true, response_message_id: "8K3F6G7H8I", error_message: null, created_at: "2026-01-19T19:00:00" },
];

const AlertLogs = () => {
    const [logs] = useState<AlertLog[]>(mockLogs);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed">("all");
    const [filterPeriod, setFilterPeriod] = useState<"today" | "week" | "month" | "all">("week");

    // Filtra logs
    const filteredLogs = logs.filter(log => {
        if (searchQuery &&
            !log.alert_title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !log.destination_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterStatus === "success" && !log.success) return false;
        if (filterStatus === "failed" && log.success) return false;
        return true;
    });

    // Agrupa por data
    const groupedLogs = filteredLogs.reduce((acc, log) => {
        const date = new Date(log.sent_at).toLocaleDateString("pt-BR");
        if (!acc[date]) acc[date] = [];
        acc[date].push(log);
        return acc;
    }, {} as Record<string, AlertLog[]>);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    };

    const handleExport = () => {
        const csv = [
            ["Data/Hora", "Alerta", "Destino", "Status", "Erro"].join(","),
            ...filteredLogs.map(log => [
                new Date(log.sent_at).toLocaleString("pt-BR"),
                log.alert_title,
                log.destination_name,
                log.success ? "Sucesso" : "Falha",
                log.error_message || ""
            ].join(","))
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `alertas-logs-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    };

    const successCount = filteredLogs.filter(l => l.success).length;
    const failedCount = filteredLogs.filter(l => !l.success).length;

    return (
        <AppShell>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <Link
                    to="/alertas"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Dashboard
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">Logs de Envio</h1>
                        <p className="text-sm text-muted-foreground">
                            Histórico de mensagens enviadas
                        </p>
                    </div>

                    <Button variant="outline" onClick={handleExport} className="rounded-xl">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar CSV
                    </Button>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex gap-4 mb-6"
            >
                <div className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-xl">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">{successCount} sucesso</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-xl">
                    <XCircle className="w-4 h-4" />
                    <span className="font-medium">{failedCount} falha(s)</span>
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex flex-col md:flex-row gap-3 mb-6"
            >
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por alerta ou destino..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-xl bg-secondary/50"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2 border rounded-xl bg-background text-sm"
                >
                    <option value="all">Todos os status</option>
                    <option value="success">Sucesso</option>
                    <option value="failed">Falhas</option>
                </select>
                <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value as any)}
                    className="px-4 py-2 border rounded-xl bg-background text-sm"
                >
                    <option value="today">Hoje</option>
                    <option value="week">Últimos 7 dias</option>
                    <option value="month">Último mês</option>
                    <option value="all">Todo período</option>
                </select>
            </motion.div>

            {/* Logs by Date */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
            >
                {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                    <div key={date} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                        {/* Date Header */}
                        <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{date}</span>
                            <span className="text-xs text-muted-foreground">
                                ({dateLogs.length} envio{dateLogs.length !== 1 ? "s" : ""})
                            </span>
                        </div>

                        {/* Logs */}
                        <div className="divide-y divide-border/50">
                            {dateLogs.map((log) => (
                                <div
                                    key={log.log_id}
                                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                                >
                                    {/* Time */}
                                    <span className="text-sm font-mono text-muted-foreground w-14 flex-shrink-0">
                                        {formatTime(log.sent_at)}
                                    </span>

                                    {/* Status */}
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                                        log.success ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                                    )}>
                                        {log.success ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <XCircle className="w-4 h-4" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{log.alert_title}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            → {log.destination_name}
                                        </p>
                                    </div>

                                    {/* Response/Error */}
                                    <div className="text-xs text-muted-foreground max-w-xs truncate">
                                        {log.success ? (
                                            <span className="text-success">
                                                OK - ID: {log.response_message_id}
                                            </span>
                                        ) : (
                                            <span className="text-destructive">
                                                Erro: {log.error_message}
                                            </span>
                                        )}
                                    </div>

                                    {/* Retry */}
                                    {!log.success && (
                                        <Button variant="ghost" size="sm" className="flex-shrink-0">
                                            <RotateCcw className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {Object.keys(groupedLogs).length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum log encontrado</p>
                    </div>
                )}
            </motion.div>
        </AppShell>
    );
};

export default AlertLogs;
