import { useState } from "react";
import { motion } from "framer-motion";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    Eye,
    MessageCircle,
    Share2,
    Calendar,
    Download,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

// ==========================================
// TYPES
// ==========================================

interface MetricCard {
    title: string;
    value: string;
    change: number;
    icon: React.ElementType;
}

interface ContentMetric {
    id: string;
    title: string;
    type: "roteiro" | "enquete" | "alerta";
    views: number;
    engagement: number;
    shares: number;
    date: string;
}

// ==========================================
// MOCK DATA
// ==========================================

const metrics: MetricCard[] = [
    { title: "Visualizações", value: "125.4K", change: 12.5, icon: Eye },
    { title: "Engajamento", value: "23.8%", change: 3.2, icon: TrendingUp },
    { title: "Compartilhamentos", value: "4.2K", change: -2.1, icon: Share2 },
    { title: "Usuários Ativos", value: "8.9K", change: 8.7, icon: Users },
];

const topContent: ContentMetric[] = [
    {
        id: "1",
        title: "Entrevista Exclusiva com Ministro",
        type: "roteiro",
        views: 45200,
        engagement: 34.5,
        shares: 1230,
        date: "2026-01-21",
    },
    {
        id: "2",
        title: "Enquete: Melhor momento do ano",
        type: "enquete",
        views: 38100,
        engagement: 67.2,
        shares: 890,
        date: "2026-01-20",
    },
    {
        id: "3",
        title: "Alerta Econômico: Dólar em alta",
        type: "alerta",
        views: 31500,
        engagement: 28.3,
        shares: 2100,
        date: "2026-01-20",
    },
    {
        id: "4",
        title: "Cobertura Especial: Eleições 2026",
        type: "roteiro",
        views: 28900,
        engagement: 42.1,
        shares: 1560,
        date: "2026-01-19",
    },
    {
        id: "5",
        title: "Enquete: Pauta prioritária",
        type: "enquete",
        views: 22400,
        engagement: 58.7,
        shares: 450,
        date: "2026-01-19",
    },
];

const typeConfig = {
    roteiro: { label: "Roteiro", color: "bg-primary/15 text-primary" },
    enquete: { label: "Enquete", color: "bg-info/15 text-info" },
    alerta: { label: "Alerta", color: "bg-warning/15 text-warning" },
};

// ==========================================
// STAT CARD
// ==========================================

function StatCard({ metric }: { metric: MetricCard }) {
    const Icon = metric.icon;
    const isPositive = metric.change >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border/50 p-5"
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{metric.title}</span>
                <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold mb-1">{metric.value}</p>
            <div className={cn("flex items-center gap-1 text-sm", isPositive ? "text-success" : "text-destructive")}>
                {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                <span>{Math.abs(metric.change)}%</span>
                <span className="text-muted-foreground">vs período anterior</span>
            </div>
        </motion.div>
    );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

const Relatorios = () => {
    const [period, setPeriod] = useState("7d");
    const [contentType, setContentType] = useState("all");

    const filteredContent = topContent.filter((c) =>
        contentType === "all" ? true : c.type === contentType
    );

    const handleExport = () => {
        toast.loading("Gerando relatório...");
        setTimeout(() => {
            toast.dismiss();
            toast.success("Relatório exportado com sucesso!");
        }, 1500);
    };

    return (
        <AppShell>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-primary" />
                            Relatórios de Engajamento
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Métricas e performance do conteúdo
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-[140px] rounded-xl">
                                <Calendar className="w-4 h-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" className="rounded-xl" onClick={handleExport}>
                            <Download className="w-4 h-4 mr-2" />
                            Exportar
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {metrics.map((metric, i) => (
                    <motion.div key={metric.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <StatCard metric={metric} />
                    </motion.div>
                ))}
            </div>

            {/* Chart Placeholder */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card rounded-2xl border border-border/50 p-6 mb-8"
            >
                <h2 className="text-lg font-semibold mb-4">Evolução do Engajamento</h2>
                <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-xl">
                    <div className="text-center text-muted-foreground">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>Gráfico de engajamento</p>
                        <p className="text-xs">(Integrar com biblioteca de charts)</p>
                    </div>
                </div>
            </motion.div>

            {/* Top Content */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card rounded-2xl border border-border/50 overflow-hidden"
            >
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Conteúdo com Melhor Performance</h2>
                    <Select value={contentType} onValueChange={setContentType}>
                        <SelectTrigger className="w-[140px] rounded-xl">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="roteiro">Roteiros</SelectItem>
                            <SelectItem value="enquete">Enquetes</SelectItem>
                            <SelectItem value="alerta">Alertas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="divide-y divide-border/50">
                    {filteredContent.map((content, i) => (
                        <motion.div
                            key={content.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-4 hover:bg-muted/30 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge className={typeConfig[content.type].color}>
                                            {typeConfig[content.type].label}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(content.date), "dd MMM", { locale: ptBR })}
                                        </span>
                                    </div>
                                    <h3 className="font-medium">{content.title}</h3>
                                </div>

                                <div className="flex gap-6 text-sm">
                                    <div className="text-center">
                                        <p className="text-muted-foreground text-xs">Views</p>
                                        <p className="font-semibold">{(content.views / 1000).toFixed(1)}K</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-muted-foreground text-xs">Engajamento</p>
                                        <p className="font-semibold text-success">{content.engagement}%</p>
                                    </div>
                                    <div className="text-center hidden md:block">
                                        <p className="text-muted-foreground text-xs">Shares</p>
                                        <p className="font-semibold">{content.shares}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </AppShell>
    );
};

export default Relatorios;
