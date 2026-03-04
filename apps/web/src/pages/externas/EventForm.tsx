import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
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
} from "@/hooks/useExternas";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useEquipamentos } from "@/hooks/useEquipamentos";
import type { CreateExternalEventDTO, EquipmentConflict } from "@/services/externa.service";
import type { EventCategory, EventStatusData } from "@/types/externas";
import { generateGoogleCalendarUrl, ExternalEvent } from "@/types/externas";
import { cn } from "@/lib/utils";

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

    const categories = categoriesData?.data || [];
    const statuses = statusesData?.data || [];
    const colaboradores = colabData?.data || [];
    const equipments = equipData?.data || [];

    // ── Mutations ─────────────────────────────
    const createEvent = useCreateExterna();
    const updateEvent = useUpdateExterna();
    const createCategory = useCreateEventCategory();
    const updateCategory = useUpdateEventCategory();
    const deleteCategory = useDeleteEventCategory();
    const createStatus = useCreateEventStatusItem();
    const updateStatus = useUpdateEventStatusItem();
    const deleteStatus = useDeleteEventStatusItem();

    // ── Modal state ───────────────────────────
    const [catModalOpen, setCatModalOpen] = useState(false);
    const [statusModalOpen, setStatusModalOpen] = useState(false);

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
    const [selectedColabs, setSelectedColabs] = useState<Array<{ user_id: number; nome: string; funcao: string }>>([]);
    const [selectedEquips, setSelectedEquips] = useState<number[]>([]);
    const [savedEvent, setSavedEvent] = useState<ExternalEvent | null>(null);

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

    // ── Pre-fill on edit ──────────────────────
    useEffect(() => {
        if (isEditing && existingEvent?.data) {
            const ev = existingEvent.data;
            setTitulo(ev.titulo);
            setCategoryId(ev.category_id);
            setStatusId(ev.status_id);
            setBriefing(ev.briefing || "");
            setDataHora(ev.data_hora ? ev.data_hora.slice(0, 16) : "");
            setDataHoraFim(ev.data_hora_fim ? ev.data_hora_fim.slice(0, 16) : "");
            setLocal(ev.local);
            setEnderecoCompleto(ev.endereco_completo || "");
            setContatoNome(ev.contato_nome || "");
            setContatoWhatsapp(ev.contato_whatsapp || "");
            setObservacaoInterna(ev.observacao_interna || "");
            setSelectedColabs(
                ev.collaborators?.map((c) => ({
                    user_id: c.id,
                    nome: c.name,
                    funcao: c.pivot?.funcao || "",
                })) || []
            );
            setSelectedEquips(ev.equipment?.map((e) => e.id) || []);
        }
    }, [isEditing, existingEvent]);

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

    // ── Handlers ──────────────────────────────
    const handleAddCollaborator = (userId: string) => {
        const colab = colaboradores.find((c) => c.id === Number(userId));
        if (!colab) return;
        if (selectedColabs.some((sc) => sc.user_id === colab.id)) return;
        setSelectedColabs((prev) => [
            ...prev,
            { user_id: colab.id, nome: colab.name, funcao: colab.role || "" },
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryId || !statusId) return;

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
        };

        if (isEditing) {
            updateEvent.mutate({ id: Number(id), dto }, {
                onSuccess: (res) => setSavedEvent(res.data),
            });
        } else {
            createEvent.mutate(dto, {
                onSuccess: (res) => setSavedEvent(res.data),
            });
        }
    };

    const openGoogleCalendar = () => {
        if (!savedEvent) return;
        window.open(generateGoogleCalendarUrl(savedEvent), "_blank");
    };

    const isSaving = createEvent.isPending || updateEvent.isPending;

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
                                        <Select value={categoryId ? String(categoryId) : undefined} onValueChange={(v) => setCategoryId(Number(v))}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
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
                                        <Select value={statusId ? String(statusId) : undefined} onValueChange={(v) => setStatusId(Number(v))}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
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
                                                {colab.name} - {colab.role || colab.department || ""}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            <div className="space-y-2">
                                {selectedColabs.map((colab) => (
                                    <div key={colab.user_id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                        <div>
                                            <p className="font-medium text-sm">{colab.nome}</p>
                                            <p className="text-xs text-muted-foreground">{colab.funcao}</p>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveCollaborator(colab.user_id)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {selectedColabs.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-2">Nenhum colaborador selecionado</p>
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

                            <p className="text-xs text-muted-foreground text-center">
                                {selectedEquips.length} equipamento(s) selecionado(s)
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
