import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    AlertTriangle,
    ArrowRight,
    Bell,
    CheckCircle,
    Clock,
    Phone,
    Plus,
    XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { NextFiringsList } from "@/components/alertas/NextFiringsList";
import {
    useAlertDashboardRecentLogs,
    useAlertDashboardStats,
    useNextFirings,
} from "@/hooks/useAlertas";
import { cn } from "@/lib/utils";
import { formatLogStatusLabel } from "@/types/alertas";

const AlertsDashboard = () => {
    const statsQuery = useAlertDashboardStats();
    const nextFiringsQuery = useNextFirings(5);
    const recentLogsQuery = useAlertDashboardRecentLogs(8);

    const stats = statsQuery.data?.data;
    const nextFirings = nextFiringsQuery.data?.data ?? [];
    const recentLogs = recentLogsQuery.data?.data ?? [];
    const isLoading = statsQuery.isLoading || nextFiringsQuery.isLoading || recentLogsQuery.isLoading;

    const formatLogTime = (dateString: string | null) => {
        if (!dateString) {
            return "--:--";
        }

        const date = new Date(dateString);
        return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    };

    const isToday = (dateString: string | null) => {
        if (!dateString) {
            return false;
        }

        const date = new Date(dateString);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    return (
        <AppShell>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">Alertas WhatsApp</h1>
                        <p className="text-sm text-muted-foreground">
                            Dashboard operacional de disparos automatizados.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link to="/alertas/destinos/novo">
                            <Button variant="outline" className="rounded-xl">
                                <Phone className="w-4 h-4 mr-2" />
                                Novo Destino
                            </Button>
                        </Link>
                        <Link to="/alertas/novo">
                            <Button className="bg-primary hover:bg-primary-dark rounded-xl">
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Alerta
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6"
            >
                <Link to="/alertas/destinos" className="block">
                    <div className="bg-card rounded-2xl border border-border/50 p-4 text-center hover:shadow-md transition-shadow">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 mb-2">
                            <Phone className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold">{stats?.active_destinations ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Destinos Ativos</p>
                    </div>
                </Link>

                <Link to="/alertas/lista" className="block">
                    <div className="bg-card rounded-2xl border border-border/50 p-4 text-center hover:shadow-md transition-shadow">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-2">
                            <Bell className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-2xl font-bold">{stats?.active_alerts ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Alertas Ativos</p>
                    </div>
                </Link>

                <div className="bg-card rounded-2xl border border-border/50 p-4 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-warning/10 mb-2">
                        <Clock className="w-5 h-5 text-warning" />
                    </div>
                    <p className="text-2xl font-bold">{stats?.next_firings_count ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Proximos Disparos</p>
                </div>

                <Link to="/alertas/lista" className="block">
                    <div className="bg-card rounded-2xl border border-border/50 p-4 text-center hover:shadow-md transition-shadow">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-destructive/10 mb-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                        </div>
                        <p className="text-2xl font-bold">{stats?.overdue_alerts ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Com Atraso</p>
                    </div>
                </Link>

                <Link to="/alertas/logs" className="block">
                    <div className="bg-card rounded-2xl border border-border/50 p-4 text-center hover:shadow-md transition-shadow">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-success/10 mb-2">
                            <CheckCircle className="w-5 h-5 text-success" />
                        </div>
                        <p className="text-2xl font-bold">{stats?.sent_last_7_days ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Enviados 7 Dias</p>
                    </div>
                </Link>

                <Link to="/alertas/logs?status=failed" className="block">
                    <div className="bg-card rounded-2xl border border-border/50 p-4 text-center hover:shadow-md transition-shadow">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-destructive/10 mb-2">
                            <XCircle className="w-5 h-5 text-destructive" />
                        </div>
                        <p className="text-2xl font-bold">{stats?.failed_last_7_days ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Falhas 7 Dias</p>
                    </div>
                </Link>
            </motion.div>

            {(stats?.overdue_alerts ?? 0) > 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4"
                >
                    <div className="flex items-start gap-3">
                        <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-destructive">
                                Ha alerta{(stats?.overdue_alerts ?? 0) === 1 ? "" : "s"} com atraso operacional
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Existe horario vencido sem conclusao no tempo esperado ou envio concluido com atraso.
                                Revise a fila e a lista de alertas para localizar o item afetado.
                            </p>
                        </div>
                    </div>
                </motion.div>
            ) : null}

            <div className="grid lg:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-2xl border border-border/50 overflow-hidden"
                >
                    <div className="flex items-center justify-between p-4 border-b border-border/50">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Proximos Disparos
                        </h3>
                        <Link to="/alertas/lista" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Ver todos
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="p-4">
                        {isLoading ? (
                            <div className="rounded-xl bg-muted/50 p-6 text-center text-sm text-muted-foreground">
                                Carregando dados...
                            </div>
                        ) : (
                            <NextFiringsList firings={nextFirings} />
                        )}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card rounded-2xl border border-border/50 overflow-hidden"
                >
                    <div className="flex items-center justify-between p-4 border-b border-border/50">
                        <h3 className="font-semibold flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-success" />
                            Ultimos Envios
                        </h3>
                        <Link to="/alertas/logs" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Ver todos
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="divide-y divide-border/50">
                        {recentLogs.length === 0 && !isLoading ? (
                            <div className="p-6 text-center text-sm text-muted-foreground">
                                Nenhum envio registrado.
                            </div>
                        ) : null}

                        {recentLogs.map((log) => (
                            <div
                                key={log.log_id}
                                className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
                            >
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

                                <span className="text-sm font-mono text-muted-foreground w-12 flex-shrink-0">
                                    {isToday(log.sent_at) ? formatLogTime(log.sent_at) : "Antes"}
                                </span>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{log.alert_title}</p>
                                    <p className="text-xs text-muted-foreground truncate">-&gt; {log.destination_name}</p>
                                </div>

                                <span
                                    className={cn(
                                        "text-xs px-2 py-1 rounded-full flex-shrink-0",
                                        log.success
                                            ? "bg-success/10 text-success"
                                            : "bg-destructive/10 text-destructive"
                                    )}
                                >
                                    {formatLogStatusLabel(log.status)}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </AppShell>
    );
};

export default AlertsDashboard;
