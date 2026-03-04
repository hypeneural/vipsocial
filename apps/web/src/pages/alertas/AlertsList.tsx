import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search, Bell } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCard } from "@/components/alertas/AlertCard";
import { Alert, AlertSchedule, Destination } from "@/types/alertas";

// Mock data
const mockDestinations: Destination[] = [
    { destination_id: 1, phone_number: "+5547999991111", name: "VIP Tijucas", tags: ["tijucas"], active: true, created_at: "", updated_at: "" },
    { destination_id: 2, phone_number: "+5547999992222", name: "VIP Itapema", tags: ["itapema"], active: true, created_at: "", updated_at: "" },
    { destination_id: 3, phone_number: "+5547999993333", name: "VIP Barra Velha", tags: ["barra-velha"], active: true, created_at: "", updated_at: "" },
];

const mockAlerts: Alert[] = [
    {
        alert_id: 1,
        title: "Jornal VIP Meio-dia",
        message: "🔴 Em 15 minutos começa o *Jornal VIP*!\n\n📺 Acompanhe ao vivo: https://vipsocial.com.br/ao-vivo\n\n#JornalVIP #NotíciasLocais",
        active: true,
        created_at: "2026-01-01",
        updated_at: "2026-01-20",
        schedules: [{
            schedule_id: 1,
            alert_id: 1,
            days_of_week: "0111110",
            times: ["11:45"],
            specific_date: null,
            repeat_interval: null,
            schedule_active: true,
            created_at: "",
            updated_at: "",
        }],
        destinations: mockDestinations.slice(0, 3),
    },
    {
        alert_id: 2,
        title: "Bom Dia VIP",
        message: "☀️ Bom dia! Acompanhe as notícias do dia no portal VIP Social.\n\n📱 https://vipsocial.com.br",
        active: true,
        created_at: "2026-01-01",
        updated_at: "2026-01-20",
        schedules: [{
            schedule_id: 2,
            alert_id: 2,
            days_of_week: "0111111",
            times: ["06:00"],
            specific_date: null,
            repeat_interval: null,
            schedule_active: true,
            created_at: "",
            updated_at: "",
        }],
        destinations: mockDestinations,
    },
    {
        alert_id: 3,
        title: "Esporte Semanal",
        message: "⚽ Hoje tem *Esporte Total*!\n\nAcompanhe às 18:30 os destaques do esporte regional.",
        active: false,
        created_at: "2026-01-01",
        updated_at: "2026-01-18",
        schedules: [{
            schedule_id: 3,
            alert_id: 3,
            days_of_week: "0000001",
            times: ["18:00"],
            specific_date: null,
            repeat_interval: null,
            schedule_active: true,
            created_at: "",
            updated_at: "",
        }],
        destinations: mockDestinations.slice(0, 2),
    },
];

const AlertsList = () => {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "paused">("all");

    // Filtra alertas
    const filteredAlerts = alerts.filter(alert => {
        if (searchQuery && !alert.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterStatus === "active" && !alert.active) return false;
        if (filterStatus === "paused" && alert.active) return false;
        return true;
    });

    const handleEdit = (id: number) => {
        navigate(`/alertas/${id}/editar`);
    };

    const handleDuplicate = (id: number) => {
        const alertToDuplicate = alerts.find(a => a.alert_id === id);
        if (alertToDuplicate) {
            const newAlert: Alert = {
                ...alertToDuplicate,
                alert_id: Date.now(),
                title: `${alertToDuplicate.title} (Cópia)`,
                active: false,
            };
            setAlerts([...alerts, newAlert]);
        }
    };

    const handleViewLogs = (id: number) => {
        navigate(`/alertas/logs?alert_id=${id}`);
    };

    const handleToggle = (id: number) => {
        setAlerts(prev =>
            prev.map(a => a.alert_id === id ? { ...a, active: !a.active } : a)
        );
        // TODO: Save to API
    };

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
                        <h1 className="text-xl md:text-2xl font-bold">Alertas</h1>
                        <p className="text-sm text-muted-foreground">
                            Mensagens programadas para envio automático
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

            {/* Filters */}
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
                    <option value="active">Ativos</option>
                    <option value="paused">Pausados</option>
                </select>
            </motion.div>

            {/* Alerts Grid */}
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

                {filteredAlerts.length === 0 && (
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
                )}
            </motion.div>
        </AppShell>
    );
};

export default AlertsList;
