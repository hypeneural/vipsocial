import { useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Download,
    Share2,
    Calendar,
    Users,
    TrendingUp,
    Clock,
    MessageCircle,
    RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
} from "recharts";
import { cn } from "@/lib/utils";

// Mock data for the poll results
const pollData = {
    id: "1",
    question: "Qual a prioridade para melhorias na cidade?",
    status: "active" as const,
    totalVotes: 3000,
    startDate: "2026-01-15",
    endDate: "2026-01-25",
    options: [
        { id: "1a", text: "Transporte público", votes: 1250, percentage: 42, color: "#FF8000" },
        { id: "1b", text: "Saúde", votes: 980, percentage: 33, color: "#22C55E" },
        { id: "1c", text: "Educação", votes: 520, percentage: 17, color: "#3B82F6" },
        { id: "1d", text: "Segurança", votes: 250, percentage: 8, color: "#EAB308" },
    ],
};

const timelineData = [
    { date: "15/01", votes: 120 },
    { date: "16/01", votes: 280 },
    { date: "17/01", votes: 450 },
    { date: "18/01", votes: 680 },
    { date: "19/01", votes: 920 },
    { date: "20/01", votes: 1450 },
    { date: "21/01", votes: 2100 },
    { date: "22/01", votes: 2600 },
    { date: "23/01", votes: 3000 },
];

const hourlyData = [
    { hour: "00h", votes: 45 },
    { hour: "03h", votes: 20 },
    { hour: "06h", votes: 80 },
    { hour: "09h", votes: 320 },
    { hour: "12h", votes: 450 },
    { hour: "15h", votes: 380 },
    { hour: "18h", votes: 520 },
    { hour: "21h", votes: 285 },
];

const EnqueteResultados = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const handleExportCSV = () => {
        const csvContent = [
            ["Opção", "Votos", "Porcentagem"],
            ...pollData.options.map((opt) => [opt.text, opt.votes, `${opt.percentage}%`]),
        ]
            .map((row) => row.join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `enquete-${pollData.id}-resultados.csv`;
        a.click();
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
                    to="/engajamento/enquetes"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Enquetes
                </Link>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <StatusIndicator status="online" size="md" />
                            <Badge className="bg-success/15 text-success border-success/30 text-xs rounded-full">
                                Ativa
                            </Badge>
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold mb-2">{pollData.question}</h1>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(pollData.startDate).toLocaleDateString("pt-BR")} -{" "}
                                {new Date(pollData.endDate).toLocaleDateString("pt-BR")}
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {pollData.totalVotes.toLocaleString()} votos
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
                            Atualizar
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={handleExportCSV}>
                            <Download className="w-4 h-4 mr-2" />
                            Exportar CSV
                        </Button>
                        <Button size="sm" className="rounded-xl">
                            <Share2 className="w-4 h-4 mr-2" />
                            Compartilhar
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl p-4 shadow-lg"
                >
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                        <Users className="w-4 h-4" />
                        Total de Votos
                    </div>
                    <p className="text-2xl font-bold mt-1">{pollData.totalVotes.toLocaleString()}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card rounded-xl p-4 border border-border/50"
                >
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <TrendingUp className="w-4 h-4" />
                        Líder
                    </div>
                    <p className="text-lg font-bold mt-1 truncate">{pollData.options[0].text}</p>
                    <p className="text-sm text-primary font-semibold">{pollData.options[0].percentage}%</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-xl p-4 border border-border/50"
                >
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Clock className="w-4 h-4" />
                        Dias Restantes
                    </div>
                    <p className="text-2xl font-bold mt-1">5</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card rounded-xl p-4 border border-border/50"
                >
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <MessageCircle className="w-4 h-4" />
                        Votos/Dia
                    </div>
                    <p className="text-2xl font-bold mt-1">~375</p>
                </motion.div>
            </div>

            {/* Charts Tabs */}
            <Tabs defaultValue="distribution" className="space-y-4">
                <TabsList className="grid grid-cols-3 w-full md:w-auto md:inline-grid">
                    <TabsTrigger value="distribution">Distribuição</TabsTrigger>
                    <TabsTrigger value="timeline">Evolução</TabsTrigger>
                    <TabsTrigger value="hourly">Por Horário</TabsTrigger>
                </TabsList>

                <TabsContent value="distribution">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Pie Chart */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="chart-container"
                        >
                            <h3 className="text-lg font-semibold mb-4">Gráfico de Pizza</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pollData.options}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ text, percentage }) => `${percentage}%`}
                                        outerRadius={100}
                                        dataKey="votes"
                                    >
                                        {pollData.options.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </motion.div>

                        {/* Bar Chart */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="chart-container"
                        >
                            <h3 className="text-lg font-semibold mb-4">Gráfico de Barras</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={pollData.options} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="text" type="category" width={120} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                                        {pollData.options.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>
                    </div>

                    {/* Options Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="chart-container mt-6"
                    >
                        <h3 className="text-lg font-semibold mb-4">Detalhes por Opção</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                                            Opção
                                        </th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                                            Votos
                                        </th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                                            Porcentagem
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-1/3">
                                            Progresso
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pollData.options.map((option, index) => (
                                        <tr key={option.id} className="border-b border-border/50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: option.color }}
                                                    />
                                                    <span className="font-medium">{option.text}</span>
                                                    {index === 0 && (
                                                        <Badge className="bg-primary/15 text-primary text-[10px]">Líder</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right font-semibold">
                                                {option.votes.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-right font-semibold">{option.percentage}%</td>
                                            <td className="py-3 px-4">
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${option.percentage}%`,
                                                            backgroundColor: option.color,
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </TabsContent>

                <TabsContent value="timeline">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="chart-container"
                    >
                        <h3 className="text-lg font-semibold mb-4">Evolução Temporal dos Votos</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={timelineData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="votes"
                                    stroke="#FF8000"
                                    strokeWidth={3}
                                    dot={{ fill: "#FF8000", strokeWidth: 2 }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </motion.div>
                </TabsContent>

                <TabsContent value="hourly">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="chart-container"
                    >
                        <h3 className="text-lg font-semibold mb-4">Distribuição por Horário</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={hourlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="votes" fill="#FF8000" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        <p className="text-sm text-muted-foreground text-center mt-4">
                            Horário de pico: <strong className="text-foreground">18h</strong> com maior
                            engajamento
                        </p>
                    </motion.div>
                </TabsContent>
            </Tabs>
        </AppShell>
    );
};

export default EnqueteResultados;
