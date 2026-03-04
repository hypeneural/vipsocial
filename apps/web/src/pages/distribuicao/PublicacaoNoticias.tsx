import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Newspaper,
    Search,
    Filter,
    ExternalLink,
    Clock,
    MessageCircle,
    CheckCircle,
    XCircle,
    Calendar,
    MoreVertical,
    Check,
    X,
    Edit,
    Eye,
    RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Shimmer, ShimmerCard } from "@/components/Shimmer";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

import {
    useNewsArticles,
    usePublicationStats,
    useCategories,
    useUpdatePublicationStatus,
    useUpdateObservation,
    useMarkAllPublished,
} from "@/hooks/usePublicacao";

import {
    NewsArticle,
    SocialPlatform,
    PublicationStatus,
    platformConfig,
    statusConfig,
    NewsFilters,
} from "@/services/publicacao.service";

// ==========================================
// PLATFORM ICONS (Lucide alternatives)
// ==========================================

const PlatformIcon = ({ platform, className }: { platform: SocialPlatform; className?: string }) => {
    const icons: Record<SocialPlatform, React.ReactNode> = {
        facebook: <span className={className}>FB</span>,
        youtube: <span className={className}>YT</span>,
        instagram: <span className={className}>IG</span>,
        linkedin: <span className={className}>IN</span>,
        tiktok: <span className={className}>TT</span>,
        twitter: <span className={className}>X</span>,
    };
    return <>{icons[platform]}</>;
};

// ==========================================
// STATUS BADGE COMPONENT
// ==========================================

function StatusBadge({
    platform,
    status,
    publishedAt,
    onClick,
}: {
    platform: SocialPlatform;
    status: PublicationStatus;
    publishedAt?: string;
    onClick?: () => void;
}) {
    const pConfig = platformConfig[platform];
    const sConfig = statusConfig[status];

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    onClick={onClick}
                    className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all",
                        "hover:scale-105 active:scale-95",
                        status === "published" && pConfig.bgColor + " text-white",
                        status === "pending" && "bg-warning/20 text-warning border border-warning/30",
                        status === "scheduled" && "bg-info/20 text-info border border-info/30",
                        status === "failed" && "bg-destructive/20 text-destructive border border-destructive/30",
                        status === "not_applicable" && "bg-muted text-muted-foreground"
                    )}
                >
                    <PlatformIcon platform={platform} />
                </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-center">
                <p className="font-semibold">{pConfig.label}</p>
                <p className="text-xs">{sConfig.icon} {sConfig.label}</p>
                {publishedAt && (
                    <p className="text-xs text-muted-foreground">
                        {format(new Date(publishedAt), "dd/MM HH:mm")}
                    </p>
                )}
            </TooltipContent>
        </Tooltip>
    );
}

// ==========================================
// NEWS CARD COMPONENT
// ==========================================

function NewsCard({
    news,
    onEdit,
    onViewDetails,
}: {
    news: NewsArticle;
    onEdit: (news: NewsArticle, platform?: SocialPlatform) => void;
    onViewDetails: (news: NewsArticle) => void;
}) {
    const markAllPublished = useMarkAllPublished();
    const publishedCount = news.publications.filter(p => p.status === "published").length;
    const totalPlatforms = news.publications.length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-lg transition-shadow"
        >
            <div className="flex flex-col md:flex-row">
                {/* Thumbnail */}
                <div className="w-full md:w-48 h-32 md:h-auto flex-shrink-0">
                    <img
                        src={news.thumbnail}
                        alt={news.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                    {news.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(news.publishedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </span>
                            </div>
                            <h3 className="font-semibold line-clamp-2 mb-2">{news.title}</h3>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onViewDetails(news)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.open(news.url, "_blank")}>
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Ver no Site
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => markAllPublished.mutate(news.id)}
                                    disabled={markAllPublished.isPending}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Marcar Tudo Publicado
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Social Status Grid */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {news.publications.map((pub) => (
                            <StatusBadge
                                key={pub.platform}
                                platform={pub.platform}
                                status={pub.status}
                                publishedAt={pub.publishedAt}
                                onClick={() => onEdit(news, pub.platform)}
                            />
                        ))}
                    </div>

                    {/* Progress & Observation */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-success transition-all"
                                    style={{ width: `${(publishedCount / totalPlatforms) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {publishedCount}/{totalPlatforms}
                            </span>
                        </div>

                        {news.observation && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground max-w-[200px] truncate">
                                <MessageCircle className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{news.observation}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ==========================================
// EDIT STATUS MODAL
// ==========================================

function EditStatusModal({
    news,
    platform,
    isOpen,
    onClose,
}: {
    news: NewsArticle | null;
    platform: SocialPlatform | null;
    isOpen: boolean;
    onClose: () => void;
}) {
    const updateStatus = useUpdatePublicationStatus();
    const updateObservation = useUpdateObservation();
    const [status, setStatus] = useState<PublicationStatus>("pending");
    const [postUrl, setPostUrl] = useState("");
    const [observation, setObservation] = useState("");

    // Load current values when dialog opens
    useState(() => {
        if (news && platform) {
            const pub = news.publications.find(p => p.platform === platform);
            if (pub) {
                setStatus(pub.status);
                setPostUrl(pub.postUrl || "");
            }
            setObservation(news.observation || "");
        }
    });

    const handleSave = () => {
        if (!news || !platform) return;

        updateStatus.mutate(
            {
                newsId: news.id,
                platform,
                data: {
                    status,
                    postUrl: postUrl || undefined,
                    publishedAt: status === "published" ? new Date().toISOString() : undefined,
                },
            },
            {
                onSuccess: () => {
                    if (observation !== news.observation) {
                        updateObservation.mutate({ newsId: news.id, observation });
                    }
                    onClose();
                },
            }
        );
    };

    if (!news || !platform) return null;

    const pConfig = platformConfig[platform];

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose()}>
            <DialogContent className="rounded-2xl max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold", pConfig.bgColor)}>
                            <PlatformIcon platform={platform} />
                        </div>
                        {pConfig.label}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="p-3 bg-muted/30 rounded-xl">
                        <p className="text-sm font-medium line-clamp-2">{news.title}</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={(v) => setStatus(v as PublicationStatus)}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(statusConfig).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>
                                        {config.icon} {config.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {status === "published" && (
                        <div className="space-y-2">
                            <Label>URL do Post (opcional)</Label>
                            <Input
                                placeholder="https://..."
                                value={postUrl}
                                onChange={(e) => setPostUrl(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Observação</Label>
                        <Textarea
                            placeholder="Notas sobre esta publicação..."
                            value={observation}
                            onChange={(e) => setObservation(e.target.value)}
                            className="rounded-xl resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" className="rounded-xl" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        className="rounded-xl"
                        onClick={handleSave}
                        disabled={updateStatus.isPending}
                    >
                        {updateStatus.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ==========================================
// STATS CARDS
// ==========================================

function StatsCards() {
    const { data: stats, isLoading } = usePublicationStats();

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                    <Shimmer key={i} className="h-24 rounded-2xl" />
                ))}
            </div>
        );
    }

    if (!stats) return null;

    const statItems = [
        { label: "Total Notícias", value: stats.total, icon: Newspaper, color: "text-primary" },
        { label: "Publicados", value: stats.published, icon: CheckCircle, color: "text-success" },
        { label: "Pendentes", value: stats.pending, icon: Clock, color: "text-warning" },
        { label: "% Completo", value: `${Math.round((stats.published / (stats.total * 6)) * 100)}%`, icon: RefreshCw, color: "text-info" },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {statItems.map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-2xl border border-border/50 p-4"
                >
                    <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center", stat.color)}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

const PublicacaoNoticias = () => {
    const [filters, setFilters] = useState<NewsFilters>({});
    const [search, setSearch] = useState("");
    const [editModal, setEditModal] = useState<{
        news: NewsArticle | null;
        platform: SocialPlatform | null;
    }>({ news: null, platform: null });

    const { data: categories } = useCategories();
    const { data: newsData, isLoading, refetch } = useNewsArticles({
        ...filters,
        search: search || undefined,
    });

    const handleEdit = (news: NewsArticle, platform?: SocialPlatform) => {
        setEditModal({ news, platform: platform || "facebook" });
    };

    const handleViewDetails = (news: NewsArticle) => {
        window.open(news.url, "_blank");
    };

    return (
        <AppShell>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                            <Newspaper className="w-6 h-6 text-primary" />
                            Gestão de Publicações
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Controle a distribuição de notícias nas redes sociais
                        </p>
                    </div>

                    <Button variant="outline" className="rounded-xl" onClick={() => refetch()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Atualizar
                    </Button>
                </div>
            </motion.div>

            {/* Stats */}
            <StatsCards />

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar notícias..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 rounded-xl"
                    />
                </div>

                <Select
                    value={filters.category || "all"}
                    onValueChange={(v) => setFilters({ ...filters, category: v === "all" ? undefined : v })}
                >
                    <SelectTrigger className="w-full md:w-[180px] rounded-xl">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {categories?.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.status || "all"}
                    onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? undefined : v as PublicationStatus })}
                >
                    <SelectTrigger className="w-full md:w-[180px] rounded-xl">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos Status</SelectItem>
                        {Object.entries(statusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                                {config.icon} {config.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* News List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <ShimmerCard key={i} />
                    ))}
                </div>
            ) : newsData?.data.length === 0 ? (
                <EmptyState
                    icon={Newspaper}
                    title="Nenhuma notícia encontrada"
                    description="Tente ajustar os filtros ou aguarde novas publicações"
                />
            ) : (
                <div className="space-y-4">
                    {newsData?.data.map((news) => (
                        <NewsCard
                            key={news.id}
                            news={news}
                            onEdit={handleEdit}
                            onViewDetails={handleViewDetails}
                        />
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            <EditStatusModal
                news={editModal.news}
                platform={editModal.platform}
                isOpen={!!editModal.news}
                onClose={() => setEditModal({ news: null, platform: null })}
            />
        </AppShell>
    );
};

export default PublicacaoNoticias;
