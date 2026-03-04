import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    Newspaper,
    Send,
    CheckCircle,
    XCircle,
    Trash2,
    ArrowRight,
    Settings,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { MasterSwitch } from "@/components/distribution/MasterSwitch";
import { ChannelStatusBar } from "@/components/distribution/ChannelStatusBar";
import {
    DistributionControl,
    DistributionStats,
    Channel,
    formatDateTime,
} from "@/types/distribution";

// Mock data
const mockControl: DistributionControl = {
    id: 1,
    enabled: true,
    updated_at: "2026-01-20T10:30:00",
    updated_by: "admin@vipsocial.com.br",
};

const mockStats: DistributionStats = {
    news_today: 47,
    sent_today: 142,
    success_rate: 97,
    failed_today: 4,
    deleted_today: 12,
};

const mockChannels: Channel[] = [
    {
        channel_id: 1,
        name: "WhatsApp",
        type: "whatsapp",
        icon: "MessageCircle",
        color: "#25D366",
        enabled: true,
        destinations_count: 5,
        messages_today: 89,
        success_rate: 89,
        created_at: "",
        updated_at: "",
    },
    {
        channel_id: 2,
        name: "Telegram",
        type: "telegram",
        icon: "Send",
        color: "#0088CC",
        enabled: true,
        destinations_count: 3,
        messages_today: 45,
        success_rate: 100,
        created_at: "",
        updated_at: "",
    },
    {
        channel_id: 3,
        name: "Instagram",
        type: "instagram",
        icon: "Instagram",
        color: "#E4405F",
        enabled: true,
        destinations_count: 1,
        messages_today: 32,
        success_rate: 75,
        created_at: "",
        updated_at: "",
    },
    {
        channel_id: 4,
        name: "Facebook",
        type: "facebook",
        icon: "Facebook",
        color: "#1877F2",
        enabled: false,
        destinations_count: 2,
        messages_today: 0,
        success_rate: 0,
        created_at: "",
        updated_at: "",
    },
];

const DistributionDashboard = () => {
    const [control, setControl] = useState<DistributionControl>(mockControl);
    const [stats] = useState<DistributionStats>(mockStats);
    const [channels, setChannels] = useState<Channel[]>(mockChannels);

    const handleToggleGlobal = async (enabled: boolean) => {
        // TODO: Call API
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setControl({
            ...control,
            enabled,
            updated_at: new Date().toISOString(),
        });
    };

    const handleToggleChannel = (channelId: number, enabled: boolean) => {
        setChannels((prev) =>
            prev.map((c) =>
                c.channel_id === channelId ? { ...c, enabled } : c
            )
        );
        // TODO: Call API
    };

    const statusMessage = control.enabled
        ? `Ativo desde ${formatDateTime(control.updated_at)}`
        : `Pausado desde ${formatDateTime(control.updated_at)}`;

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
                        <h1 className="text-xl md:text-2xl font-bold">Central de Distribuição</h1>
                        <p className="text-sm text-muted-foreground">
                            Controle a distribuição automática de notícias
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link to="/distribuicao/noticias">
                            <Button variant="outline" className="rounded-xl">
                                <Newspaper className="w-4 h-4 mr-2" />
                                Ver Notícias
                            </Button>
                        </Link>
                        <Link to="/distribuicao/canais">
                            <Button variant="outline" className="rounded-xl">
                                <Settings className="w-4 h-4 mr-2" />
                                Gerenciar Canais
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Master Switch */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
            >
                <MasterSwitch
                    enabled={control.enabled}
                    message={statusMessage}
                    onToggle={handleToggleGlobal}
                />
            </motion.div>

            {/* KPIs */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"
            >
                <Link to="/distribuicao/noticias" className="block">
                    <div className="bg-card rounded-2xl border border-border/50 p-4 text-center hover:shadow-md transition-shadow">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 mb-2">
                            <Newspaper className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold">{stats.news_today}</p>
                        <p className="text-xs text-muted-foreground">Notícias (Hoje)</p>
                    </div>
                </Link>

                <div className="bg-card rounded-2xl border border-border/50 p-4 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-2">
                        <Send className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-2xl font-bold">{stats.sent_today}</p>
                    <p className="text-xs text-muted-foreground">Enviadas (Hoje)</p>
                </div>

                <div className="bg-card rounded-2xl border border-border/50 p-4 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-success/10 mb-2">
                        <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <p className="text-2xl font-bold">{stats.success_rate}%</p>
                    <p className="text-xs text-muted-foreground">Taxa Sucesso</p>
                </div>

                <div className="bg-card rounded-2xl border border-border/50 p-4 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-destructive/10 mb-2">
                        <XCircle className="w-5 h-5 text-destructive" />
                    </div>
                    <p className="text-2xl font-bold">{stats.failed_today}</p>
                    <p className="text-xs text-muted-foreground">Falhas (Hoje)</p>
                </div>

                <div className="bg-card rounded-2xl border border-border/50 p-4 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-500/10 mb-2">
                        <Trash2 className="w-5 h-5 text-gray-500" />
                    </div>
                    <p className="text-2xl font-bold">{stats.deleted_today}</p>
                    <p className="text-xs text-muted-foreground">Deletadas (Hoje)</p>
                </div>
            </motion.div>

            {/* Channel Status */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-2xl border border-border/50 overflow-hidden"
            >
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <h2 className="font-semibold">Status por Canal</h2>
                    <Link
                        to="/distribuicao/canais"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                        Gerenciar
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="p-4 space-y-3">
                    {channels.map((channel, index) => (
                        <motion.div
                            key={channel.channel_id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.05 }}
                        >
                            <ChannelStatusBar
                                channel={channel}
                                onToggle={handleToggleChannel}
                            />
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </AppShell>
    );
};

export default DistributionDashboard;
