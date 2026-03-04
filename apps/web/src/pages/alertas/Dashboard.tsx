import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    Phone,
    Bell,
    Clock,
    CheckCircle,
    XCircle,
    Plus,
    ArrowRight
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { NextFiringsList } from "@/components/alertas/NextFiringsList";
import { AlertsStats, AlertLog, NextFiring, calculateTimeUntil } from "@/types/alertas";
import { cn } from "@/lib/utils";

// Mock data
const mockStats: AlertsStats = {
    total_destinations: 12,
    active_destinations: 10,
    total_alerts: 8,
    active_alerts: 6,
    next_firings_count: 15,
    sent_last_7_days: 142,
    failed_last_7_days: 3,
};

const mockNextFirings: NextFiring[] = [
    {
        alert_id: 1,
        alert_title: "Jornal VIP Meio-dia",
        scheduled_time: "11:45",
        destination_count: 3,
        ...calculateTimeUntil("11:45"),
    },
    {
        alert_id: 2,
        alert_title: "Alerta Tarde",
        scheduled_time: "14:00",
        destination_count: 5,
        ...calculateTimeUntil("14:00"),
    },
    {
        alert_id: 3,
        alert_title: "Esporte VIP",
        scheduled_time: "18:00",
        destination_count: 2,
        ...calculateTimeUntil("18:00"),
    },
];

const mockRecentLogs: AlertLog[] = [
    {
        log_id: 1,
        alert_id: 1,
        alert_title: "Jornal VIP Manhã",
        destination_id: 1,
        destination_name: "VIP Tijucas",
        sent_at: "2026-01-20T07:45:00",
        success: true,
        response_message_id: "3F8A1B2C3D",
        error_message: null,
        created_at: "2026-01-20T07:45:00",
    },
    {
        log_id: 2,
        alert_id: 1,
        alert_title: "Jornal VIP Manhã",
        destination_id: 2,
        destination_name: "VIP Itapema",
        sent_at: "2026-01-20T07:45:00",
        success: true,
        response_message_id: "4G9B2C3D4E",
        error_message: null,
        created_at: "2026-01-20T07:45:00",
    },
    {
        log_id: 3,
        alert_id: 2,
        alert_title: "Bom Dia VIP",
        destination_id: 1,
        destination_name: "VIP Tijucas",
        sent_at: "2026-01-20T06:00:00",
        success: true,
        response_message_id: "5H0C3D4E5F",
        error_message: null,
        created_at: "2026-01-20T06:00:00",
    },
    {
        log_id: 4,
        alert_id: 3,
        alert_title: "Teste",
        destination_id: 3,
        destination_name: "VIP Barra Velha",
        sent_at: "2026-01-19T19:00:00",
        success: false,
        response_message_id: null,
        error_message: "Connection timeout após 30s",
        created_at: "2026-01-19T19:00:00",
    },
];

const AlertsDashboard = () => {
    const [stats] = useState<AlertsStats>(mockStats);
    const [nextFirings] = useState<NextFiring[]>(mockNextFirings);
    const [recentLogs] = useState<AlertLog[]>(mockRecentLogs);

    const formatLogTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    };

    const isToday = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

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
                        <h1 className="text-xl md:text-2xl font-bold">Alertas WhatsApp</h1>
                        <p className="text-sm text-muted-foreground">
                            Dashboard de alertas automáticos
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

            {/* KPI Cards */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"
            >
                {/* Destinos */}
                <Link to="/alertas/destinos" className="block">
                    <div className="bg-card rounded-2xl border border-border/50 p-4 text-center hover:shadow-md transition-shadow">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 mb-2">
                            <Phone className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold">{stats.active_destinations}</p>
                        <p className="text-xs text-muted-foreground">Destinos Ativos</p>
                    </div>
                </Link>

                {/* Alertas */}
                <Link to="/alertas/lista" className="block">
                    <div className="bg-card rounded-2xl border border-border/50 p-4 text-center hover:shadow-md transition-shadow">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-2">
                            <Bell className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-2xl font-bold">{stats.active_alerts}</p>
                        <p className="text-xs text-muted-foreground">Alertas Ativos</p>
                    </div>
                </Link>

                {/* Próximos */}
                <div className="bg-card rounded-2xl border border-border/50 p-4 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-warning/10 mb-2">
                        <Clock className="w-5 h-5 text-warning" />
                    </div>
                    <p className="text-2xl font-bold">{stats.next_firings_count}</p>
                    <p className="text-xs text-muted-foreground">Próximos Disparos</p>
                </div>

                {/* Enviados */}
                <Link to="/alertas/logs" className="block">
                    <div className="bg-card rounded-2xl border border-border/50 p-4 text-center hover:shadow-md transition-shadow">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-success/10 mb-2">
                            <CheckCircle className="w-5 h-5 text-success" />
                        </div>
                        <p className="text-2xl font-bold">{stats.sent_last_7_days}</p>
                        <p className="text-xs text-muted-foreground">Enviados (7 dias)</p>
                    </div>
                </Link>

                {/* Falhas */}
                <Link to="/alertas/logs?status=failed" className="block">
                    <div className="bg-card rounded-2xl border border-border/50 p-4 text-center hover:shadow-md transition-shadow">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-destructive/10 mb-2">
                            <XCircle className="w-5 h-5 text-destructive" />
                        </div>
                        <p className="text-2xl font-bold">{stats.failed_last_7_days}</p>
                        <p className="text-xs text-muted-foreground">Falhas (7 dias)</p>
                    </div>
                </Link>
            </motion.div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Próximos Disparos */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-2xl border border-border/50 overflow-hidden"
                >
                    <div className="flex items-center justify-between p-4 border-b border-border/50">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Próximos Disparos
                        </h3>
                        <Link to="/alertas/lista" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Ver todos
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="p-4">
                        <NextFiringsList firings={nextFirings} />
                    </div>
                </motion.div>

                {/* Últimos Envios */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card rounded-2xl border border-border/50 overflow-hidden"
                >
                    <div className="flex items-center justify-between p-4 border-b border-border/50">
                        <h3 className="font-semibold flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-success" />
                            Últimos Envios
                        </h3>
                        <Link to="/alertas/logs" className="text-sm text-primary hover:underline flex items-center gap-1">
                            Ver todos
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="divide-y divide-border/50">
                        {recentLogs.map((log) => (
                            <div
                                key={log.log_id}
                                className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
                            >
                                {/* Status Icon */}
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

                                {/* Time */}
                                <span className="text-sm font-mono text-muted-foreground w-12 flex-shrink-0">
                                    {isToday(log.sent_at) ? formatLogTime(log.sent_at) : "Ontem"}
                                </span>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{log.alert_title}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        → {log.destination_name}
                                    </p>
                                </div>

                                {/* Status Text */}
                                <span className={cn(
                                    "text-xs px-2 py-1 rounded-full flex-shrink-0",
                                    log.success
                                        ? "bg-success/10 text-success"
                                        : "bg-destructive/10 text-destructive"
                                )}>
                                    {log.success ? "Sucesso" : "Erro"}
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
