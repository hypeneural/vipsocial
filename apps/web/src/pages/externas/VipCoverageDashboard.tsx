import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Calendar,
    Camera,
    CheckCircle2,
    Download,
    Edit,
    ExternalLink,
    Eye,
    Image,
    Link2,
    Loader2,
    Logs,
    MapPin,
    MessageCircle,
    PauseCircle,
    Plus,
    Search,
    XCircle,
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useDownloadAllVipGalleryPhotos, useVipCoverageEvents, useVipCoverageStats, useVipGalleryOptions } from "@/hooks/useExternas";
import type { VipCoverageEvent, VipGalleryStatus } from "@/types/externas";
import { cn } from "@/lib/utils";
import { FALLBACK_VIP_GROUPS, vipGroupLabel } from "@/features/externas/vipGallery";

const vipStatusConfig: Record<VipGalleryStatus, { label: string; color: string; tone: string }> = {
    draft: {
        label: "Rascunho",
        color: "bg-slate-500",
        tone: "text-slate-600",
    },
    active: {
        label: "Ativa",
        color: "bg-emerald-500",
        tone: "text-emerald-600",
    },
    paused: {
        label: "Pausada",
        color: "bg-amber-500",
        tone: "text-amber-600",
    },
    archived: {
        label: "Arquivada",
        color: "bg-zinc-500",
        tone: "text-zinc-600",
    },
};

function VipStatusIcon({ status, className }: { status: VipGalleryStatus; className?: string }) {
    if (status === "active") {
        return <CheckCircle2 className={className} />;
    }

    if (status === "paused") {
        return <PauseCircle className={className} />;
    }

    if (status === "archived") {
        return <Image className={className} />;
    }

    return <Edit className={className} />;
}

function formatEventDate(value: string): string {
    return new Date(value).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function VipCoverageCard({
    event,
    vipGroups,
    onDownloadAll,
}: {
    event: VipCoverageEvent;
    vipGroups: { value: string; label: string }[];
    onDownloadAll: (event: VipCoverageEvent) => void;
}) {
    const navigate = useNavigate();
    const status = vipStatusConfig[event.vip_gallery_status || "draft"];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Camera className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold">{event.titulo}</h3>
                            <p className="truncate text-xs text-muted-foreground">
                                {event.gallery_slug || "Slug pendente"}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge className={cn("gap-1 text-white", status.color)}>
                            <VipStatusIcon status={event.vip_gallery_status || "draft"} className="h-3.5 w-3.5" />
                            {status.label}
                        </Badge>
                        {event.vip_gallery_public_url && (
                            <Badge variant="outline" className="gap-1">
                                <Link2 className="h-3 w-3" />
                                URL pública pronta
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                    <p>{formatEventDate(event.data_hora)}</p>
                    <p className="mt-1">{event.category?.name || "Sem categoria"}</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-muted/40 p-3">
                <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Fotos</p>
                    <p className="mt-1 text-lg font-semibold">{event.vip_gallery_photos_count}</p>
                </div>
                <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Views</p>
                    <p className="mt-1 text-lg font-semibold text-sky-600">{event.views_count || 0}</p>
                </div>
                <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Downloads</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-600">{event.vip_gallery_downloads_count}</p>
                </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{event.local}</span>
                </p>
                <p className="flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{vipGroupLabel(event.whatsapp_group_id, vipGroups)}</span>
                </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => navigate(`/externas/${event.id}`)}>
                    Ver evento
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => navigate(`/externas/${event.id}/editar`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                </Button>
                {event.vip_gallery_public_url && (
                    <Button
                        className="rounded-xl"
                        onClick={() => window.open(event.vip_gallery_public_url || "", "_blank", "noopener,noreferrer")}
                    >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Abrir galeria
                    </Button>
                )}
                <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => onDownloadAll(event)}
                    disabled={event.vip_gallery_photos_count === 0}
                >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Todas
                </Button>
            </div>
        </motion.div>
    );
}

const VipCoverageDashboard = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | VipGalleryStatus>("all");
    const [downloadEvent, setDownloadEvent] = useState<VipCoverageEvent | null>(null);
    const [downloadResult, setDownloadResult] = useState<{
        download_url: string;
        file_name: string;
        total_files: number;
        generated_at: string;
    } | null>(null);

    const { data: statsData } = useVipCoverageStats();
    const { data: vipOptionsData } = useVipGalleryOptions();
    const downloadAllVipGalleryPhotos = useDownloadAllVipGalleryPhotos();
    const { data: eventsData, isLoading, error } = useVipCoverageEvents({
        per_page: 100,
        search: searchQuery || undefined,
        vip_gallery_status: filterStatus === "all" ? undefined : filterStatus,
    });

    const stats = statsData?.data;
    const events = eventsData?.data || [];
    const vipGroups = vipOptionsData?.data.groups || FALLBACK_VIP_GROUPS;

    const handleOpenDownloadAll = (event: VipCoverageEvent) => {
        setDownloadEvent(event);
        setDownloadResult(null);
        downloadAllVipGalleryPhotos.mutate(event.id, {
            onSuccess: (response) => {
                setDownloadResult(response.data);
                window.open(response.data.download_url, "_blank", "noopener,noreferrer");
            },
        });
    };

    const handleCloseDownloadModal = (open: boolean) => {
        if (open) {
            return;
        }

        setDownloadEvent(null);
        setDownloadResult(null);
    };

    if (error) {
        return (
            <AppShell>
                <div className="py-20 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                        <XCircle className="h-7 w-7 text-destructive" />
                    </div>
                    <p className="font-medium text-destructive">Erro ao carregar a Cobertura VIP</p>
                    <p className="mt-1 text-sm text-muted-foreground">Verifique a API autenticada de externas.</p>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Camera className="h-4 w-4" />
                            </div>
                            Cobertura VIP
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Eventos com galeria VIP configurada dentro do módulo de Externas.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => navigate("/externas/cobertura-vip/logs")} className="rounded-xl">
                            <Logs className="mr-2 h-4 w-4" />
                            Log
                        </Button>
                        <Button onClick={() => navigate("/externas/novo")} className="rounded-xl">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Evento
                        </Button>
                    </div>
                </div>
            </motion.div>

            {stats && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4"
                >
                    <div className="rounded-2xl border bg-card p-4">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                            <Image className="h-4 w-4" />
                            <p className="text-sm">Total Galerias</p>
                        </div>
                        <p className="text-2xl font-bold">{stats.total_galleries}</p>
                    </div>
                    <div className="rounded-2xl border bg-card p-4">
                        <div className="mb-2 flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <p className="text-sm text-muted-foreground">Galerias Ativas</p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600">{stats.active_galleries}</p>
                    </div>
                    <div className="rounded-2xl border bg-card p-4">
                        <div className="mb-2 flex items-center gap-2 text-sky-600">
                            <Eye className="h-4 w-4" />
                            <p className="text-sm text-muted-foreground">Total Views</p>
                        </div>
                        <p className="text-2xl font-bold text-sky-600">{stats.total_views.toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="rounded-2xl border bg-card p-4">
                        <div className="mb-2 flex items-center gap-2 text-emerald-600">
                            <Download className="h-4 w-4" />
                            <p className="text-sm text-muted-foreground">Total Downloads</p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600">{stats.total_downloads.toLocaleString("pt-BR")}</p>
                    </div>
                </motion.div>
            )}

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6 flex flex-col gap-3 lg:flex-row"
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por título, slug ou grupo WhatsApp"
                        className="h-11 rounded-xl pl-10"
                    />
                </div>
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as "all" | VipGalleryStatus)}>
                    <SelectTrigger className="h-11 w-full rounded-xl lg:w-[220px]">
                        <SelectValue placeholder="Status da galeria" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        {Object.entries(vipStatusConfig).map(([value, config]) => (
                            <SelectItem key={value} value={value}>
                                <span className="flex items-center gap-2">
                                    <VipStatusIcon status={value as VipGalleryStatus} className={cn("h-4 w-4", config.tone)} />
                                    {config.label}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </motion.div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : events.length === 0 ? (
                <div className="rounded-3xl border border-dashed bg-card/70 px-6 py-16 text-center">
                    <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/60" />
                    <h2 className="text-lg font-semibold">Nenhuma cobertura VIP encontrada</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Ative a cobertura VIP em um evento de Externas para ele aparecer aqui.
                    </p>
                    <Button variant="outline" className="mt-5 rounded-xl" onClick={() => navigate("/externas/novo")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Criar evento com VIP
                    </Button>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                >
                    {events.map((event) => (
                        <VipCoverageCard
                            key={event.id}
                            event={event}
                            vipGroups={vipGroups}
                            onDownloadAll={handleOpenDownloadAll}
                        />
                    ))}
                </motion.div>
            )}

            <Dialog open={!!downloadEvent} onOpenChange={handleCloseDownloadModal}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Baixar Todas</DialogTitle>
                        <DialogDescription>
                            {downloadEvent
                                ? `Compactando as fotos publicas da cobertura ${downloadEvent.titulo}.`
                                : "Compactando as fotos da cobertura selecionada."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {downloadAllVipGalleryPhotos.isPending && (
                            <div className="flex items-center gap-3 rounded-2xl border bg-muted/40 px-4 py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <div>
                                    <p className="font-medium">Compactando imagens</p>
                                    <p className="text-sm text-muted-foreground">
                                        Aguarde. O link do ZIP sera liberado automaticamente.
                                    </p>
                                </div>
                            </div>
                        )}

                        {downloadResult && (
                            <div className="space-y-3 rounded-2xl border bg-muted/40 p-4">
                                <div>
                                    <p className="font-medium">{downloadResult.file_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {downloadResult.total_files} imagem(ns) compactada(s)
                                    </p>
                                </div>
                                <Input value={downloadResult.download_url} readOnly className="rounded-xl" />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => handleCloseDownloadModal(false)}>
                            Fechar
                        </Button>
                        {downloadResult && (
                            <Button onClick={() => window.open(downloadResult.download_url, "_blank", "noopener,noreferrer")}>
                                <Download className="mr-2 h-4 w-4" />
                                Baixar novamente
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppShell>
    );
};

export default VipCoverageDashboard;
