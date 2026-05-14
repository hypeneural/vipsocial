import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Users,
    Package,
    FileText,
    MessageSquare,
    Phone,
    ExternalLink,
    Loader2,
    Newspaper,
    PartyPopper,
    Camera,
    Mic,
    CalendarCheck,
    CheckCircle2,
    Clock,
    XCircle,
    AlertTriangle,
    Edit,
    History,
    ArrowRightLeft,
    User,
    Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    useExterna,
    useEventStatuses,
    useChangeEventStatus,
    useDeleteExterna,
    useUpdateChecklist,
    useEventLogs,
    useVipGalleryOptions,
} from "@/hooks/useExternas";
import { generateGoogleCalendarUrl, generateWhatsAppUrl } from "@/types/externas";
import type { ActivityLog } from "@/services/externa.service";
import { cn } from "@/lib/utils";
import { deriveVipLogoMode, FALLBACK_VIP_GROUPS, vipGalleryStatusLabel, vipGroupLabel } from "@/features/externas/vipGallery";
import { formatEventDateRange } from "@/features/externas/event-date-utils";

// ==========================================
// ICON MAP
// ==========================================
const iconMap: Record<string, LucideIcon> = {
    Newspaper, PartyPopper, Camera, Mic, FileText, CalendarCheck,
    CheckCircle2, Clock, XCircle, Package, AlertTriangle,
};

function DynIcon({ name, className }: { name?: string; className?: string }) {
    const Icon = (name && iconMap[name]) || FileText;
    return <Icon className={className} />;
}

// ==========================================
// SMART DATE FORMATTER
// ==========================================
const formatDateRange = (start: string, end?: string | null): string => {
    const s = new Date(start);
    const weekday = s.toLocaleDateString("pt-BR", { weekday: "long" });
    const day = s.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const startTime = s.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    let result = `${weekday}, ${day} às ${startTime}`;

    if (end) {
        const e = new Date(end);
        const endTime = e.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        if (s.toDateString() === e.toDateString()) {
            result += ` até ${endTime}`;
        } else {
            const endWeekday = e.toLocaleDateString("pt-BR", { weekday: "long" });
            const endDay = e.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
            result += ` até ${endWeekday}, ${endDay} às ${endTime}`;
        }
    }

    return result;
};

// ==========================================
// ACTIVITY LOG ICONS
// ==========================================
const actionIcons: Record<string, { icon: LucideIcon; color: string }> = {
    created: { icon: CalendarCheck, color: "bg-green-500" },
    updated: { icon: Edit, color: "bg-blue-500" },
    status_changed: { icon: ArrowRightLeft, color: "bg-amber-500" },
    deleted: { icon: Trash2, color: "bg-destructive" },
    vip_gallery_slideshow_updated: { icon: Camera, color: "bg-sky-600" },
};

const isSlideshowSnapshot = (value: unknown): value is Record<string, unknown> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const snapshot = value as Record<string, unknown>;

    return (
        "external_event_id" in snapshot
        && "layout" in snapshot
        && "interval_ms" in snapshot
        && "queue_limit" in snapshot
        && "status" in snapshot
    );
};

const formatActivityLogValue = (value: unknown): string => {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    if (typeof value === "boolean") {
        return value ? "Sim" : "Não";
    }

    if (typeof value === "number" || typeof value === "string") {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value.map((entry) => formatActivityLogValue(entry)).join(", ");
    }

    if (isSlideshowSnapshot(value)) {
        const intervalSeconds = Math.max(1, Math.round(Number(value.interval_ms || 0) / 1000));

        return [
            `Ativo: ${value.is_enabled ? "Sim" : "Não"}`,
            `Status: ${String(value.status || "draft")}`,
            `Layout: ${String(value.layout || "auto")}`,
            `Velocidade: ${intervalSeconds}s`,
            `Fila: ${String(value.queue_limit || 0)}`,
            `Crédito: ${value.show_sender_credit ? "Sim" : "Não"}`,
        ].join(" | ");
    }

    try {
        return JSON.stringify(value);
    } catch {
        return "[valor complexo]";
    }
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const EventDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const eventId = Number(id);

    // Queries
    const { data: eventData, isLoading, error } = useExterna(eventId);
    const { data: statusesData } = useEventStatuses();
    const { data: logsData } = useEventLogs(eventId);
    const { data: vipOptionsData } = useVipGalleryOptions();

    // Mutations
    const changeStatus = useChangeEventStatus();
    const deleteEvent = useDeleteExterna();
    const updateChecklist = useUpdateChecklist();

    const event = eventData?.data;
    const statuses = statusesData?.data || [];
    const logs: ActivityLog[] = logsData?.data || [];
    const vipGroups = vipOptionsData?.data.groups?.length ? vipOptionsData.data.groups : FALLBACK_VIP_GROUPS;
    const noLogoSentinel = vipOptionsData?.data.no_logo_sentinel || "__none__";

    // Local checklist state
    const [localChecklist, setLocalChecklist] = useState<Record<number, boolean>>({});
    const [checklistInit, setChecklistInit] = useState(false);

    // Status change modal state
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Initialize checklist from event data
    useEffect(() => {
        if (event && !checklistInit) {
            const initial: Record<number, boolean> = {};
            event.equipment?.forEach((eq) => {
                initial[eq.id] = eq.pivot?.checked ?? false;
            });
            setLocalChecklist(initial);
            setChecklistInit(true);
        }
    }, [event, checklistInit]);

    // ── Status change with modal ──────────────
    const handleStatusSelect = (newStatusId: string) => {
        setPendingStatusId(newStatusId);
        setStatusModalOpen(true);
    };

    const confirmStatusChange = () => {
        if (!event || !pendingStatusId) return;
        const newStatus = statuses.find((s) => s.id === Number(pendingStatusId));
        changeStatus.mutate(
            { id: event.id, status_id: Number(pendingStatusId) },
            {
                onSuccess: () => {
                    setStatusModalOpen(false);
                    setPendingStatusId(null);
                },
            }
        );
    };

    const handleToggleCheck = (equipId: number) => {
        const newChecklist = { ...localChecklist, [equipId]: !localChecklist[equipId] };
        setLocalChecklist(newChecklist);
        if (event) {
            const equipamentos = event.equipment.map((eq) => ({
                equipment_id: eq.id,
                checked: eq.id === equipId ? !localChecklist[equipId] : (localChecklist[eq.id] ?? false),
            }));
            updateChecklist.mutate({ id: event.id, equipamentos });
        }
    };

    const openGoogleCalendar = () => {
        if (!event) return;
        window.open(generateGoogleCalendarUrl(event), "_blank");
    };

    const openWhatsApp = () => {
        if (!event?.contato_nome || !event?.contato_whatsapp) return;
        window.open(
            generateWhatsAppUrl(event.contato_nome, event.contato_whatsapp, `Olá ${event.contato_nome}! Sobre o evento "${event.titulo}"...`),
            "_blank"
        );
    };

    const confirmDelete = () => {
        if (!event) return;

        deleteEvent.mutate(event.id, {
            onSuccess: () => {
                setDeleteModalOpen(false);
                navigate("/externas");
            },
        });
    };

    // Loading
    if (isLoading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AppShell>
        );
    }

    // Error
    if (error || !event) {
        return (
            <AppShell>
                <div className="text-center py-20">
                    <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <p className="text-destructive font-medium">Evento não encontrado</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate("/externas")}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                    </Button>
                </div>
            </AppShell>
        );
    }

    const pendingStatus = statuses.find((s) => s.id === Number(pendingStatusId));

    return (
        <AppShell>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/externas")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {event.category && (
                                    <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", event.category.color)}>
                                        <DynIcon name={event.category.icon} className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <h1 className="text-xl md:text-2xl font-bold">{event.titulo}</h1>
                            </div>
                            <p className="text-sm text-muted-foreground">{event.category?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/externas/${event.id}/editar`)}>
                            <Edit className="w-4 h-4 mr-1" /> Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteModalOpen(true)}>
                            <Trash2 className="w-4 h-4 mr-1" /> Deletar Evento
                        </Button>
                    </div>
                </div>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main content — 2 cols */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Status + Date Banner */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-card rounded-xl border p-5"
                    >
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                {event.status && (
                                    <Badge className={cn("text-white px-3 py-1", event.status.color)}>
                                        <DynIcon name={event.status.icon} className="w-3.5 h-3.5 mr-1.5" />
                                        {event.status.name}
                                    </Badge>
                                )}
                            </div>
                            <Select onValueChange={handleStatusSelect}>
                                <SelectTrigger className="w-[180px] rounded-xl h-9 text-sm">
                                    <SelectValue placeholder="Alterar status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.filter(s => s.id !== event.status_id).map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            <span className="flex items-center gap-2">
                                                <span className={cn("w-2 h-2 rounded-full", s.color)} />
                                                {s.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date range */}
                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                            <p className="text-sm font-medium capitalize">
                                {formatEventDateRange(event.data_hora, event.data_hora_fim)}
                            </p>
                        </div>
                    </motion.div>

                    {/* Briefing */}
                    {event.briefing && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="bg-card rounded-xl border p-5"
                        >
                            <h2 className="font-semibold flex items-center gap-2 mb-3">
                                <FileText className="w-5 h-5" /> Briefing
                            </h2>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.briefing}</p>
                        </motion.div>
                    )}

                    {/* Location */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-card rounded-xl border p-5"
                    >
                        <h2 className="font-semibold flex items-center gap-2 mb-3">
                            <MapPin className="w-5 h-5" /> Local
                        </h2>
                        <p className="text-sm font-medium">{event.local}</p>
                        {event.endereco_completo && (
                            <p className="text-sm text-muted-foreground mt-1">{event.endereco_completo}</p>
                        )}
                    </motion.div>

                    {/* Internal notes */}
                    {event.observacao_interna && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                            className="bg-card rounded-xl border p-5"
                        >
                            <h2 className="font-semibold flex items-center gap-2 mb-3">
                                <MessageSquare className="w-5 h-5" /> Notas Internas
                            </h2>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.observacao_interna}</p>
                        </motion.div>
                    )}

                    {/* Activity Log Timeline */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-card rounded-xl border p-5"
                    >
                        <h2 className="font-semibold flex items-center gap-2 mb-4">
                            <History className="w-5 h-5" /> Histórico de Atividades
                        </h2>

                        {logs.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade registrada</p>
                        ) : (
                            <div className="relative">
                                {/* Timeline line */}
                                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />

                                <div className="space-y-4">
                                    {logs.map((log, idx) => {
                                        const actionDef = actionIcons[log.action] || { icon: FileText, color: "bg-gray-500" };
                                        const ActionIcon = actionDef.icon;
                                        const logDate = new Date(log.created_at);

                                        return (
                                            <motion.div
                                                key={log.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="relative flex gap-3 pl-0"
                                            >
                                                {/* Timeline dot */}
                                                <div className={cn("w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 z-10", actionDef.color)}>
                                                    <ActionIcon className="w-3.5 h-3.5 text-white" />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0 pt-0.5">
                                                    <p className="text-sm font-medium">{log.description}</p>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                        {log.user && (
                                                            <span className="flex items-center gap-1">
                                                                <User className="w-3 h-3" />
                                                                {log.user.name}
                                                            </span>
                                                        )}
                                                        <span>
                                                            {logDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                                                            {" "}às{" "}
                                                            {logDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                    </div>

                                                    {/* Changed fields detail */}
                                                    {log.changes && Object.keys(log.changes).length > 0 && (
                                                        <div className="mt-2 space-y-1">
                                                            {Object.entries(log.changes).map(([field, vals]) => (
                                                                <div key={field} className="text-xs bg-muted/50 rounded-md px-2 py-1">
                                                                    <span className="font-medium">{field}:</span>{" "}
                                                                    <span className="text-red-500 line-through">{formatActivityLogValue(vals.de)}</span>{" "}
                                                                    → <span className="text-green-600">{formatActivityLogValue(vals.para)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Sidebar — 1 col */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-card rounded-xl border p-5 space-y-3"
                    >
                        <h2 className="font-semibold text-sm">Ações Rápidas</h2>
                        <Button variant="outline" className="w-full justify-start rounded-xl" onClick={openGoogleCalendar}>
                            <Calendar className="w-4 h-4 mr-2" /> Google Calendar
                            <ExternalLink className="w-3 h-3 ml-auto" />
                        </Button>
                        {event.contato_whatsapp && (
                            <Button variant="outline" className="w-full justify-start rounded-xl" onClick={openWhatsApp}>
                                <Phone className="w-4 h-4 mr-2" /> WhatsApp
                                <ExternalLink className="w-3 h-3 ml-auto" />
                            </Button>
                        )}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                        className="bg-card rounded-xl border p-5"
                    >
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                                <h2 className="font-semibold flex items-center gap-2">
                                    <Camera className="w-5 h-5" /> Cobertura VIP
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Estado administrativo da galeria vinculada ao evento.
                                </p>
                            </div>
                            <Badge variant={event.is_vip_gallery ? "default" : "outline"}>
                                {event.is_vip_gallery ? "Ativa no evento" : "Desativada"}
                            </Badge>
                        </div>

                        {event.is_vip_gallery ? (
                            <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg bg-muted p-3">
                                        <p className="text-xs text-muted-foreground">Status da galeria</p>
                                        <p className="mt-1 font-medium">{vipGalleryStatusLabel(event.vip_gallery_status)}</p>
                                    </div>
                                    <div className="rounded-lg bg-muted p-3">
                                        <p className="text-xs text-muted-foreground">Views</p>
                                        <p className="mt-1 font-medium">{event.views_count || 0}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-muted-foreground">
                                    <p>
                                        <span className="font-medium text-foreground">Slug:</span>{" "}
                                        {event.gallery_slug || "não definido"}
                                    </p>
                                    <p>
                                        <span className="font-medium text-foreground">Grupo WhatsApp:</span>{" "}
                                        {event.whatsapp_group_id || "não definido"}
                                    </p>
                                    <p>
                                        <span className="font-medium text-foreground">Pause command:</span>{" "}
                                        {event.allow_pause_command
                                            ? `habilitado (${event.pause_command_keyword || "Parar,Pausar"})`
                                            : "desabilitado"}
                                    </p>
                                    <p>
                                        <span className="font-medium text-foreground">Delete command:</span>{" "}
                                        {event.allow_delete_command
                                            ? `habilitado (${event.delete_command_keyword || "Apagar"})`
                                            : "desabilitado"}
                                    </p>
                                </div>

                                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                                    <p>Grupo selecionado: {vipGroupLabel(event.whatsapp_group_id, vipGroups)}</p>
                                    <p>
                                        Logo:{" "}
                                        {deriveVipLogoMode(event.custom_logo_path, noLogoSentinel) === "default" && "Padrao do projeto"}
                                        {deriveVipLogoMode(event.custom_logo_path, noLogoSentinel) === "custom" && "Personalizada"}
                                        {deriveVipLogoMode(event.custom_logo_path, noLogoSentinel) === "none" && "Sem logo"}
                                    </p>
                                    <p>Banners ativos: {event.vip_gallery_banners?.length || 0}</p>
                                </div>

                                {(event.vip_gallery_banners?.length || 0) > 0 && (
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {event.vip_gallery_banners?.map((banner) => (
                                            <div key={banner.id} className="overflow-hidden rounded-lg border bg-muted/30">
                                                <img
                                                    src={banner.image_url}
                                                    alt={banner.alt_text || "Banner VIP"}
                                                    className="h-24 w-full object-cover"
                                                />
                                                <div className="px-3 py-2 text-xs text-muted-foreground">
                                                    {banner.alt_text || `Banner #${banner.sort_order}`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {event.gallery_slug && (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start rounded-xl"
                                        onClick={() => window.open(`https://www.coberturavip.com.br/${event.gallery_slug}`, "_blank")}
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Abrir galeria pública
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Este evento ainda não está configurado para receber fotos da Cobertura VIP.
                            </p>
                        )}
                    </motion.div>

                    {/* Contact */}
                    {(event.contato_nome || event.contato_whatsapp) && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="bg-card rounded-xl border p-5"
                        >
                            <h2 className="font-semibold flex items-center gap-2 mb-3">
                                <Phone className="w-5 h-5" /> Contato
                            </h2>
                            {event.contato_nome && <p className="text-sm font-medium">{event.contato_nome}</p>}
                            {event.contato_whatsapp && <p className="text-sm text-muted-foreground">{event.contato_whatsapp}</p>}
                        </motion.div>
                    )}

                    {/* Collaborators */}
                    {event.collaborators && event.collaborators.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="bg-card rounded-xl border p-5"
                        >
                            <h2 className="font-semibold flex items-center gap-2 mb-3">
                                <Users className="w-5 h-5" /> Equipe
                            </h2>
                            <div className="space-y-2">
                                {event.collaborators.map((colab) => (
                                    <div key={colab.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                            {colab.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{colab.name}</p>
                                            {colab.pivot?.funcao && (
                                                <p className="text-xs text-muted-foreground">{colab.pivot.funcao}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Equipment Checklist */}
                    {event.equipment && event.equipment.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                            className="bg-card rounded-xl border p-5"
                        >
                            <h2 className="font-semibold flex items-center gap-2 mb-3">
                                <Package className="w-5 h-5" /> Checklist de Equipamentos
                            </h2>
                            <div className="space-y-2">
                                {event.equipment.map((eq) => (
                                    <label
                                        key={eq.id}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                                    >
                                        <Checkbox
                                            checked={localChecklist[eq.id] ?? false}
                                            onCheckedChange={() => handleToggleCheck(eq.id)}
                                        />
                                        <span className={cn(
                                            "text-sm",
                                            localChecklist[eq.id] && "line-through text-muted-foreground"
                                        )}>
                                            {eq.nome}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground text-center mt-2">
                                {Object.values(localChecklist).filter(Boolean).length}/{event.equipment.length} verificados
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Status Change Confirmation Modal */}
            <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5" />
                            Alterar Status
                        </DialogTitle>
                        <DialogDescription>
                            Confirme a alteração de status do evento.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Status atual</p>
                                {event.status && (
                                    <Badge className={cn("text-white text-xs", event.status.color)}>
                                        <DynIcon name={event.status.icon} className="w-3 h-3 mr-1" />
                                        {event.status.name}
                                    </Badge>
                                )}
                            </div>
                            <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Novo status</p>
                                {pendingStatus && (
                                    <Badge className={cn("text-white text-xs", pendingStatus.color)}>
                                        <DynIcon name={pendingStatus.icon} className="w-3 h-3 mr-1" />
                                        {pendingStatus.name}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setStatusModalOpen(false)}>Cancelar</Button>
                        <Button onClick={confirmStatusChange} disabled={changeStatus.isPending}>
                            {changeStatus.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            Deletar Evento
                        </DialogTitle>
                        <DialogDescription>
                            Esta ação é irreversível. O evento será marcado como deletado e deixará de aparecer no sistema.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                            <p className="font-medium text-destructive">{event.titulo}</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Depois da confirmação, este evento não será mais exibido nas listagens, no detalhe nem nos próximos eventos.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleteEvent.isPending}>
                            {deleteEvent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirmar exclusão
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppShell>
    );
};

export default EventDetail;
