import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Image,
    Eye,
    Download,
    Users,
    Calendar,
    Edit,
    Share2,
    Link,
    MessageCircle,
    BarChart3,
    Clock,
    TrendingUp,
    Send,
    ExternalLink,
    FileEdit,
    CheckCircle,
    Archive,
    Camera,
    ImagePlus,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    PhotoGallery,
    GalleryStatus,
    GALLERY_STATUS_CONFIG,
    generateGalleryUrl,
    generateWhatsAppShareMessage,
} from "@/types/galeria";
import { cn } from "@/lib/utils";

// ==========================================
// STATUS ICON
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
const mockGallery: PhotoGallery = {
    id: 1,
    titulo: "Casamento Ana & Pedro",
    descricao: "Cobertura completa do casamento na Fazenda Santa Clara",
    slug: "casamento-ana-pedro-2026",
    banners: [
        { id: 1, url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800", ordem: 0, created_at: "2026-01-20" },
        { id: 2, url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800", ordem: 1, created_at: "2026-01-20" },
    ],
    fotos: Array(48).fill(null).map((_, i) => ({
        id: i + 1,
        url: `https://picsum.photos/800/600?random=${i}`,
        thumbnail_url: `https://picsum.photos/200/150?random=${i}`,
        titulo: `Foto ${i + 1}`,
        ordem: i,
        views: Math.floor(Math.random() * 500) + 50,
        downloads: Math.floor(Math.random() * 50) + 5,
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
        top_photos: [
            { photo_id: 5, views: 156 },
            { photo_id: 12, views: 134 },
            { photo_id: 1, views: 98 },
        ],
        views_by_day: [
            { date: "2026-01-20", views: 450 },
            { date: "2026-01-21", views: 800 },
        ],
        views_by_source: [
            { source: "WhatsApp", views: 920 },
            { source: "Link Direto", views: 280 },
            { source: "Outros", views: 50 },
        ],
    },
    created_at: "2026-01-19",
    updated_at: "2026-01-20",
    published_at: "2026-01-20",
};

// ==========================================
// METRIC CARD
// ==========================================
interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color?: string;
    trend?: string;
}

const MetricCard = ({ title, value, icon: Icon, color = "primary", trend }: MetricCardProps) => (
    <div className="bg-card rounded-xl border p-4">
        <div className="flex items-start justify-between">
            <div className={cn("p-2 rounded-lg bg-muted")}>
                <Icon className={cn("w-5 h-5", color)} />
            </div>
            {trend && (
                <Badge variant="outline" className="text-green-500 text-xs gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {trend}
                </Badge>
            )}
        </div>
        <div className="mt-3">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
        </div>
    </div>
);

// ==========================================
// MAIN COMPONENT
// ==========================================
const GalleryDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [gallery, setGallery] = useState<PhotoGallery | null>(null);

    useEffect(() => {
        // TODO: Fetch from API
        setGallery(mockGallery);
    }, [id]);

    const copyLink = () => {
        if (!gallery) return;
        navigator.clipboard.writeText(generateGalleryUrl(gallery.slug));
        // Show toast
    };

    const shareToWhatsApp = () => {
        if (!gallery) return;
        const message = generateWhatsAppShareMessage(gallery);
        window.open(`https://wa.me/?text=${message}`, "_blank");
    };

    if (!gallery) {
        return (
            <AppShell>
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Carregando...</p>
                </div>
            </AppShell>
        );
    }

    const statusConfig = GALLERY_STATUS_CONFIG[gallery.status];

    return (
        <AppShell>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/cobertura-vip")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-xl md:text-2xl font-bold">{gallery.titulo}</h1>
                                <Badge className={cn("text-white gap-1", statusConfig.color)}>
                                    <StatusIcon status={gallery.status} className="w-3 h-3" />
                                    {statusConfig.label}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {gallery.evento_data && new Date(gallery.evento_data).toLocaleDateString("pt-BR")}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Camera className="w-4 h-4" />
                                    {gallery.fotos.length} fotos
                                </span>
                                <span className="flex items-center gap-1">
                                    <ImagePlus className="w-4 h-4" />
                                    {gallery.banners.length} banner(s)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={copyLink}>
                            <Link className="w-4 h-4 mr-2" />
                            Copiar Link
                        </Button>
                        <Button variant="outline" size="sm" onClick={shareToWhatsApp}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Compartilhar
                        </Button>
                        <Button size="sm" onClick={() => navigate(`/cobertura-vip/${id}/editar`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Banners Preview */}
            {gallery.banners.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 }}
                    className="mb-6"
                >
                    <h2 className="font-semibold flex items-center gap-2 mb-3">
                        <ImagePlus className="w-5 h-5" />
                        Banners
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {gallery.banners.map((banner, i) => (
                            <div key={banner.id} className="relative aspect-[16/9] rounded-lg overflow-hidden border">
                                <img src={banner.url} alt={`Banner ${i + 1}`} className="w-full h-full object-cover" />
                                <Badge variant="secondary" className="absolute bottom-2 left-2 text-xs">
                                    Banner {i + 1}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Metrics */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
            >
                <MetricCard
                    title="Total Views"
                    value={gallery.metrics?.total_views.toLocaleString() || 0}
                    icon={Eye}
                    color="text-blue-500"
                    trend="+12%"
                />
                <MetricCard
                    title="Visitantes Únicos"
                    value={gallery.metrics?.unique_visitors || 0}
                    icon={Users}
                    color="text-primary"
                />
                <MetricCard
                    title="Downloads"
                    value={gallery.metrics?.total_downloads || 0}
                    icon={Download}
                    color="text-purple-500"
                />
                <MetricCard
                    title="Tempo Médio"
                    value={gallery.metrics?.avg_time_on_gallery || "0:00"}
                    icon={Clock}
                    color="text-orange-500"
                />
                <MetricCard
                    title="Grupos WhatsApp"
                    value={gallery.grupos_whatsapp.length}
                    icon={MessageCircle}
                    color="text-green-500"
                />
            </motion.div>

            {/* Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Photo Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2"
                >
                    <div className="bg-card rounded-xl border p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold flex items-center gap-2">
                                <Camera className="w-5 h-5" />
                                Fotos ({gallery.fotos.length})
                            </h2>
                            <Button variant="outline" size="sm" onClick={() => window.open(generateGalleryUrl(gallery.slug), "_blank")}>
                                Ver Galeria
                                <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[400px] overflow-y-auto">
                            {gallery.fotos.slice(0, 24).map((photo) => (
                                <div
                                    key={photo.id}
                                    className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                                >
                                    <img
                                        src={photo.thumbnail_url || photo.url}
                                        alt=""
                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="text-white text-xs text-center">
                                            <Eye className="w-4 h-4 mx-auto mb-1" />
                                            {photo.views}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {gallery.fotos.length > 24 && (
                            <p className="text-center text-sm text-muted-foreground mt-4">
                                +{gallery.fotos.length - 24} fotos adicionais
                            </p>
                        )}
                    </div>
                </motion.div>

                {/* Sidebar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-6"
                >
                    {/* Views by Source */}
                    <div className="bg-card rounded-xl border p-4">
                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                            <BarChart3 className="w-5 h-5" />
                            Origem dos Acessos
                        </h3>
                        <div className="space-y-3">
                            {gallery.metrics?.views_by_source.map((source, i) => {
                                const total = gallery.metrics?.total_views || 1;
                                const percentage = Math.round((source.views / total) * 100);
                                return (
                                    <div key={i}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span>{source.source}</span>
                                            <span className="text-muted-foreground">{source.views} ({percentage}%)</span>
                                        </div>
                                        <Progress value={percentage} className="h-2" />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* WhatsApp Groups */}
                    <div className="bg-card rounded-xl border p-4">
                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                            <MessageCircle className="w-5 h-5 text-green-500" />
                            Grupos Vinculados
                        </h3>
                        <div className="space-y-2">
                            {gallery.grupos_whatsapp.map((group) => (
                                <div key={group.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium">{group.nome}</p>
                                        <p className="text-xs text-muted-foreground">{group.membros} membros</p>
                                    </div>
                                    {group.link_enviado_em ? (
                                        <Badge variant="outline" className="text-xs text-green-500 gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Enviado
                                        </Badge>
                                    ) : (
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Photos */}
                    <div className="bg-card rounded-xl border p-4">
                        <h3 className="font-semibold flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5" />
                            Fotos Mais Vistas
                        </h3>
                        <div className="space-y-2">
                            {gallery.metrics?.top_photos.slice(0, 3).map((item, i) => {
                                const photo = gallery.fotos.find((p) => p.id === item.photo_id);
                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-lg font-bold text-muted-foreground w-6">{i + 1}</span>
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                                            {photo && (
                                                <img
                                                    src={photo.thumbnail_url || photo.url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Foto #{item.photo_id}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                {item.views} views
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AppShell>
    );
};

export default GalleryDetail;
