import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    Download,
    RotateCcw,
    Search,
    XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAlertLogs, useRetryAlertLog } from "@/hooks/useAlertas";
import { cn } from "@/lib/utils";
import { formatLogStatusLabel } from "@/types/alertas";

const AlertLogs = () => {
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed">(
        (searchParams.get("status") as "all" | "success" | "failed") || "all"
    );
    const [filterPeriod, setFilterPeriod] = useState<"today" | "week" | "month" | "all">("week");

    const alertId = searchParams.get("alert_id");
    const retryMutation = useRetryAlertLog();

    const dateRange = useMemo(() => {
        const today = new Date();
        const endDate = today.toISOString().slice(0, 10);

        if (filterPeriod === "all") {
            return {
                start_date: undefined,
                end_date: undefined,
            };
        }

        const start = new Date(today);

        if (filterPeriod === "today") {
            return {
                start_date: endDate,
                end_date: endDate,
            };
        }

        if (filterPeriod === "week") {
            start.setDate(start.getDate() - 6);
        } else {
            start.setMonth(start.getMonth() - 1);
        }

        return {
            start_date: start.toISOString().slice(0, 10),
            end_date: endDate,
        };
    }, [filterPeriod]);

    const logsQuery = useAlertLogs({
        per_page: 100,
        alert_id: alertId ? Number(alertId) : undefined,
        search: searchQuery || undefined,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
    });

    const logs = (logsQuery.data?.data ?? []).filter((log) => {
        if (filterStatus === "success") {
            return log.success;
        }

        if (filterStatus === "failed") {
            return !log.success;
        }

        return true;
    });

    const groupedLogs = logs.reduce((acc, log) => {
        const baseDate = log.sent_at ?? log.created_at;
        const date = new Date(baseDate).toLocaleDateString("pt-BR");
        if (!acc[date]) acc[date] = [];
        acc[date].push(log);
        return acc;
    }, {} as Record<string, typeof logs>);

    const formatTime = (dateString: string | null) => {
        if (!dateString) {
            return "--:--";
        }

        const date = new Date(dateString);
        return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    };

    const handleExport = () => {
        const csv = [
            ["Data/Hora", "Alerta", "Destino", "Status", "Target", "Erro"].join(","),
            ...logs.map((log) =>
                [
                    new Date(log.sent_at ?? log.created_at).toLocaleString("pt-BR"),
                    `"${log.alert_title}"`,
                    `"${log.destination_name}"`,
                    `"${formatLogStatusLabel(log.status)}"`,
                    `"${log.target_value}"`,
                    `"${log.error_message || ""}"`,
                ].join(",")
            ),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `alertas-logs-${new Date().toISOString().split("T")[0]}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const successCount = logs.filter((log) => log.success).length;
    const failedCount = logs.filter((log) => !log.success).length;

    return (
        <AppShell>
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
                            Historico operacional dos disparos executados.
                        </p>
                    </div>

                    <Button variant="outline" onClick={handleExport} className="rounded-xl">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar CSV
                    </Button>
                </div>
            </motion.div>

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

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex flex-col md:flex-row gap-3 mb-6"
            >
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por alerta, destino, target ou message id..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="pl-10 rounded-xl bg-secondary/50"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(event) => setFilterStatus(event.target.value as "all" | "success" | "failed")}
                    className="px-4 py-2 border rounded-xl bg-background text-sm"
                >
                    <option value="all">Todos os status</option>
                    <option value="success">Sucesso</option>
                    <option value="failed">Falhas</option>
                </select>
                <select
                    value={filterPeriod}
                    onChange={(event) =>
                        setFilterPeriod(event.target.value as "today" | "week" | "month" | "all")
                    }
                    className="px-4 py-2 border rounded-xl bg-background text-sm"
                >
                    <option value="today">Hoje</option>
                    <option value="week">Ultimos 7 dias</option>
                    <option value="month">Ultimo mes</option>
                    <option value="all">Todo periodo</option>
                </select>
            </motion.div>

            {logsQuery.isLoading ? (
                <div className="rounded-2xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
                    Carregando logs...
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                        <div key={date} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{date}</span>
                                <span className="text-xs text-muted-foreground">
                                    ({dateLogs.length} envio{dateLogs.length !== 1 ? "s" : ""})
                                </span>
                            </div>

                            <div className="divide-y divide-border/50">
                                {dateLogs.map((log) => (
                                    <div
                                        key={log.log_id}
                                        className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                                    >
                                        <span className="text-sm font-mono text-muted-foreground w-14 flex-shrink-0">
                                            {formatTime(log.sent_at ?? log.created_at)}
                                        </span>

                                        <div
                                            className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                                                log.success
                                                    ? "bg-success/20 text-success"
                                                    : "bg-destructive/20 text-destructive"
                                            )}
                                        >
                                            {log.success ? (
                                                <CheckCircle className="w-4 h-4" />
                                            ) : (
                                                <XCircle className="w-4 h-4" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{log.alert_title}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                -&gt; {log.destination_name} | {log.target_value}
                                            </p>
                                        </div>

                                        <div className="text-xs text-muted-foreground max-w-xs truncate text-right">
                                            {log.success ? (
                                                <span className="text-success">OK - ID: {log.response_message_id}</span>
                                            ) : (
                                                <span className="text-destructive">{log.error_message}</span>
                                            )}
                                        </div>

                                        {!log.success ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-shrink-0"
                                                onClick={async () => {
                                                    try {
                                                        await retryMutation.mutateAsync(log.log_id);
                                                    } catch {
                                                        return;
                                                    }
                                                }}
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </Button>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {Object.keys(groupedLogs).length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum log encontrado</p>
                        </div>
                    ) : null}
                </motion.div>
            )}
        </AppShell>
    );
};

export default AlertLogs;
