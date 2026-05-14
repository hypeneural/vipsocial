import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ArrowDown,
    ArrowUp,
    Save,
    Calendar,
    MapPin,
    Users,
    Package,
    FileText,
    MessageSquare,
    Phone,
    ExternalLink,
    Plus,
    X,
    Check,
    Loader2,
    Newspaper,
    PartyPopper,
    Camera,
    Mic,
    CalendarCheck,
    CheckCircle2,
    XCircle,
    Clock,
    Settings2,
    Pencil,
    Trash2,
    AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    useExternas,
    useExterna,
    useCreateExterna,
    useUpdateExterna,
    useEventCategories,
    useEventStatuses,
    useCreateEventCategory,
    useUpdateEventCategory,
    useDeleteEventCategory,
    useCreateEventStatusItem,
    useUpdateEventStatusItem,
    useDeleteEventStatusItem,
    useEquipmentAvailability,
    useVipGalleryOptions,
    useDeleteVipGalleryBanner,
    useReorderVipGalleryBanners,
    useUploadVipGalleryBanners,
    useUploadVipGalleryLogo,
} from "@/hooks/useExternas";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useEquipamentos } from "@/hooks/useEquipamentos";
import showToast from "@/lib/toast";
import type { CreateExternalEventDTO, EquipmentConflict } from "@/services/externa.service";
import type { EventCategory, EventStatusData, VipGalleryBanner, VipGalleryStatus, VipLogoAnchor, VipLogoMode } from "@/types/externas";
import { generateGoogleCalendarUrl, ExternalEvent } from "@/types/externas";
import { cn } from "@/lib/utils";
import {
    DEFAULT_VIP_DELETE_KEYWORDS,
    DEFAULT_VIP_LOGO_ANCHOR,
    DEFAULT_VIP_LOGO_OFFSET_PERCENT,
    DEFAULT_VIP_LOGO_SAFE_AREA_PERCENT,
    DEFAULT_VIP_LOGO_SIZE_PERCENT,
    DEFAULT_VIP_PAUSE_KEYWORDS,
    FALLBACK_VIP_GROUPS,
    deriveVipLogoMode,
    suggestVipGallerySlug,
    VIP_LOGO_ANCHOR_PRESETS,
    VIP_GALLERY_STATUS_LABELS,
    VIP_NO_LOGO_SENTINEL,
} from "@/features/externas/vipGallery";
import {
    formatEventDateTime,
    toEventDateOnly,
    toEventDateTimeLocalInput,
} from "@/features/externas/event-date-utils";

// ==========================================
// ICON MAP & PICKER
// ==========================================
const iconMap: Record<string, LucideIcon> = {
    Newspaper, PartyPopper, Camera, Mic, FileText, CalendarCheck,
    CheckCircle2, Clock, XCircle, Package, AlertTriangle,
};

function DynIcon({ name, className }: { name?: string; className?: string }) {
    const Icon = (name && iconMap[name]) || FileText;
    return <Icon className={className} />;
}

const categoryIconOptions = [
    { name: "Newspaper", label: "Reportagem" },
    { name: "PartyPopper", label: "Evento" },
    { name: "Camera", label: "Fotografia" },
    { name: "Mic", label: "Entrevista" },
    { name: "FileText", label: "Genérico" },
    { name: "Package", label: "Outro" },
];

const categoryColorOptions = [
    { value: "bg-blue-500", label: "Azul" },
    { value: "bg-purple-500", label: "Roxo" },
    { value: "bg-pink-500", label: "Rosa" },
    { value: "bg-green-500", label: "Verde" },
    { value: "bg-amber-500", label: "Amarelo" },
    { value: "bg-red-500", label: "Vermelho" },
    { value: "bg-gray-500", label: "Cinza" },
];

const statusIconOptions = [
    { name: "CalendarCheck", label: "Agendado" },
    { name: "Clock", label: "Em progresso" },
    { name: "CheckCircle2", label: "Concluído" },
    { name: "XCircle", label: "Cancelado" },
    { name: "AlertTriangle", label: "Alerta" },
];

const statusColorOptions = [
    { value: "bg-blue-500", label: "Azul" },
    { value: "bg-amber-500", label: "Amarelo" },
    { value: "bg-emerald-500", label: "Verde" },
    { value: "bg-red-500", label: "Vermelho" },
    { value: "bg-purple-500", label: "Roxo" },
    { value: "bg-gray-500", label: "Cinza" },
];

const vipGalleryStatusOptions: Array<{ value: VipGalleryStatus; label: string }> = [
    { value: "draft", label: VIP_GALLERY_STATUS_LABELS.draft },
    { value: "active", label: VIP_GALLERY_STATUS_LABELS.active },
    { value: "paused", label: VIP_GALLERY_STATUS_LABELS.paused },
    { value: "archived", label: VIP_GALLERY_STATUS_LABELS.archived },
];

// ==========================================
// CRUD MODAL — GENERIC (Category or Status)
// ==========================================
interface CrudModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    items: Array<{ id: number; name: string; icon: string; color: string; events_count?: number }>;
    iconOptions: Array<{ name: string; label: string }>;
    colorOptions: Array<{ value: string; label: string }>;
    onAdd: (data: { name: string; icon: string; color: string }) => void;
    onUpdate: (id: number, data: { name: string; icon: string; color: string }) => void;
    onDelete: (id: number) => void;
    isCreating?: boolean;
    isUpdating?: boolean;
    isDeleting?: boolean;
}

const CrudModal = ({
    open, onOpenChange, title, items, iconOptions, colorOptions,
    onAdd, onUpdate, onDelete, isCreating, isUpdating, isDeleting,
}: CrudModalProps) => {
    const [name, setName] = useState("");
    const [icon, setIcon] = useState(iconOptions[0]?.name || "FileText");
    const [color, setColor] = useState(colorOptions[0]?.value || "bg-gray-500");
    const [editingId, setEditingId] = useState<number | null>(null);

    const handleSave = () => {
        if (!name.trim()) return;
        if (editingId) {
            onUpdate(editingId, { name, icon, color });
        } else {
            onAdd({ name, icon, color });
        }
        resetForm();
    };

    const handleEdit = (item: typeof items[0]) => {
        setEditingId(item.id);
        setName(item.name);
        setIcon(item.icon);
        setColor(item.color);
    };

    const resetForm = () => {
        setEditingId(null);
        setName("");
        setIcon(iconOptions[0]?.name || "FileText");
        setColor(colorOptions[0]?.value || "bg-gray-500");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5" />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                {/* Existing items */}
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", item.color)}>
                                    <DynIcon name={item.icon} className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-medium text-sm">{item.name}</span>
                                {item.events_count !== undefined && item.events_count > 0 && (
                                    <Badge variant="outline" className="text-xs">{item.events_count}</Badge>
                                )}
                            </div>
                            <div className="flex gap-1">
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(item)}>
                                    <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => onDelete(item.id)}
                                    disabled={isDeleting || (item.events_count !== undefined && item.events_count > 0)}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-4">Nenhum item cadastrado</p>
                    )}
                </div>

                {/* Add/Edit form */}
                <div className="border-t pt-4 space-y-3">
                    <p className="text-sm font-medium">{editingId ? "Editar" : "Novo"}</p>
                    <Input
                        placeholder="Nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="rounded-xl"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Ícone</Label>
                            <div className="flex flex-wrap gap-1">
                                {iconOptions.map((opt) => (
                                    <button
                                        key={opt.name}
                                        type="button"
                                        onClick={() => setIcon(opt.name)}
                                        className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
                                            icon === opt.name ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "hover:bg-muted"
                                        )}
                                        title={opt.label}
                                    >
                                        <DynIcon name={opt.name} className="w-4 h-4" />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Cor</Label>
                            <div className="flex flex-wrap gap-1">
                                {colorOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setColor(opt.value)}
                                        className={cn(
                                            "w-8 h-8 rounded-lg transition-all",
                                            opt.value,
                                            color === opt.value ? "ring-2 ring-offset-2 ring-primary" : "opacity-60 hover:opacity-100"
                                        )}
                                        title={opt.label}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    {editingId && (
                        <Button type="button" variant="ghost" onClick={resetForm}>Cancelar edição</Button>
                    )}
                    <Button type="button" onClick={handleSave} disabled={!name.trim() || isCreating || isUpdating}>
                        {(isCreating || isUpdating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingId ? "Salvar" : "Adicionar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const EventForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    // ── Data queries ──────────────────────────
    const { data: categoriesData } = useEventCategories();
    const { data: statusesData } = useEventStatuses();
    const { data: colabData } = useColaboradores({ per_page: 100, "filter[active]": "true" });
    const { data: equipData } = useEquipamentos({ per_page: 100 });
    const { data: existingEvent } = useExterna(isEditing ? Number(id) : 0);
    const { data: vipEventsData } = useExternas({ per_page: 200, is_vip_gallery: true });
    const { data: vipOptionsData } = useVipGalleryOptions();

    const categories = categoriesData?.data || [];
    const statuses = statusesData?.data || [];
    const colaboradores = colabData?.data || [];
    const equipments = equipData?.data || [];
    const vipOptions = vipOptionsData?.data;
    const vipGroupOptions = vipOptions?.groups?.length ? vipOptions.groups : FALLBACK_VIP_GROUPS;
    const vipStatusOptions = vipOptions?.statuses?.length ? vipOptions.statuses : vipGalleryStatusOptions;
    const defaultDeleteKeywords = vipOptions?.default_delete_keywords || DEFAULT_VIP_DELETE_KEYWORDS;
    const defaultPauseKeywords = vipOptions?.default_pause_keywords || DEFAULT_VIP_PAUSE_KEYWORDS;
    const noLogoSentinel = vipOptions?.no_logo_sentinel || VIP_NO_LOGO_SENTINEL;
    const bannerGuidelines = vipOptions?.banner_guidelines;
    const logoDefaults = vipOptions?.logo_defaults;
    const logoAnchorOptions = logoDefaults?.anchors?.length
        ? VIP_LOGO_ANCHOR_PRESETS.filter((preset) => logoDefaults.anchors.includes(preset.value))
        : VIP_LOGO_ANCHOR_PRESETS;
    const logoSizeMin = logoDefaults?.min_size_percent ?? 5;
    const logoSizeMax = logoDefaults?.max_size_percent ?? 25;
    const logoSafeAreaPercent = logoDefaults?.safe_area_percent ?? DEFAULT_VIP_LOGO_SAFE_AREA_PERCENT;
    const logoDefaultOffsetPercent = logoDefaults?.offset_percent ?? DEFAULT_VIP_LOGO_OFFSET_PERCENT;
    const logoDefaultSizePercent = logoDefaults?.size_percent ?? DEFAULT_VIP_LOGO_SIZE_PERCENT;
    const logoDefaultAnchor = logoDefaults?.anchor ?? DEFAULT_VIP_LOGO_ANCHOR;

    // ── Mutations ─────────────────────────────
    const createEvent = useCreateExterna();
    const updateEvent = useUpdateExterna();
    const createCategory = useCreateEventCategory();
    const updateCategory = useUpdateEventCategory();
    const deleteCategory = useDeleteEventCategory();
    const createStatus = useCreateEventStatusItem();
    const updateStatus = useUpdateEventStatusItem();
    const deleteStatus = useDeleteEventStatusItem();
    const uploadVipGalleryLogo = useUploadVipGalleryLogo();
    const uploadVipGalleryBanners = useUploadVipGalleryBanners();
    const deleteVipGalleryBanner = useDeleteVipGalleryBanner();
    const reorderVipGalleryBanners = useReorderVipGalleryBanners();

    // ── Modal state ───────────────────────────
    const [catModalOpen, setCatModalOpen] = useState(false);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [vipGroupConflictOpen, setVipGroupConflictOpen] = useState(false);

    // ── Form state ────────────────────────────
    const [titulo, setTitulo] = useState("");
    const [categoryId, setCategoryId] = useState<number | "">("");
    const [statusId, setStatusId] = useState<number | "">("");
    const [briefing, setBriefing] = useState("");
    const [dataHora, setDataHora] = useState("");
    const [dataHoraFim, setDataHoraFim] = useState("");
    const [local, setLocal] = useState("");
    const [enderecoCompleto, setEnderecoCompleto] = useState("");
    const [contatoNome, setContatoNome] = useState("");
    const [contatoWhatsapp, setContatoWhatsapp] = useState("");
    const [observacaoInterna, setObservacaoInterna] = useState("");
    const [isVipGallery, setIsVipGallery] = useState(false);
    const [vipGalleryStatus, setVipGalleryStatus] = useState<VipGalleryStatus>("draft");
    const [whatsappGroupId, setWhatsappGroupId] = useState("");
    const [gallerySlug, setGallerySlug] = useState("");
    const [vipLogoMode, setVipLogoMode] = useState<VipLogoMode>("default");
    const [customLogoPath, setCustomLogoPath] = useState("");
    const [customLogoPreviewUrl, setCustomLogoPreviewUrl] = useState<string | null>(null);
    const [logoSizePercent, setLogoSizePercent] = useState<number>(DEFAULT_VIP_LOGO_SIZE_PERCENT);
    const [logoAnchor, setLogoAnchor] = useState<VipLogoAnchor>(DEFAULT_VIP_LOGO_ANCHOR);
    const [logoOffsetXPercent, setLogoOffsetXPercent] = useState<number>(DEFAULT_VIP_LOGO_OFFSET_PERCENT);
    const [logoOffsetYPercent, setLogoOffsetYPercent] = useState<number>(DEFAULT_VIP_LOGO_OFFSET_PERCENT);
    const [allowPauseCommand, setAllowPauseCommand] = useState(true);
    const [allowDeleteCommand, setAllowDeleteCommand] = useState(true);
    const [pauseCommandKeyword, setPauseCommandKeyword] = useState(DEFAULT_VIP_PAUSE_KEYWORDS);
    const [deleteCommandKeyword, setDeleteCommandKeyword] = useState(DEFAULT_VIP_DELETE_KEYWORDS);
    const [pendingBannerFiles, setPendingBannerFiles] = useState<File[]>([]);
    const [uploadedVipBanners, setUploadedVipBanners] = useState<VipGalleryBanner[]>([]);
    const [gallerySlugTouched, setGallerySlugTouched] = useState(false);
    const [selectedColabs, setSelectedColabs] = useState<Array<{ user_id: number; nome: string; funcao: string; avatar_url?: string | null }>>([]);
    const [selectedEquips, setSelectedEquips] = useState<number[]>([]);
    const [savedEvent, setSavedEvent] = useState<ExternalEvent | null>(null);
    const categorySelectValue = categoryId === "" ? "__select_category__" : String(categoryId);
    const statusSelectValue = statusId === "" ? "__select_status__" : String(statusId);
    const whatsappGroupSelectValue = whatsappGroupId === "" ? "__select_vip_group__" : whatsappGroupId;
    const persistedEventId = savedEvent?.id || existingEvent?.data?.id || (isEditing ? Number(id) : null);

    // ── Equipment availability check ──────────
    const availabilityParams = useMemo(() => {
        if (!dataHora) return undefined;
        return {
            data_hora: dataHora,
            data_hora_fim: dataHoraFim || undefined,
            exclude_event_id: isEditing ? Number(id) : undefined,
        };
    }, [dataHora, dataHoraFim, isEditing, id]);

    const { data: availabilityData } = useEquipmentAvailability(availabilityParams);
    const conflicts: Record<number, EquipmentConflict[]> = availabilityData?.data || {};
    const vipEvents = vipEventsData?.data || [];
    const vipGroupConflicts = useMemo(() => {
        if (!isVipGallery || !whatsappGroupId || !dataHora) {
            return [];
        }

        const selectedDate = toEventDateOnly(dataHora);
        const currentEventId = isEditing ? Number(id) : null;

        return vipEvents.filter((event) => {
            if (currentEventId && event.id === currentEventId) {
                return false;
            }

            return event.whatsapp_group_id === whatsappGroupId
                && typeof event.data_hora === "string"
                && toEventDateOnly(event.data_hora) === selectedDate;
        });
    }, [dataHora, id, isEditing, isVipGallery, vipEvents, whatsappGroupId]);

    // ── Pre-fill on edit ──────────────────────
    useEffect(() => {
        if (isEditing && existingEvent?.data) {
            const ev = existingEvent.data;
            setTitulo(ev.titulo);
            setCategoryId(ev.category_id);
            setStatusId(ev.status_id);
            setBriefing(ev.briefing || "");
            setDataHora(toEventDateTimeLocalInput(ev.data_hora));
            setDataHoraFim(toEventDateTimeLocalInput(ev.data_hora_fim));
            setLocal(ev.local);
            setEnderecoCompleto(ev.endereco_completo || "");
            setContatoNome(ev.contato_nome || "");
            setContatoWhatsapp(ev.contato_whatsapp || "");
            setObservacaoInterna(ev.observacao_interna || "");
            setIsVipGallery(!!ev.is_vip_gallery);
            setVipGalleryStatus((ev.vip_gallery_status || "draft") as VipGalleryStatus);
            setWhatsappGroupId(ev.whatsapp_group_id || "");
            setGallerySlug(ev.gallery_slug || "");
            setCustomLogoPath(ev.custom_logo_path || "");
            setCustomLogoPreviewUrl(ev.custom_logo_url || null);
            setVipLogoMode(deriveVipLogoMode(ev.custom_logo_path, noLogoSentinel));
            setLogoSizePercent(ev.logo_size_percent || logoDefaultSizePercent);
            setLogoAnchor((ev.logo_anchor || logoDefaultAnchor) as VipLogoAnchor);
            setLogoOffsetXPercent(Number(ev.logo_offset_x_percent || logoDefaultOffsetPercent));
            setLogoOffsetYPercent(Number(ev.logo_offset_y_percent || logoDefaultOffsetPercent));
            setAllowPauseCommand(ev.allow_pause_command ?? true);
            setAllowDeleteCommand(!!ev.allow_delete_command);
            setPauseCommandKeyword(ev.pause_command_keyword || defaultPauseKeywords);
            setDeleteCommandKeyword(ev.delete_command_keyword || defaultDeleteKeywords);
            setUploadedVipBanners(ev.vip_gallery_banners || []);
            setGallerySlugTouched(!!ev.gallery_slug);
            setSelectedColabs(
                ev.collaborators?.map((c) => ({
                    user_id: c.id,
                    nome: c.name,
                    funcao: c.pivot?.funcao || "",
                    avatar_url: c.avatar_url || null,
                })) || []
            );
            setSelectedEquips(ev.equipment?.map((e) => e.id) || []);
        }
    }, [
        isEditing,
        existingEvent,
        defaultDeleteKeywords,
        defaultPauseKeywords,
        logoDefaultAnchor,
        logoDefaultOffsetPercent,
        logoDefaultSizePercent,
        noLogoSentinel,
    ]);

    useEffect(() => {
        if (!isEditing && categories.length && !categoryId) {
            setCategoryId(categories[0].id);
        }
    }, [isEditing, categories, categoryId]);

    useEffect(() => {
        if (!isEditing && statuses.length && !statusId) {
            const agendado = statuses.find((s) => s.slug === "agendado");
            setStatusId(agendado ? agendado.id : statuses[0].id);
        }
    }, [isEditing, statuses, statusId]);

    useEffect(() => {
        if (!isEditing) {
            setDeleteCommandKeyword((current) => current.trim() || defaultDeleteKeywords);
            setPauseCommandKeyword((current) => current.trim() || defaultPauseKeywords);
            setLogoAnchor((current) => current || logoDefaultAnchor);
            setLogoSizePercent((current) => current || logoDefaultSizePercent);
            setLogoOffsetXPercent((current) => current || logoDefaultOffsetPercent);
            setLogoOffsetYPercent((current) => current || logoDefaultOffsetPercent);
        }
    }, [
        defaultDeleteKeywords,
        defaultPauseKeywords,
        isEditing,
        logoDefaultAnchor,
        logoDefaultOffsetPercent,
        logoDefaultSizePercent,
    ]);

    useEffect(() => {
        if (!isVipGallery || gallerySlugTouched) {
            return;
        }

        setGallerySlug(suggestVipGallerySlug(titulo));
    }, [gallerySlugTouched, isVipGallery, titulo]);

    const pendingBannerPreviews = useMemo(
        () => pendingBannerFiles.map((file, index) => ({
            id: `${file.name}-${file.size}-${index}`,
            name: file.name,
            sizeMb: (file.size / 1024 / 1024).toFixed(2),
            url: URL.createObjectURL(file),
        })),
        [pendingBannerFiles]
    );

    useEffect(() => {
        return () => {
            pendingBannerPreviews.forEach((preview) => {
                URL.revokeObjectURL(preview.url);
            });
        };
    }, [pendingBannerPreviews]);

    const previewLogoUrl = vipLogoMode === "custom"
        ? customLogoPreviewUrl
        : vipLogoMode === "default"
            ? (vipOptions?.default_logo_url || null)
            : null;

    const logoPreviewStyle = useMemo(() => {
        const widthPercent = Math.min(Math.max(logoSizePercent || logoDefaultSizePercent, logoSizeMin), logoSizeMax);
        const xPercent = Math.max(logoOffsetXPercent || logoDefaultOffsetPercent, logoSafeAreaPercent);
        const yPercent = Math.max(logoOffsetYPercent || logoDefaultOffsetPercent, logoSafeAreaPercent);
        const style: Record<string, string> = {
            width: `${widthPercent}%`,
            height: "auto",
        };

        const [vertical, horizontal] = logoAnchor.split("_") as [string, string?];
        const resolvedHorizontal = horizontal || "center";

        if (resolvedHorizontal === "left") {
            style.left = `${xPercent}%`;
        } else if (resolvedHorizontal === "right") {
            style.right = `${xPercent}%`;
        } else {
            style.left = "50%";
        }

        if (vertical === "top") {
            style.top = `${yPercent}%`;
        } else if (vertical === "bottom") {
            style.bottom = `${yPercent}%`;
        } else {
            style.top = "50%";
        }

        const transforms: string[] = [];

        if (resolvedHorizontal === "center") {
            transforms.push("translateX(-50%)");
        }

        if (vertical === "center") {
            transforms.push("translateY(-50%)");
        }

        if (transforms.length > 0) {
            style.transform = transforms.join(" ");
        }

        return style;
    }, [
        logoAnchor,
        logoDefaultOffsetPercent,
        logoDefaultSizePercent,
        logoOffsetXPercent,
        logoOffsetYPercent,
        logoSafeAreaPercent,
        logoSizeMax,
        logoSizeMin,
        logoSizePercent,
    ]);

    // ── Handlers ──────────────────────────────
    const handleAddCollaborator = (userId: string) => {
        const colab = colaboradores.find((c) => c.id === Number(userId));
        if (!colab) return;
        if (selectedColabs.some((sc) => sc.user_id === colab.id)) return;
        setSelectedColabs((prev) => [
            ...prev,
            { user_id: colab.id, nome: colab.name, funcao: colab.role || "", avatar_url: colab.avatar_url || null },
        ]);
    };

    const handleRemoveCollaborator = (userId: number) => {
        setSelectedColabs((prev) => prev.filter((c) => c.user_id !== userId));
    };

    const handleToggleEquipment = (equipId: number) => {
        setSelectedEquips((prev) =>
            prev.includes(equipId) ? prev.filter((eid) => eid !== equipId) : [...prev, equipId]
        );
    };

    const handleVipGalleryToggle = (enabled: boolean) => {
        setIsVipGallery(enabled);

        if (!enabled) {
            return;
        }

        setGallerySlug((current) => current.trim() || suggestVipGallerySlug(titulo));
        setAllowPauseCommand((current) => current || !isEditing);
        setAllowDeleteCommand((current) => current || !isEditing);
        setPauseCommandKeyword((current) => current.trim() || defaultPauseKeywords);
        setDeleteCommandKeyword((current) => current.trim() || defaultDeleteKeywords);
        setLogoAnchor((current) => current || logoDefaultAnchor);
        setLogoSizePercent((current) => current || logoDefaultSizePercent);
        setLogoOffsetXPercent((current) => current || logoDefaultOffsetPercent);
        setLogoOffsetYPercent((current) => current || logoDefaultOffsetPercent);
    };

    const handleVipLogoModeChange = (value: VipLogoMode) => {
        setVipLogoMode(value);

        if (value === "default") {
            setCustomLogoPath("");
            return;
        }

        if (value === "none") {
            setCustomLogoPath(noLogoSentinel);
            return;
        }

        setCustomLogoPath((current) => current === noLogoSentinel ? "" : current);
    };

    const handleUploadVipLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        uploadVipGalleryLogo.mutate(
            {
                file,
                eventId: isEditing ? Number(id) : undefined,
            },
            {
                onSuccess: (response) => {
                    setVipLogoMode("custom");
                    setCustomLogoPath(response.data.path);
                    setCustomLogoPreviewUrl(response.data.url || null);
                },
            }
        );

        event.target.value = "";
    };

    const handleGallerySlugChange = (value: string) => {
        setGallerySlugTouched(true);
        setGallerySlug(value);
    };

    const handleSelectVipBanners = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);

        if (files.length === 0) {
            return;
        }

        setPendingBannerFiles((current) => [...current, ...files]);
        event.target.value = "";
    };

    const handleRemovePendingBanner = (index: number) => {
        setPendingBannerFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
    };

    const handleRemoveUploadedBanner = (bannerId: number) => {
        deleteVipGalleryBanner.mutate(bannerId, {
            onSuccess: () => {
                setUploadedVipBanners((current) => current.filter((banner) => banner.id !== bannerId));
                setSavedEvent((current) => current
                    ? {
                        ...current,
                        vip_gallery_banners: (current.vip_gallery_banners || []).filter((banner) => banner.id !== bannerId),
                    }
                    : current);
            },
        });
    };

    const handleMoveUploadedBanner = (bannerId: number, direction: -1 | 1) => {
        if (!persistedEventId) {
            return;
        }

        const currentIndex = uploadedVipBanners.findIndex((banner) => banner.id === bannerId);

        if (currentIndex === -1) {
            return;
        }

        const nextIndex = currentIndex + direction;

        if (nextIndex < 0 || nextIndex >= uploadedVipBanners.length) {
            return;
        }

        const reordered = [...uploadedVipBanners];
        const [movedBanner] = reordered.splice(currentIndex, 1);
        reordered.splice(nextIndex, 0, movedBanner);
        const normalized = reordered.map((banner, index) => ({
            ...banner,
            sort_order: index + 1,
        }));
        const previous = uploadedVipBanners;

        setUploadedVipBanners(normalized);
        setSavedEvent((current) => current ? { ...current, vip_gallery_banners: normalized } : current);

        reorderVipGalleryBanners.mutate(
            {
                eventId: persistedEventId,
                bannerIds: normalized.map((banner) => banner.id),
            },
            {
                onSuccess: (response) => {
                    const banners = response.data.banners || [];
                    setUploadedVipBanners(banners);
                    setSavedEvent((current) => current ? { ...current, vip_gallery_banners: banners } : current);
                },
                onError: () => {
                    setUploadedVipBanners(previous);
                    setSavedEvent((current) => current ? { ...current, vip_gallery_banners: previous } : current);
                },
            }
        );
    };

    const validateRequiredAssignments = (): boolean => {
        if (selectedColabs.length === 0) {
            showToast.error("Selecione ao menos 1 colaborador para salvar o evento.");
            return false;
        }

        if (selectedEquips.length === 0) {
            showToast.error("Selecione ao menos 1 equipamento para salvar o evento.");
            return false;
        }

        return true;
    };

    const persistEvent = async () => {
        if (!categoryId || !statusId) return;
        if (!validateRequiredAssignments()) return;

        if (isVipGallery && vipLogoMode === "custom" && !customLogoPath.trim()) {
            showToast.error("Envie a logo personalizada em PNG antes de salvar o evento.");
            return;
        }

        if (isVipGallery && allowPauseCommand && !pauseCommandKeyword.trim()) {
            showToast.error("Informe ao menos uma palavra-chave para pausar a galeria via WhatsApp.");
            return;
        }

        const resolvedCustomLogoPath = !isVipGallery
            ? null
            : vipLogoMode === "none"
                ? noLogoSentinel
                : vipLogoMode === "custom"
                    ? (customLogoPath.trim() || null)
                    : null;

        const resolvedDeleteCommandKeyword = isVipGallery && allowDeleteCommand
            ? (deleteCommandKeyword.trim() || defaultDeleteKeywords)
            : defaultDeleteKeywords;
        const resolvedPauseCommandKeyword = isVipGallery && allowPauseCommand
            ? (pauseCommandKeyword.trim() || defaultPauseKeywords)
            : defaultPauseKeywords;

        const dto: CreateExternalEventDTO = {
            titulo,
            category_id: Number(categoryId),
            status_id: Number(statusId),
            briefing: briefing || undefined,
            data_hora: dataHora,
            data_hora_fim: dataHoraFim || undefined,
            local,
            endereco_completo: enderecoCompleto || undefined,
            contato_nome: contatoNome || undefined,
            contato_whatsapp: contatoWhatsapp || undefined,
            observacao_interna: observacaoInterna || undefined,
            colaboradores: selectedColabs.map((c) => ({ user_id: c.user_id, funcao: c.funcao })),
            equipamentos: selectedEquips.map((eid) => ({ equipment_id: eid, checked: false })),
            is_vip_gallery: isVipGallery,
            vip_gallery_status: isVipGallery ? vipGalleryStatus : null,
            whatsapp_group_id: isVipGallery ? (whatsappGroupId || null) : null,
            gallery_slug: isVipGallery ? (gallerySlug || null) : null,
            custom_logo_path: resolvedCustomLogoPath,
            logo_size_percent: isVipGallery ? Number(logoSizePercent || logoDefaultSizePercent) : null,
            logo_anchor: isVipGallery ? logoAnchor : null,
            logo_offset_x_percent: isVipGallery ? Number(logoOffsetXPercent || logoDefaultOffsetPercent) : null,
            logo_offset_y_percent: isVipGallery ? Number(logoOffsetYPercent || logoDefaultOffsetPercent) : null,
            allow_pause_command: isVipGallery ? allowPauseCommand : false,
            allow_delete_command: isVipGallery ? allowDeleteCommand : false,
            pause_command_keyword: resolvedPauseCommandKeyword,
            delete_command_keyword: resolvedDeleteCommandKeyword,
        };

        try {
            const response = isEditing
                ? await updateEvent.mutateAsync({ id: Number(id), dto })
                : await createEvent.mutateAsync(dto);
            const persistedEvent = response.data;
            let persistedBanners = uploadedVipBanners;

            if (isVipGallery && pendingBannerFiles.length > 0) {
                const bannersResponse = await uploadVipGalleryBanners.mutateAsync({
                    files: pendingBannerFiles,
                    eventId: persistedEvent.id,
                });

                persistedBanners = [
                    ...uploadedVipBanners,
                    ...(bannersResponse.data.banners || []),
                ];

                setUploadedVipBanners(persistedBanners);
                setPendingBannerFiles([]);
            }

            setSavedEvent({
                ...persistedEvent,
                vip_gallery_banners: persistedBanners,
            });
        } catch {
            return;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateRequiredAssignments()) {
            return;
        }

        if (vipGroupConflicts.length > 0) {
            setVipGroupConflictOpen(true);
            return;
        }

        await persistEvent();
    };

    const handleConfirmVipGroupConflict = async () => {
        setVipGroupConflictOpen(false);
        await persistEvent();
    };

    const openGoogleCalendar = () => {
        if (!savedEvent) return;
        window.open(generateGoogleCalendarUrl(savedEvent), "_blank");
    };

    const isSaving = createEvent.isPending || updateEvent.isPending || uploadVipGalleryBanners.isPending;

    // Count conflicting selections
    const conflictCount = selectedEquips.filter((eid) => conflicts[eid]).length;

    return (
        <AppShell>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/externas")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">
                            {isEditing ? "Editar Evento" : "Novo Evento"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Preencha os detalhes da cobertura externa
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Success State */}
            {savedEvent && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/20 rounded-full">
                                <Check className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="font-medium text-green-600">Evento salvo com sucesso!</p>
                                <p className="text-sm text-muted-foreground">Adicione ao seu Google Calendar</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={openGoogleCalendar} className="shrink-0">
                                <Calendar className="w-4 h-4 mr-2" />
                                Google Calendar
                                <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                            <Button variant="outline" onClick={() => navigate(`/externas/${savedEvent.id}`)}>Ver Evento</Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main — 2 cols */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        {/* Basic Info */}
                        <div className="bg-card rounded-xl border p-6 space-y-4">
                            <h2 className="font-semibold flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Informações Básicas
                            </h2>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="titulo">Título do Evento *</Label>
                                    <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Cobertura Casamento Silva" required className="rounded-xl" />
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    {/* Category with CRUD button */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Categoria *</Label>
                                            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setCatModalOpen(true)}>
                                                <Settings2 className="w-3 h-3 mr-1" /> Gerenciar
                                            </Button>
                                        </div>
                                        <Select value={categorySelectValue} onValueChange={(v) => v !== "__select_category__" && setCategoryId(Number(v))}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__select_category__" disabled>Selecione...</SelectItem>
                                                {categories.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>
                                                        <span className="flex items-center gap-2">
                                                            <DynIcon name={c.icon} className="w-3.5 h-3.5" /> {c.name}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Status with CRUD button */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Status</Label>
                                            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setStatusModalOpen(true)}>
                                                <Settings2 className="w-3 h-3 mr-1" /> Gerenciar
                                            </Button>
                                        </div>
                                        <Select value={statusSelectValue} onValueChange={(v) => v !== "__select_status__" && setStatusId(Number(v))}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__select_status__" disabled>Selecione...</SelectItem>
                                                {statuses.map((s) => (
                                                    <SelectItem key={s.id} value={String(s.id)}>
                                                        <span className="flex items-center gap-2">
                                                            <span className={cn("w-2 h-2 rounded-full", s.color)} /> {s.name}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="briefing">Briefing *</Label>
                                    <Textarea id="briefing" value={briefing} onChange={(e) => setBriefing(e.target.value)} placeholder="Descreva os detalhes do evento..." rows={4} required className="rounded-xl" />
                                </div>
                            </div>
                        </div>

                        {/* Date & Location */}
                        <div className="bg-card rounded-xl border p-6 space-y-4">
                            <h2 className="font-semibold flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Data e Local
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="data_hora">Data e Hora de Início *</Label>
                                    <Input id="data_hora" type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} required className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="data_hora_fim">Data e Hora de Término</Label>
                                    <Input id="data_hora_fim" type="datetime-local" value={dataHoraFim} onChange={(e) => setDataHoraFim(e.target.value)} className="rounded-xl" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="local">Local *</Label>
                                <Input id="local" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Centro de Convenções" required className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endereco">Endereço Completo</Label>
                                <Input id="endereco" value={enderecoCompleto} onChange={(e) => setEnderecoCompleto(e.target.value)} placeholder="Ex: Av. Central, 500 - Centro" className="rounded-xl" />
                            </div>
                        </div>

                        {/* Client Contact */}
                        <div className="bg-card rounded-xl border p-6 space-y-4">
                            <h2 className="font-semibold flex items-center gap-2">
                                <Phone className="w-5 h-5" />
                                Contato do Cliente
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contato_nome">Nome</Label>
                                    <Input id="contato_nome" value={contatoNome} onChange={(e) => setContatoNome(e.target.value)} placeholder="Nome do contato" className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contato_whatsapp">WhatsApp</Label>
                                    <Input id="contato_whatsapp" value={contatoWhatsapp} onChange={(e) => setContatoWhatsapp(e.target.value)} placeholder="(00) 00000-0000" className="rounded-xl" />
                                </div>
                            </div>
                        </div>

                        {/* Internal Notes */}
                        <div className="bg-card rounded-xl border p-6 space-y-4">
                            <h2 className="font-semibold flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Observações Internas
                            </h2>
                            <Textarea value={observacaoInterna} onChange={(e) => setObservacaoInterna(e.target.value)} placeholder="Notas internas da equipe..." rows={3} className="rounded-xl" />
                        </div>

                        <div className="bg-card rounded-xl border p-6 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="font-semibold flex items-center gap-2">
                                        <Camera className="w-5 h-5" />
                                        Cobertura VIP
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Configura a galeria publica, ingestao por grupo do WhatsApp e comandos de pausar/apagar.
                                    </p>
                                </div>
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <Checkbox checked={isVipGallery} onCheckedChange={(checked) => handleVipGalleryToggle(checked === true)} />
                                    Ativar VIP
                                </label>
                            </div>

                            <AnimatePresence initial={false}>
                                {isVipGallery ? (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 overflow-hidden"
                                    >
                                        <div className="space-y-2">
                                            <Label>Status da Galeria VIP</Label>
                                            <Select
                                                value={vipGalleryStatus}
                                                onValueChange={(value) => setVipGalleryStatus(value as VipGalleryStatus)}
                                            >
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {vipStatusOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="gallery_slug">Slug da Galeria</Label>
                                                <Input
                                                    id="gallery_slug"
                                                    value={gallerySlug}
                                                    onChange={(e) => handleGallerySlugChange(e.target.value)}
                                                    placeholder="ex: casamento-vip"
                                                    required={isVipGallery}
                                                    className="rounded-xl"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Sugerido automaticamente a partir do titulo do evento, mas voce pode ajustar manualmente.
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Selecione o GRUPO do WhatsApp</Label>
                                                <Select
                                                    value={whatsappGroupSelectValue}
                                                    onValueChange={(value) => setWhatsappGroupId(value === "__select_vip_group__" ? "" : value)}
                                                >
                                                    <SelectTrigger className="rounded-xl">
                                                        <SelectValue placeholder="Selecione o GRUPO do WhatsApp" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__select_vip_group__" disabled>
                                                            Selecione o GRUPO do WhatsApp
                                                        </SelectItem>
                                                        {vipGroupOptions.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {vipGroupConflicts.length > 0 && (
                                                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-xs text-amber-700">
                                                        Ja existe cobertura VIP com este grupo na mesma data. Voce ainda pode salvar, mas vale revisar o grupo antes de prosseguir.
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="rounded-xl border p-4 space-y-4">
                                            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                                                <div className="space-y-4">
                                                    <div className="grid sm:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Logo da Galeria</Label>
                                                            <Select
                                                                value={vipLogoMode}
                                                                onValueChange={(value) => handleVipLogoModeChange(value as VipLogoMode)}
                                                            >
                                                                <SelectTrigger className="rounded-xl">
                                                                    <SelectValue placeholder="Selecione..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="default">Logo Padrao</SelectItem>
                                                                    <SelectItem value="custom">Logo Personalizada</SelectItem>
                                                                    <SelectItem value="none">Sem Logo</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Regra atual</Label>
                                                            <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                                                                {vipLogoMode === "default" && "Todas as fotos usam a logo padrao do projeto, centralizada no rodape."}
                                                                {vipLogoMode === "custom" && "Somente esta cobertura usa a logo personalizada enviada em PNG com transparencia."}
                                                                {vipLogoMode === "none" && "Esta cobertura publica as fotos sem logo."}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {vipLogoMode === "default" && (
                                                        <div className="rounded-xl bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
                                                            Logo padrao fixa no projeto para todas as galerias VIP.
                                                            {vipOptions?.default_logo_url && (
                                                                <Button
                                                                    type="button"
                                                                    variant="link"
                                                                    className="h-auto px-1 text-sm"
                                                                    onClick={() => window.open(vipOptions.default_logo_url || "", "_blank", "noopener,noreferrer")}
                                                                >
                                                                    Visualizar logo padrao
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {vipLogoMode === "custom" && (
                                                        <div className="space-y-3">
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <Input
                                                                    type="file"
                                                                    accept="image/png"
                                                                    onChange={handleUploadVipLogo}
                                                                    disabled={uploadVipGalleryLogo.isPending}
                                                                    className="max-w-sm rounded-xl"
                                                                />
                                                                {uploadVipGalleryLogo.isPending && (
                                                                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                        Enviando logo...
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="custom_logo_path">Logo personalizada enviada</Label>
                                                                <Input
                                                                    id="custom_logo_path"
                                                                    value={customLogoPath === noLogoSentinel ? "" : customLogoPath}
                                                                    readOnly
                                                                    placeholder="Envie uma logo PNG transparente"
                                                                    className="rounded-xl"
                                                                />
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                PNG transparente, processado com GD nativo e salvo em `Storage::disk('public')`.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {vipLogoMode !== "none" && (
                                                        <>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <Label>Posicao da logo</Label>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Presets por ancora + ajuste fino
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    {logoAnchorOptions.map((anchorOption) => (
                                                                        <Button
                                                                            key={anchorOption.value}
                                                                            type="button"
                                                                            variant={logoAnchor === anchorOption.value ? "default" : "outline"}
                                                                            className="h-16 rounded-xl px-3 text-xs"
                                                                            onClick={() => setLogoAnchor(anchorOption.value)}
                                                                        >
                                                                            {anchorOption.label}
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <Label>Tamanho da logo</Label>
                                                                        <span className="text-xs text-muted-foreground">{logoSizePercent}% da largura</span>
                                                                    </div>
                                                                    <Slider
                                                                        min={logoSizeMin}
                                                                        max={logoSizeMax}
                                                                        step={1}
                                                                        value={[logoSizePercent]}
                                                                        onValueChange={(values) => setLogoSizePercent(values[0] || logoDefaultSizePercent)}
                                                                    />
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Faixa sugerida: {logoSizeMin}% a {logoSizeMax}% da largura da foto.
                                                                    </p>
                                                                </div>

                                                                <div className="grid sm:grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center justify-between gap-4">
                                                                            <Label>Distancia da lateral</Label>
                                                                            <span className="text-xs text-muted-foreground">{logoOffsetXPercent.toFixed(1)}%</span>
                                                                        </div>
                                                                        <Slider
                                                                            min={logoSafeAreaPercent}
                                                                            max={15}
                                                                            step={0.5}
                                                                            value={[logoOffsetXPercent]}
                                                                            onValueChange={(values) => setLogoOffsetXPercent(values[0] || logoDefaultOffsetPercent)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center justify-between gap-4">
                                                                            <Label>Distancia da borda</Label>
                                                                            <span className="text-xs text-muted-foreground">{logoOffsetYPercent.toFixed(1)}%</span>
                                                                        </div>
                                                                        <Slider
                                                                            min={logoSafeAreaPercent}
                                                                            max={15}
                                                                            step={0.5}
                                                                            value={[logoOffsetYPercent]}
                                                                            onValueChange={(values) => setLogoOffsetYPercent(values[0] || logoDefaultOffsetPercent)}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <p className="text-xs text-muted-foreground">
                                                                    Safe area minima automatica de {logoSafeAreaPercent}% para evitar que a logo cole na borda.
                                                                </p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <Label>Pre-visualizacao</Label>
                                                        <span className="text-xs text-muted-foreground">
                                                            Preview em tempo real
                                                        </span>
                                                    </div>
                                                    <div className="overflow-hidden rounded-[28px] border bg-zinc-950">
                                                        <div className="relative aspect-[3/4] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_40%),linear-gradient(160deg,#3b2417_0%,#8e5f42_35%,#111827_100%)]">
                                                            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />
                                                            <div className="absolute inset-0 p-5 text-white/90">
                                                                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Cobertura VIP</p>
                                                                <p className="mt-2 max-w-[70%] text-lg font-semibold">{titulo || "Titulo do Evento"}</p>
                                                                <p className="mt-1 max-w-[70%] text-xs text-white/70">{local || "Local do evento"}</p>
                                                            </div>

                                                            {vipLogoMode !== "none" && (
                                                                <div className="pointer-events-none absolute inset-0">
                                                                    {previewLogoUrl ? (
                                                                        <img
                                                                            src={previewLogoUrl}
                                                                            alt="Preview da logo"
                                                                            className="absolute object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]"
                                                                            style={logoPreviewStyle}
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            className="absolute rounded-lg border border-dashed border-white/50 bg-black/35 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white/80"
                                                                            style={logoPreviewStyle}
                                                                        >
                                                                            Logo
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        A renderizacao usa largura em porcentagem do container, mantendo proporcao automatica da logo.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border p-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="vip_gallery_banners">Banners da Galeria</Label>
                                                <Input
                                                    id="vip_gallery_banners"
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp"
                                                    multiple
                                                    onChange={handleSelectVipBanners}
                                                    disabled={uploadVipGalleryBanners.isPending}
                                                    className="max-w-sm rounded-xl"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Envie um ou mais banners para aparecer no topo da galeria publica.
                                                </p>
                                                <div className="rounded-xl border bg-muted/40 px-3 py-3 text-xs text-muted-foreground">
                                                    <p>
                                                        Tamanho renderizado: {bannerGuidelines?.rendered_width || 744} × {bannerGuidelines?.rendered_height || 144} px
                                                    </p>
                                                    <p>
                                                        Proporcao renderizada: {bannerGuidelines?.ratio_label || "31:6"}
                                                    </p>
                                                </div>
                                            </div>

                                            {pendingBannerFiles.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label>Banners pendentes para envio</Label>
                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        {pendingBannerPreviews.map((preview, index) => (
                                                            <div key={preview.id} className="overflow-hidden rounded-xl border bg-muted/30">
                                                                <img
                                                                    src={preview.url}
                                                                    alt={preview.name}
                                                                    className="h-28 w-full object-cover"
                                                                />
                                                                <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                                                                    <div className="min-w-0">
                                                                        <p className="truncate font-medium">{preview.name}</p>
                                                                        <p className="text-xs text-muted-foreground">{preview.sizeMb} MB</p>
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={() => handleRemovePendingBanner(index)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {isEditing
                                                            ? "Os banners pendentes serao enviados quando voce salvar as alteracoes."
                                                            : "Os banners serao enviados logo apos a criacao do evento."}
                                                    </p>
                                                </div>
                                            )}

                                            {uploadedVipBanners.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label>Banners ja enviados</Label>
                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        {uploadedVipBanners.map((banner) => (
                                                            <div key={banner.id} className="overflow-hidden rounded-xl border bg-muted/30">
                                                                <img
                                                                    src={banner.image_url}
                                                                    alt={banner.alt_text || "Banner VIP"}
                                                                    className="h-28 w-full object-cover"
                                                                />
                                                                <div className="flex items-center justify-between gap-3 px-3 py-2">
                                                                    <div className="min-w-0">
                                                                        <p className="truncate text-sm font-medium">
                                                                            {banner.alt_text || `Banner #${banner.sort_order}`}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Ordem {banner.sort_order}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                            onClick={() => handleMoveUploadedBanner(banner.id, -1)}
                                                                            disabled={reorderVipGalleryBanners.isPending || banner.sort_order === 1}
                                                                        >
                                                                            <ArrowUp className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                            onClick={() => handleMoveUploadedBanner(banner.id, 1)}
                                                                            disabled={reorderVipGalleryBanners.isPending || banner.sort_order === uploadedVipBanners.length}
                                                                        >
                                                                            <ArrowDown className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-destructive"
                                                                            onClick={() => handleRemoveUploadedBanner(banner.id)}
                                                                            disabled={deleteVipGalleryBanner.isPending}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Ajuste a ordem com as setas para controlar a transicao no topo da galeria.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="rounded-xl border border-dashed p-4 space-y-3">
                                            <label className="flex items-center gap-2 text-sm font-medium">
                                                <Checkbox
                                                    checked={allowPauseCommand}
                                                    onCheckedChange={(checked) => setAllowPauseCommand(checked === true)}
                                                />
                                                Permitir pause command via WhatsApp
                                            </label>
                                            <p className="text-xs text-muted-foreground">
                                                Ao enviar o texto ao grupo do evento ativo, vai pausar.
                                            </p>

                                            <div className="space-y-2">
                                                <Label htmlFor="pause_command_keyword">Palavras-chave para pausar</Label>
                                                <Input
                                                    id="pause_command_keyword"
                                                    value={pauseCommandKeyword}
                                                    onChange={(e) => setPauseCommandKeyword(e.target.value)}
                                                    placeholder={defaultPauseKeywords}
                                                    required={isVipGallery && allowPauseCommand}
                                                    disabled={!allowPauseCommand}
                                                    className="rounded-xl"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Separe por virgula. Exemplo: {defaultPauseKeywords}. A comparacao ignora maiusculas e minusculas.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-dashed p-4 space-y-3">
                                            <label className="flex items-center gap-2 text-sm font-medium">
                                                <Checkbox
                                                    checked={allowDeleteCommand}
                                                    onCheckedChange={(checked) => setAllowDeleteCommand(checked === true)}
                                                />
                                                Permitir delete command via WhatsApp
                                            </label>
                                            <p className="text-xs text-muted-foreground">
                                                Selecionando uma foto no grupo e inserindo o texto ela vai apagar a foto da galeria.
                                            </p>

                                            <div className="space-y-2">
                                                <Label htmlFor="delete_command_keyword">Palavras-chave para apagar</Label>
                                                <Input
                                                    id="delete_command_keyword"
                                                    value={deleteCommandKeyword}
                                                    onChange={(e) => setDeleteCommandKeyword(e.target.value)}
                                                    placeholder={defaultDeleteKeywords}
                                                    required={isVipGallery && allowDeleteCommand}
                                                    disabled={!allowDeleteCommand}
                                                    className="rounded-xl"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Separe por virgula. Exemplo: {defaultDeleteKeywords}. A comparacao ignora maiusculas e minusculas.
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground"
                                    >
                                        Ative a Cobertura VIP para preencher o slug público, grupo do WhatsApp e regras da galeria.
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Sidebar — 1 col */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
                        {/* Collaborators */}
                        <div className="bg-card rounded-xl border p-6 space-y-4">
                            <h2 className="font-semibold flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Colaboradores
                            </h2>
                            <Select onValueChange={handleAddCollaborator}>
                                <SelectTrigger className="rounded-xl">
                                    <Plus className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Adicionar colaborador" />
                                </SelectTrigger>
                                <SelectContent>
                                    {colaboradores
                                        .filter((c) => !selectedColabs.some((sc) => sc.user_id === c.id))
                                        .map((colab) => (
                                            <SelectItem key={colab.id} value={String(colab.id)}>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-7 w-7">
                                                        <AvatarImage src={colab.avatar_url || undefined} alt={colab.name} className="object-cover" />
                                                        <AvatarFallback className="text-[10px]">
                                                            {colab.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>{colab.name} - {colab.role || colab.department || ""}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            <div className="space-y-2">
                                {selectedColabs.map((colab) => (
                                    <div key={colab.user_id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={colab.avatar_url || undefined} alt={colab.nome} className="object-cover" />
                                                <AvatarFallback className="text-xs">
                                                    {colab.nome.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">{colab.nome}</p>
                                                <p className="text-xs text-muted-foreground">{colab.funcao}</p>
                                            </div>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveCollaborator(colab.user_id)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {selectedColabs.length === 0 && (
                                    <p className="text-sm text-destructive text-center py-2">
                                        Selecione ao menos 1 colaborador para salvar o evento.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Equipment Checklist with availability warnings */}
                        <div className="bg-card rounded-xl border p-6 space-y-4">
                            <h2 className="font-semibold flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Checklist de Equipamentos
                            </h2>

                            {/* Conflict alert */}
                            <AnimatePresence>
                                {conflictCount > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg"
                                    >
                                        <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            {conflictCount} equipamento(s) comprometido(s) neste período
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {equipments.map((equip) => {
                                    const isSelected = selectedEquips.includes(equip.id);
                                    const equipConflicts = conflicts[equip.id];
                                    const hasConflict = !!equipConflicts && equipConflicts.length > 0;

                                    return (
                                        <div key={equip.id}>
                                            <label
                                                className={cn(
                                                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                                                    isSelected && hasConflict ? "bg-amber-500/10 ring-1 ring-amber-500/30" :
                                                        isSelected ? "bg-primary/10" :
                                                            hasConflict ? "bg-amber-500/5" : "hover:bg-muted"
                                                )}
                                            >
                                                <Checkbox checked={isSelected} onCheckedChange={() => handleToggleEquipment(equip.id)} />
                                                <DynIcon name={equip.category?.icon} className="w-4 h-4 text-muted-foreground" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{equip.nome}</p>
                                                    <p className="text-xs text-muted-foreground">{equip.marca}</p>
                                                </div>
                                                {hasConflict && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="shrink-0">
                                                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="left" className="max-w-[250px]">
                                                            <p className="text-xs font-medium mb-1">Comprometido para:</p>
                                                            {equipConflicts.map((c) => (
                                                                <p key={c.event_id} className="text-xs text-muted-foreground">
                                                                    • {c.titulo} ({c.status})
                                                                </p>
                                                            ))}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>

                            <p className={cn(
                                "text-xs text-center",
                                selectedEquips.length === 0 ? "text-destructive" : "text-muted-foreground"
                            )}>
                                {selectedEquips.length === 0
                                    ? "Selecione ao menos 1 equipamento para salvar o evento."
                                    : `${selectedEquips.length} equipamento(s) selecionado(s)`}
                            </p>
                        </div>

                        {/* Submit */}
                        <Button type="submit" className="w-full rounded-xl" size="lg" disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            {isSaving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Evento"}
                        </Button>
                    </motion.div>
                </div>
            </form>

            <Dialog open={vipGroupConflictOpen} onOpenChange={setVipGroupConflictOpen}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>Grupo do WhatsApp ja usado nesta data</DialogTitle>
                        <DialogDescription>
                            Encontramos outra cobertura VIP no mesmo dia usando este grupo. Voce pode trocar o grupo agora ou continuar assim mesmo.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        {vipGroupConflicts.map((event) => (
                            <div key={event.id} className="rounded-xl border bg-muted/30 px-4 py-3">
                                <p className="font-medium">{event.titulo}</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatEventDateTime(event.data_hora)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Grupo: {vipGroupOptions.find((option) => option.value === event.whatsapp_group_id)?.label || event.whatsapp_group_id}
                                </p>
                            </div>
                        ))}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setVipGroupConflictOpen(false)}>
                            Trocar grupo
                        </Button>
                        <Button onClick={handleConfirmVipGroupConflict} disabled={isSaving}>
                            Prosseguir assim mesmo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Category CRUD Modal */}
            <CrudModal
                open={catModalOpen}
                onOpenChange={setCatModalOpen}
                title="Categorias de Evento"
                items={categories}
                iconOptions={categoryIconOptions}
                colorOptions={categoryColorOptions}
                onAdd={(dto) => createCategory.mutate(dto)}
                onUpdate={(id, dto) => updateCategory.mutate({ id, dto })}
                onDelete={(id) => deleteCategory.mutate(id)}
                isCreating={createCategory.isPending}
                isUpdating={updateCategory.isPending}
                isDeleting={deleteCategory.isPending}
            />

            {/* Status CRUD Modal */}
            <CrudModal
                open={statusModalOpen}
                onOpenChange={setStatusModalOpen}
                title="Status de Evento"
                items={statuses}
                iconOptions={statusIconOptions}
                colorOptions={statusColorOptions}
                onAdd={(dto) => createStatus.mutate(dto)}
                onUpdate={(id, dto) => updateStatus.mutate({ id, dto })}
                onDelete={(id) => deleteStatus.mutate(id)}
                isCreating={createStatus.isPending}
                isUpdating={updateStatus.isPending}
                isDeleting={deleteStatus.isPending}
            />
        </AppShell>
    );
};

export default EventForm;
