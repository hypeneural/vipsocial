import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Search,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewsAccordion } from "@/components/distribution/NewsAccordion";
import { NewsGrouped, ChannelType } from "@/types/distribution";

// Mock data
const mockNews: NewsGrouped[] = [
    {
        id: 1,
        title: "Prefeitura anuncia obras de infraestrutura na BR-101",
        link: "https://vipsocial.com.br/noticia/prefeitura-anuncia-obras",
        urlImage: "https://via.placeholder.com/400x200",
        deleted: false,
        total_sent: 4,
        total_failed: 0,
        created_at: "2026-01-20T14:30:00",
        messages: [
            { id: 1, title: "", link: "", urlImage: "", channel: "whatsapp" as ChannelType, destination_name: "VIP Tijucas", status: "sent", sent_at: "2026-01-20T14:30:00", deleted_at: null, error_message: null, created_at: "" },
            { id: 2, title: "", link: "", urlImage: "", channel: "whatsapp" as ChannelType, destination_name: "VIP Itapema", status: "sent", sent_at: "2026-01-20T14:31:00", deleted_at: null, error_message: null, created_at: "" },
            { id: 3, title: "", link: "", urlImage: "", channel: "telegram" as ChannelType, destination_name: "Canal VIP", status: "sent", sent_at: "2026-01-20T14:32:00", deleted_at: null, error_message: null, created_at: "" },
            { id: 4, title: "", link: "", urlImage: "", channel: "instagram" as ChannelType, destination_name: "@vipsocial", status: "sent", sent_at: "2026-01-20T14:35:00", deleted_at: null, error_message: null, created_at: "" },
        ],
    },
    {
        id: 2,
        title: "Acidente na SC-108 causa congestionamento",
        link: "https://vipsocial.com.br/noticia/acidente-sc-108",
        urlImage: "https://via.placeholder.com/400x200",
        deleted: false,
        total_sent: 3,
        total_failed: 1,
        created_at: "2026-01-20T13:15:00",
        messages: [
            { id: 5, title: "", link: "", urlImage: "", channel: "whatsapp" as ChannelType, destination_name: "VIP Tijucas", status: "sent", sent_at: "2026-01-20T13:15:00", deleted_at: null, error_message: null, created_at: "" },
            { id: 6, title: "", link: "", urlImage: "", channel: "whatsapp" as ChannelType, destination_name: "VIP Itapema", status: "sent", sent_at: "2026-01-20T13:16:00", deleted_at: null, error_message: null, created_at: "" },
            { id: 7, title: "", link: "", urlImage: "", channel: "telegram" as ChannelType, destination_name: "Canal VIP", status: "sent", sent_at: "2026-01-20T13:17:00", deleted_at: null, error_message: null, created_at: "" },
            { id: 8, title: "", link: "", urlImage: "", channel: "instagram" as ChannelType, destination_name: "@vipsocial", status: "failed", sent_at: null, deleted_at: null, error_message: "Rate limit exceeded", created_at: "" },
        ],
    },
    {
        id: 3,
        title: "Vacinação contra gripe começa segunda-feira",
        link: "https://vipsocial.com.br/noticia/vacinacao-gripe",
        urlImage: "",
        deleted: true,
        total_sent: 0,
        total_failed: 0,
        created_at: "2026-01-20T11:00:00",
        messages: [
            { id: 9, title: "", link: "", urlImage: "", channel: "whatsapp" as ChannelType, destination_name: "VIP Tijucas", status: "deleted", sent_at: "2026-01-20T11:00:00", deleted_at: "2026-01-20T12:00:00", error_message: null, created_at: "" },
            { id: 10, title: "", link: "", urlImage: "", channel: "telegram" as ChannelType, destination_name: "Canal VIP", status: "deleted", sent_at: "2026-01-20T11:01:00", deleted_at: "2026-01-20T12:00:00", error_message: null, created_at: "" },
        ],
    },
];

const DistributedNewsList = () => {
    const [news] = useState<NewsGrouped[]>(mockNews);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterChannel, setFilterChannel] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);

    // Filter news
    const filteredNews = news.filter((n) => {
        if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (filterChannel !== "all" && !n.messages.some((m) => m.channel === filterChannel)) {
            return false;
        }
        if (filterStatus === "deleted" && !n.deleted) return false;
        if (filterStatus === "active" && n.deleted) return false;
        if (filterStatus === "failed" && !n.messages.some((m) => m.status === "failed")) return false;
        return true;
    });

    const handleDeleteAll = (newsId: number) => {
        if (confirm("Deseja deletar esta notícia de todos os canais?")) {
            console.log("Delete all for news:", newsId);
            // TODO: Call API
        }
    };

    const handleDeleteChannel = (newsId: number, messageId: number) => {
        if (confirm("Deseja deletar esta mensagem específica?")) {
            console.log("Delete message:", messageId, "from news:", newsId);
            // TODO: Call API
        }
    };

    const handleRetry = (newsId: number) => {
        console.log("Retry failed for news:", newsId);
        // TODO: Call API
    };

    const totalPages = 5; // Mock

    return (
        <AppShell>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <Link
                    to="/distribuicao"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Dashboard
                </Link>

                <h1 className="text-xl md:text-2xl font-bold">Notícias Distribuídas</h1>
                <p className="text-sm text-muted-foreground">
                    Acompanhe o status de envio para cada canal
                </p>
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
                        placeholder="Buscar notícia..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-xl bg-secondary/50"
                    />
                </div>
                <select
                    value={filterChannel}
                    onChange={(e) => setFilterChannel(e.target.value)}
                    className="px-4 py-2 border rounded-xl bg-background text-sm"
                >
                    <option value="all">Todos os canais</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border rounded-xl bg-background text-sm"
                >
                    <option value="all">Todos os status</option>
                    <option value="active">Ativas</option>
                    <option value="deleted">Deletadas</option>
                    <option value="failed">Com falhas</option>
                </select>
            </motion.div>

            {/* News List */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4 mb-6"
            >
                {filteredNews.map((newsItem, index) => (
                    <motion.div
                        key={newsItem.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <NewsAccordion
                            news={newsItem}
                            onDeleteAll={handleDeleteAll}
                            onDeleteChannel={handleDeleteChannel}
                            onRetry={handleRetry}
                        />
                    </motion.div>
                ))}

                {filteredNews.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Nenhuma notícia encontrada</p>
                    </div>
                )}
            </motion.div>

            {/* Pagination */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2 pb-20 md:pb-0"
            >
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm px-4">
                    Página {currentPage} de {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-xl"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </motion.div>
        </AppShell>
    );
};

export default DistributedNewsList;
