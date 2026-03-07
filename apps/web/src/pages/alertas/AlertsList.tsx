import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCard } from "@/components/alertas/AlertCard";
import {
    useAlerts,
    useDuplicateAlert,
    useToggleAlert,
} from "@/hooks/useAlertas";

const AlertsList = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "paused">("all");

    const alertsQuery = useAlerts({
        per_page: 100,
        search: searchQuery || undefined,
        include_inactive: true,
        include_archived: false,
    });
    const duplicateMutation = useDuplicateAlert();
    const toggleMutation = useToggleAlert();

    const alerts = alertsQuery.data?.data ?? [];
    const filteredAlerts = alerts.filter((alert) => {
        if (filterStatus === "active" && !alert.active) return false;
        if (filterStatus === "paused" && alert.active) return false;
        return true;
    });

    const handleEdit = (id: number) => {
        navigate(`/alertas/${id}/editar`);
    };

    const handleDuplicate = async (id: number) => {
        try {
            await duplicateMutation.mutateAsync(id);
        } catch {
            return;
        }
    };

    const handleViewLogs = (id: number) => {
        navigate(`/alertas/logs?alert_id=${id}`);
    };

    const handleToggle = async (id: number) => {
        try {
            await toggleMutation.mutateAsync(id);
        } catch {
            return;
        }
    };

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
                        <h1 className="text-xl md:text-2xl font-bold">Alertas</h1>
                        <p className="text-sm text-muted-foreground">
                            Mensagens programadas para envio automatico.
                        </p>
                    </div>

                    <Link to="/alertas/novo">
                        <Button className="bg-primary hover:bg-primary-dark rounded-xl">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Alerta
                        </Button>
                    </Link>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col md:flex-row gap-3 mb-6"
            >
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar alerta..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="pl-10 rounded-xl bg-secondary/50"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(event) => setFilterStatus(event.target.value as "all" | "active" | "paused")}
                    className="px-4 py-2 border rounded-xl bg-background text-sm"
                >
                    <option value="all">Todos os status</option>
                    <option value="active">Ativos</option>
                    <option value="paused">Pausados</option>
                </select>
            </motion.div>

            {alertsQuery.isLoading ? (
                <div className="rounded-2xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
                    Carregando alertas...
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid md:grid-cols-2 gap-4"
                >
                    {filteredAlerts.map((alert, index) => (
                        <motion.div
                            key={alert.alert_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <AlertCard
                                alert={alert}
                                onEdit={handleEdit}
                                onDuplicate={handleDuplicate}
                                onViewLogs={handleViewLogs}
                                onToggle={handleToggle}
                            />
                        </motion.div>
                    ))}

                    {filteredAlerts.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum alerta encontrado</p>
                            <Link to="/alertas/novo">
                                <Button variant="outline" className="mt-4">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Criar Primeiro Alerta
                                </Button>
                            </Link>
                        </div>
                    ) : null}
                </motion.div>
            )}
        </AppShell>
    );
};

export default AlertsList;
