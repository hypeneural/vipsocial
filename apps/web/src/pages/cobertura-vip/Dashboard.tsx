import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Search,
    Image,
    Eye,
    Download,
    Users,
    Calendar,
    MoreVertical,
    Edit,
    Trash2,
    Link,
    BarChart3,
    Filter,
    MessageCircle,
    FileEdit,
    CheckCircle,
    Archive,
    Camera,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    PhotoGallery,
    GalleryStatus,
    GALLERY_STATUS_CONFIG,
    generateGalleryUrl,
} from "@/types/galeria";
import { cn } from "@/lib/utils";

// ==========================================
// STATUS ICON COMPONENT
// ==========================================
const StatusIcon = ({ status, className }: { status: GalleryStatus; className?: string }) => {
    switch (status) {
        case 'rascunho':
            return <FileEdit className={cn("w-4 h-4", className)} />;
        case 'ativa':
            return <CheckCircle className={cn("w-4 h-4", className)} />;
        case 'arquivada':
            return <Archive className={cn("w-4 h-4", className)} />;
    }
};

// ==========================================
// MOCK DATA
// ==========================================
const mockGalleries: PhotoGallery[] = [
    {
        id: 1,
        titulo: "Casamento Ana & Pedro",
        descricao: "Cobertura completa do casamento na Fazenda Santa Clara",
        slug: "casamento-ana-pedro-2026",
        banners: [
            { id: 1, url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800", ordem: 0, created_at: "2026-01-20" }
        ],
        fotos: Array(48).fill(null).map((_, i) => ({
            id: i + 1,
            url: `https://picsum.photos/800/600?random=${i}`,
            thumbnail_url: `https://picsum.photos/200/150?random=${i}`,
            ordem: i,
            views: Math.floor(Math.random() * 500),
            downloads: Math.floor(Math.random() * 50),
            created_at: "2026-01-20",
        })),
        grupos_whatsapp: [
            { id: 1, nome: "Família Silva", membros: 45, link_enviado_em: "2026-01-20 18:00" },
            { id: 2, nome: "Amigos Noivos", membros: 32, link_enviado_em: "2026-01-20 18:05" },
        ],
        status: "ativa",
        evento_data: "2026-01-18",
        metrics: {
            total_views: 1250,
            unique_visitors: 89,
            total_downloads: 342,
            avg_time_on_gallery: "4:32",
            top_photos: [],
            views_by_day: [],
            views_by_source: [],
        },
        created_at: "2026-01-19",
        updated_at: "2026-01-20",
        published_at: "2026-01-20",
    },
    {
        id: 2,
        titulo: "Formatura Medicina UFPE 2025",
        descricao: "Cerimônia de colação de grau turma 2025.2",
        slug: "formatura-medicina-ufpe-2025",
        banners: [
            { id: 1, url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800", ordem: 0, created_at: "2026-01-15" }
        ],
        fotos: Array(120).fill(null).map((_, i) => ({
            id: i + 100,
            url: `https://picsum.photos/800/600?random=${i + 100}`,
            ordem: i,
            views: Math.floor(Math.random() * 200),
            downloads: Math.floor(Math.random() * 30),
            created_at: "2026-01-15",
        })),
        grupos_whatsapp: [
            { id: 3, nome: "Turma Medicina 2025", membros: 156 },
        ],
        status: "ativa",
        evento_data: "2026-01-14",
        metrics: {
            total_views: 4520,
            unique_visitors: 312,
            total_downloads: 1890,
            avg_time_on_gallery: "6:15",
            top_photos: [],
            views_by_day: [],
            views_by_source: [],
        },
        created_at: "2026-01-12",
        updated_at: "2026-01-15",
        published_at: "2026-01-15",
    },
    {
        id: 3,
        titulo: "Aniversário 15 Anos - Júlia",
        descricao: "Festa de debutante no Buffet Imperial",
        slug: "15-anos-julia-2026",
        banners: [],
        fotos: Array(65).fill(null).map((_, i) => ({
            id: i + 200,
            url: `https://picsum.photos/800/600?random=${i + 200}`,
            ordem: i,
            views: 0,
            downloads: 0,
            created_at: "2026-01-21",
        })),
        grupos_whatsapp: [],
        status: "rascunho",
        evento_data: "2026-01-20",
        created_at: "2026-01-21",
        updated_at: "2026-01-21",
    },
];

// ==========================================
// GALLERY CARD
// ==========================================
interface GalleryCardProps {
    gallery: PhotoGallery;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onViewMetrics: () => void;
}

const GalleryCard = ({ gallery, onView, onEdit, onDelete, onViewMetrics }: GalleryCardProps) => {
    const statusConfig = GALLERY_STATUS_CONFIG[gallery.status];
    const coverUrl = gallery.banners[0]?.url || null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-shadow"
        >
            {/* Cover Image */}
            <div
                className="relative h-40 bg-muted cursor-pointer"
                onClick={onView}
            >
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={gallery.titulo}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                )}
                <div className="absolute top-2 left-2">
                    <Badge className={cn("text-xs text-white gap-1", statusConfig.color)}>
                        <StatusIcon status={gallery.status} className="w-3 h-3" />
                        {statusConfig.label}
                    </Badge>
                </div>
                <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs gap-1">
                        <Camera className="w-3 h-3" />
                        {gallery.fotos.length} fotos
                    </Badge>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm line-clamp-1">{gallery.titulo}</h3>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onView}>
                                <Eye className="w-4 h-4 mr-2" />
                                Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onEdit}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onViewMetrics}>
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Métricas
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(generateGalleryUrl(gallery.slug))}>
                                <Link className="w-4 h-4 mr-2" />
                                Copiar Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {gallery.evento_data && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(gallery.evento_data).toLocaleDateString("pt-BR")}
                    </p>
                )}

                {/* Stats */}
                {gallery.metrics && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {gallery.metrics.total_views.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {gallery.metrics.total_downloads.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {gallery.metrics.unique_visitors}
                        </span>
                    </div>
                )}

                {/* WhatsApp Groups */}
                {gallery.grupos_whatsapp.length > 0 && (
                    <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-muted-foreground">
                            {gallery.grupos_whatsapp.length} grupo(s) vinculado(s)
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const CoberturaVipDashboard = () => {
    const navigate = useNavigate();
    const [galleries] = useState<PhotoGallery[]>(mockGalleries);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<GalleryStatus | "all">("all");

    // Filtered galleries
    const filteredGalleries = galleries.filter((gallery) => {
        const matchesSearch = gallery.titulo.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" || gallery.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Stats
    const stats = {
        total: galleries.length,
        ativas: galleries.filter((g) => g.status === "ativa").length,
        totalViews: galleries.reduce((sum, g) => sum + (g.metrics?.total_views || 0), 0),
        totalDownloads: galleries.reduce((sum, g) => sum + (g.metrics?.total_downloads || 0), 0),
    };

    return (
        <AppShell>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                            <Image className="w-6 h-6" />
                            Cobertura VIP
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Gestão de galerias de fotos
                        </p>
                    </div>
                    <Button onClick={() => navigate("/cobertura-vip/novo")} className="rounded-xl">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Galeria
                    </Button>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
            >
                <div className="bg-card rounded-xl border p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Image className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Total Galerias</p>
                    </div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="bg-card rounded-xl border p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <p className="text-sm text-muted-foreground">Galerias Ativas</p>
                    </div>
                    <p className="text-2xl font-bold text-green-500">{stats.ativas}</p>
                </div>
                <div className="bg-card rounded-xl border p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-4 h-4 text-blue-500" />
                        <p className="text-sm text-muted-foreground">Total Views</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-500">{stats.totalViews.toLocaleString()}</p>
                </div>
                <div className="bg-card rounded-xl border p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Download className="w-4 h-4 text-purple-500" />
                        <p className="text-sm text-muted-foreground">Total Downloads</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-500">{stats.totalDownloads.toLocaleString()}</p>
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-3 mb-6"
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar galeria..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as GalleryStatus | "all")}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {Object.entries(GALLERY_STATUS_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                                <span className="flex items-center gap-2">
                                    <StatusIcon status={key as GalleryStatus} />
                                    {config.label}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </motion.div>

            {/* Gallery Grid */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                {filteredGalleries.length === 0 ? (
                    <div className="text-center py-12">
                        <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">Nenhuma galeria encontrada</p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => navigate("/cobertura-vip/novo")}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Criar primeira galeria
                        </Button>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredGalleries.map((gallery) => (
                            <GalleryCard
                                key={gallery.id}
                                gallery={gallery}
                                onView={() => navigate(`/cobertura-vip/${gallery.id}`)}
                                onEdit={() => navigate(`/cobertura-vip/${gallery.id}/editar`)}
                                onDelete={() => console.log("Delete", gallery.id)}
                                onViewMetrics={() => navigate(`/cobertura-vip/${gallery.id}/metricas`)}
                            />
                        ))}
                    </div>
                )}
            </motion.div>
        </AppShell>
    );
};

export default CoberturaVipDashboard;
