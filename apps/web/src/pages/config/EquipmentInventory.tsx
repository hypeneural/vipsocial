import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Package,
    Camera,
    Mic,
    Smartphone,
    Plug,
    MoreVertical,
    Filter,
    Loader2,
    XCircle,
    Save,
    Settings2,
    Aperture,
    Triangle,
    Lightbulb,
    CheckCircle2,
    Clock,
    Wrench,
    CircleDot,
    Palette,
    Tag,
    Calendar,
    ExternalLink,
    type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";
import {
    useEquipamentos,
    useEquipamentoStats,
    useEquipmentCategories,
    useEquipmentStatuses,
    useCreateEquipamento,
    useUpdateEquipamento,
    useDeleteEquipamento,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
    useCreateStatusItem,
    useUpdateStatusItem,
    useDeleteStatusItem,
} from "@/hooks/useEquipamentos";
import type {
    Equipment,
    EquipmentCategory,
    EquipmentStatusData,
    CreateEquipmentDTO,
} from "@/services/equipamento.service";
import { useEquipmentSchedule } from "@/hooks/useExternas";

// ==========================================
// ICON MAP
// ==========================================
const iconMap: Record<string, LucideIcon> = {
    Camera, Aperture, Mic, Smartphone, Plug, Triangle, Lightbulb, Package,
    CheckCircle2, Clock, Wrench, CircleDot, Tag, Settings2,
};

function DynIcon({ name, className }: { name?: string; className?: string }) {
    const Icon = (name && iconMap[name]) || Package;
    return <Icon className={className} />;
}

// Available icons for selectors
const categoryIcons = [
    { name: "Camera", label: "Câmera" },
    { name: "Aperture", label: "Lente" },
    { name: "Mic", label: "Microfone" },
    { name: "Smartphone", label: "Celular" },
    { name: "Plug", label: "Adaptador" },
    { name: "Triangle", label: "Tripé" },
    { name: "Lightbulb", label: "Iluminação" },
    { name: "Package", label: "Genérico" },
];

const statusIcons = [
    { name: "CheckCircle2", label: "Check" },
    { name: "Clock", label: "Relógio" },
    { name: "Wrench", label: "Ferramenta" },
    { name: "CircleDot", label: "Ponto" },
];

const statusColors = [
    { value: "bg-emerald-500", label: "Verde" },
    { value: "bg-amber-500", label: "Amarelo" },
    { value: "bg-red-500", label: "Vermelho" },
    { value: "bg-blue-500", label: "Azul" },
    { value: "bg-purple-500", label: "Roxo" },
    { value: "bg-gray-500", label: "Cinza" },
];

// ==========================================
// EQUIPMENT FORM MODAL
// ==========================================
function EquipmentFormModal({
    equipment,
    open,
    onClose,
    categories,
    statuses,
    onSave,
    saving,
}: {
    equipment?: Equipment | null;
    open: boolean;
    onClose: () => void;
    categories: EquipmentCategory[];
    statuses: EquipmentStatusData[];
    onSave: (data: CreateEquipmentDTO) => void;
    saving?: boolean;
}) {
    const isEdit = !!equipment;
    const defaultStatus = statuses.find((s) => s.slug === "disponivel")?.id || statuses[0]?.id || 1;

    const [form, setForm] = useState<CreateEquipmentDTO>({
        nome: equipment?.nome || "",
        category_id: equipment?.category_id || categories[0]?.id || 1,
        marca: equipment?.marca || "",
        modelo: equipment?.modelo || "",
        patrimonio: equipment?.patrimonio || "",
        status_id: equipment?.status_id || defaultStatus,
        observacoes: equipment?.observacoes || "",
    });

    // Reset form when equipment changes
    useState(() => {
        if (equipment) {
            setForm({
                nome: equipment.nome,
                category_id: equipment.category_id,
                marca: equipment.marca || "",
                modelo: equipment.modelo || "",
                patrimonio: equipment.patrimonio || "",
                status_id: equipment.status_id,
                observacoes: equipment.observacoes || "",
            });
        }
    });

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        {isEdit ? "Editar Equipamento" : "Novo Equipamento"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Atualize os dados do equipamento." : "Preencha os dados para cadastro."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-2">
                    <div className="col-span-2">
                        <Label className="text-xs">Nome *</Label>
                        <Input
                            value={form.nome}
                            onChange={(e) => setForm({ ...form, nome: e.target.value })}
                            placeholder="Ex: Canon EOS R5"
                            className="mt-1 rounded-xl h-10"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Categoria *</Label>
                        <Select
                            value={String(form.category_id)}
                            onValueChange={(v) => setForm({ ...form, category_id: Number(v) })}
                        >
                            <SelectTrigger className="mt-1 rounded-xl h-10">
                                <SelectValue />
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
                    <div>
                        <Label className="text-xs">Status *</Label>
                        <Select
                            value={String(form.status_id)}
                            onValueChange={(v) => setForm({ ...form, status_id: Number(v) })}
                        >
                            <SelectTrigger className="mt-1 rounded-xl h-10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses.map((s) => (
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
                    <div>
                        <Label className="text-xs">Marca</Label>
                        <Input
                            value={form.marca}
                            onChange={(e) => setForm({ ...form, marca: e.target.value })}
                            placeholder="Ex: Canon"
                            className="mt-1 rounded-xl h-10"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Modelo</Label>
                        <Input
                            value={form.modelo}
                            onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                            placeholder="Ex: EOS R5"
                            className="mt-1 rounded-xl h-10"
                        />
                    </div>
                    <div className="col-span-2">
                        <Label className="text-xs">Patrimônio</Label>
                        <Input
                            value={form.patrimonio}
                            onChange={(e) => setForm({ ...form, patrimonio: e.target.value })}
                            placeholder="Ex: CAM-001"
                            className="mt-1 rounded-xl h-10"
                        />
                    </div>
                    <div className="col-span-2">
                        <Label className="text-xs">Observações</Label>
                        <Textarea
                            value={form.observacoes}
                            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                            className="mt-1 rounded-xl resize-none"
                            rows={2}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
                    <Button
                        onClick={() => onSave(form)}
                        disabled={!form.nome.trim() || saving}
                        className="rounded-xl"
                    >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {isEdit ? "Salvar" : "Cadastrar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ==========================================
// CATEGORY/STATUS CRUD MODAL
// ==========================================
function ConfigItemModal({
    type,
    item,
    open,
    onClose,
    onSave,
    saving,
}: {
    type: "category" | "status";
    item?: EquipmentCategory | EquipmentStatusData | null;
    open: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    saving?: boolean;
}) {
    const isEdit = !!item;
    const isStatus = type === "status";
    const icons = isStatus ? statusIcons : categoryIcons;

    const [name, setName] = useState(item?.name || "");
    const [icon, setIcon] = useState(item?.icon || icons[0].name);
    const [color, setColor] = useState((item as EquipmentStatusData)?.color || "bg-emerald-500");

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isStatus ? <Palette className="w-5 h-5 text-primary" /> : <Tag className="w-5 h-5 text-primary" />}
                        {isEdit ? "Editar" : "Novo"} {isStatus ? "Status" : "Categoria"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div>
                        <Label className="text-xs">Nome</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={isStatus ? "Ex: Reservado" : "Ex: Drone"}
                            className="mt-1 rounded-xl h-10"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Ícone</Label>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                            {icons.map((ic) => {
                                const Icon = iconMap[ic.name] || Package;
                                return (
                                    <button
                                        key={ic.name}
                                        onClick={() => setIcon(ic.name)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all",
                                            icon === ic.name
                                                ? "bg-primary/10 border-primary/30 text-primary"
                                                : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        <Icon className="w-3.5 h-3.5" /> {ic.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {isStatus && (
                        <div>
                            <Label className="text-xs">Cor</Label>
                            <div className="flex gap-2 mt-1.5">
                                {statusColors.map((c) => (
                                    <button
                                        key={c.value}
                                        onClick={() => setColor(c.value)}
                                        className={cn(
                                            "w-8 h-8 rounded-lg transition-all",
                                            c.value,
                                            color === c.value ? "ring-2 ring-offset-2 ring-primary" : "opacity-60 hover:opacity-100"
                                        )}
                                        title={c.label}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
                    <Button
                        onClick={() => {
                            const payload: any = { name, icon };
                            if (isStatus) payload.color = color;
                            onSave(payload);
                        }}
                        disabled={!name.trim() || saving}
                        className="rounded-xl"
                    >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {isEdit ? "Salvar" : "Criar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ==========================================
// EQUIPMENT SCHEDULE MODAL
// ==========================================
const EquipmentScheduleModal = ({
    equipmentId,
    open,
    onClose,
}: {
    equipmentId: number | null;
    open: boolean;
    onClose: () => void;
}) => {
    const { data, isLoading } = useEquipmentSchedule(equipmentId || 0);
    const schedule = data?.data;

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Agenda do Equipamento
                    </DialogTitle>
                    {schedule?.equipment && (
                        <DialogDescription className="flex items-center gap-2 pt-1">
                            <DynIcon name={schedule.equipment.category?.icon} className="w-4 h-4" />
                            <span className="font-medium">{schedule.equipment.nome}</span>
                            {schedule.equipment.marca && (
                                <span className="text-xs">({schedule.equipment.marca} {schedule.equipment.modelo || ""})</span>
                            )}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-y-auto -mx-6 px-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : !schedule?.events || schedule.events.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">Nenhum evento encontrado para este equipamento</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {schedule.events.map((ev) => (
                                <motion.div
                                    key={ev.id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3 p-3 border rounded-xl hover:shadow-sm transition-all group"
                                >
                                    {/* Category icon */}
                                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", ev.category?.color || "bg-gray-500")}>
                                        <DynIcon name={ev.category?.icon} className="w-4 h-4 text-white" />
                                    </div>

                                    {/* Event info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{ev.titulo}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                            <Clock className="w-3 h-3" />
                                            <span>{formatDate(ev.data_hora)}</span>
                                            {ev.data_hora_fim && (
                                                <>
                                                    <span>→</span>
                                                    <span>{formatDate(ev.data_hora_fim)}</span>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{ev.local}</p>
                                    </div>

                                    {/* Status badge */}
                                    {ev.status && (
                                        <Badge className={cn("text-[10px] text-white flex-shrink-0", ev.status.color)}>
                                            {ev.status.name}
                                        </Badge>
                                    )}

                                    {/* Link to event detail */}
                                    <a
                                        href={`/externas/${ev.id}`}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Ver detalhes"
                                    >
                                        <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                    </a>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const EquipmentInventory = () => {
    const [activeTab, setActiveTab] = useState("inventario");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    // Equipment modals
    const [showEquipForm, setShowEquipForm] = useState(false);
    const [editingEquip, setEditingEquip] = useState<Equipment | null>(null);
    const [deletingEquipId, setDeletingEquipId] = useState<number | null>(null);

    // Category modals
    const [showCatForm, setShowCatForm] = useState(false);
    const [editingCat, setEditingCat] = useState<EquipmentCategory | null>(null);
    const [deletingCatId, setDeletingCatId] = useState<number | null>(null);

    // Status modals
    const [showStatusForm, setShowStatusForm] = useState(false);
    const [editingStatus, setEditingStatus] = useState<EquipmentStatusData | null>(null);
    const [deletingStatusId, setDeletingStatusId] = useState<number | null>(null);

    // Schedule modal
    const [scheduleEquipId, setScheduleEquipId] = useState<number | null>(null);

    // Queries
    const { data: equipData, isLoading, error } = useEquipamentos({
        per_page: 100,
        search: searchTerm || undefined,
        category_id: filterCategory !== "all" ? Number(filterCategory) : undefined,
        status_id: filterStatus !== "all" ? Number(filterStatus) : undefined,
    });
    const { data: statsData } = useEquipamentoStats();
    const { data: categoriesData } = useEquipmentCategories();
    const { data: statusesData } = useEquipmentStatuses();

    // Mutations
    const createEquip = useCreateEquipamento();
    const updateEquip = useUpdateEquipamento();
    const deleteEquip = useDeleteEquipamento();
    const createCat = useCreateCategory();
    const updateCat = useUpdateCategory();
    const deleteCat = useDeleteCategory();
    const createSt = useCreateStatusItem();
    const updateSt = useUpdateStatusItem();
    const deleteSt = useDeleteStatusItem();

    const equipments = equipData?.data || [];
    const categories = categoriesData?.data || [];
    const statuses = statusesData?.data || [];
    const stats = statsData?.data;

    // Handlers
    const handleSaveEquip = (data: CreateEquipmentDTO) => {
        if (editingEquip) {
            updateEquip.mutate({ id: editingEquip.id, dto: data }, {
                onSuccess: () => { setShowEquipForm(false); setEditingEquip(null); },
            });
        } else {
            createEquip.mutate(data, {
                onSuccess: () => setShowEquipForm(false),
            });
        }
    };

    const handleDeleteEquip = () => {
        if (!deletingEquipId) return;
        deleteEquip.mutate(deletingEquipId, {
            onSuccess: () => setDeletingEquipId(null),
        });
    };

    const handleSaveCat = (data: any) => {
        if (editingCat) {
            updateCat.mutate({ id: editingCat.id, dto: data }, {
                onSuccess: () => { setShowCatForm(false); setEditingCat(null); },
            });
        } else {
            createCat.mutate(data, {
                onSuccess: () => setShowCatForm(false),
            });
        }
    };

    const handleSaveStatus = (data: any) => {
        if (editingStatus) {
            updateSt.mutate({ id: editingStatus.id, dto: data }, {
                onSuccess: () => { setShowStatusForm(false); setEditingStatus(null); },
            });
        } else {
            createSt.mutate(data, {
                onSuccess: () => setShowStatusForm(false),
            });
        }
    };

    // ── RENDER ────────────────────────────────

    if (error) {
        return (
            <AppShell>
                <div className="text-center py-20">
                    <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-7 h-7 text-destructive" />
                    </div>
                    <p className="text-destructive font-medium">Erro ao carregar equipamentos</p>
                    <p className="text-sm text-muted-foreground mt-1">Verifique se a API está rodando</p>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Package className="w-4 h-4 text-primary" />
                            </div>
                            Inventário de Equipamentos
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Gerencie equipamentos, categorias e status
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Stats Cards */}
            {stats && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
                >
                    <div className="bg-card rounded-xl border border-border/50 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Package className="w-5 h-5 text-primary" />
                            <span className="text-2xl font-bold">{stats.total}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    {stats.by_status.map((st) => (
                        <div key={st.id} className="bg-card rounded-xl border border-border/50 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", st.color)}>
                                    <DynIcon name={st.icon} className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-2xl font-bold">{st.count}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{st.name}</p>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="flex h-auto gap-2 bg-transparent p-0">
                    <TabsTrigger
                        value="inventario"
                        className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-card data-[state=inactive]:border border-border/50"
                    >
                        <Package className="w-4 h-4 mr-2" /> Equipamentos
                    </TabsTrigger>
                    <TabsTrigger
                        value="categorias"
                        className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-card data-[state=inactive]:border border-border/50"
                    >
                        <Tag className="w-4 h-4 mr-2" /> Categorias
                    </TabsTrigger>
                    <TabsTrigger
                        value="statuses"
                        className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:bg-card data-[state=inactive]:border border-border/50"
                    >
                        <Settings2 className="w-4 h-4 mr-2" /> Status
                    </TabsTrigger>
                </TabsList>

                {/* ═══════════ TAB 1 — EQUIPMENT LIST ═══════════ */}
                <TabsContent value="inventario">
                    {/* Filters */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col md:flex-row gap-3 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar equipamento, marca, modelo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 rounded-xl h-10"
                            />
                        </div>
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="w-full md:w-[180px] rounded-xl h-10">
                                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas Categorias</SelectItem>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        <span className="flex items-center gap-2">
                                            <DynIcon name={c.icon} className="w-3.5 h-3.5" /> {c.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full md:w-[160px] rounded-xl h-10">
                                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos Status</SelectItem>
                                {statuses.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        <span className="flex items-center gap-2">
                                            <span className={cn("w-2 h-2 rounded-full", s.color)} /> {s.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button className="rounded-xl" onClick={() => { setEditingEquip(null); setShowEquipForm(true); }}>
                            <Plus className="w-4 h-4 mr-2" /> Novo
                        </Button>
                    </motion.div>

                    {/* Equipment List */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : equipments.length === 0 ? (
                        <div className="text-center py-16">
                            <Package className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                            <p className="text-muted-foreground font-medium">Nenhum equipamento encontrado</p>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="space-y-2">
                            <AnimatePresence>
                                {equipments.map((equip: Equipment, i: number) => (
                                    <motion.div
                                        key={equip.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="bg-card rounded-xl p-4 border border-border/50 hover:shadow-md hover:border-primary/20 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Icon */}
                                            <div className="w-11 h-11 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0">
                                                <DynIcon name={equip.category?.icon} className="w-5 h-5 text-muted-foreground" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                    <h3 className="font-semibold text-sm">{equip.nome}</h3>
                                                    <Badge className="text-[10px] rounded-full border px-2 py-0 bg-muted/50 text-muted-foreground border-border/50">
                                                        <DynIcon name={equip.category?.icon} className="w-3 h-3 mr-1" />
                                                        {equip.category?.name || "—"}
                                                    </Badge>
                                                    {equip.status && (
                                                        <Badge className={cn(
                                                            "text-[10px] rounded-full border px-2 py-0 text-white",
                                                            equip.status.color
                                                        )}>
                                                            {equip.status.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                                                    {equip.marca && <span>{equip.marca} {equip.modelo || ""}</span>}
                                                    {equip.patrimonio && (
                                                        <span className="font-mono bg-muted/50 px-1.5 rounded">{equip.patrimonio}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setScheduleEquipId(equip.id)}>
                                                        <Calendar className="w-4 h-4 mr-2" /> Ver Agenda
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => { setEditingEquip(equip); setShowEquipForm(true); }}>
                                                        <Edit className="w-4 h-4 mr-2" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => setDeletingEquipId(equip.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </TabsContent>

                {/* ═══════════ TAB 2 — CATEGORIES ═══════════ */}
                <TabsContent value="categorias">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-muted-foreground">
                            Tipos de equipamento usados no cadastro
                        </p>
                        <Button className="rounded-xl" onClick={() => { setEditingCat(null); setShowCatForm(true); }}>
                            <Plus className="w-4 h-4 mr-2" /> Nova Categoria
                        </Button>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categories.map((cat) => (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-card rounded-xl border border-border/50 p-4 hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <DynIcon name={cat.icon} className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{cat.name}</p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {cat.equipments_count ?? 0} equipamento{(cat.equipments_count ?? 0) !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-7 h-7 rounded-lg"
                                            onClick={() => { setEditingCat(cat); setShowCatForm(true); }}
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-7 h-7 rounded-lg text-destructive"
                                            onClick={() => setDeletingCatId(cat.id)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </TabsContent>

                {/* ═══════════ TAB 3 — STATUSES ═══════════ */}
                <TabsContent value="statuses">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-muted-foreground">
                            Status disponíveis para equipamentos
                        </p>
                        <Button className="rounded-xl" onClick={() => { setEditingStatus(null); setShowStatusForm(true); }}>
                            <Plus className="w-4 h-4 mr-2" /> Novo Status
                        </Button>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {statuses.map((st) => (
                            <motion.div
                                key={st.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-card rounded-xl border border-border/50 p-4 hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", st.color)}>
                                            <DynIcon name={st.icon} className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{st.name}</p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {st.equipments_count ?? 0} equipamento{(st.equipments_count ?? 0) !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-7 h-7 rounded-lg"
                                            onClick={() => { setEditingStatus(st); setShowStatusForm(true); }}
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-7 h-7 rounded-lg text-destructive"
                                            onClick={() => setDeletingStatusId(st.id)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* ═══════════ MODALS ═══════════ */}

            {/* Equipment Form */}
            {showEquipForm && (
                <EquipmentFormModal
                    equipment={editingEquip}
                    open={showEquipForm}
                    onClose={() => { setShowEquipForm(false); setEditingEquip(null); }}
                    categories={categories}
                    statuses={statuses}
                    onSave={handleSaveEquip}
                    saving={createEquip.isPending || updateEquip.isPending}
                />
            )}

            {/* Category Form */}
            {showCatForm && (
                <ConfigItemModal
                    type="category"
                    item={editingCat}
                    open={showCatForm}
                    onClose={() => { setShowCatForm(false); setEditingCat(null); }}
                    onSave={handleSaveCat}
                    saving={createCat.isPending || updateCat.isPending}
                />
            )}

            {/* Status Form */}
            {showStatusForm && (
                <ConfigItemModal
                    type="status"
                    item={editingStatus}
                    open={showStatusForm}
                    onClose={() => { setShowStatusForm(false); setEditingStatus(null); }}
                    onSave={handleSaveStatus}
                    saving={createSt.isPending || updateSt.isPending}
                />
            )}

            {/* Delete Equipment */}
            <ConfirmDialog
                open={!!deletingEquipId}
                onOpenChange={() => setDeletingEquipId(null)}
                onConfirm={handleDeleteEquip}
                title="Excluir Equipamento"
                description="Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                variant="danger"
                loading={deleteEquip.isPending}
            />

            {/* Delete Category */}
            <ConfirmDialog
                open={!!deletingCatId}
                onOpenChange={() => setDeletingCatId(null)}
                onConfirm={() => {
                    if (deletingCatId) deleteCat.mutate(deletingCatId, { onSuccess: () => setDeletingCatId(null) });
                }}
                title="Excluir Categoria"
                description="Tem certeza? Categorias com equipamentos vinculados não podem ser excluídas."
                confirmText="Excluir"
                variant="danger"
                loading={deleteCat.isPending}
            />

            {/* Delete Status */}
            <ConfirmDialog
                open={!!deletingStatusId}
                onOpenChange={() => setDeletingStatusId(null)}
                onConfirm={() => {
                    if (deletingStatusId) deleteSt.mutate(deletingStatusId, { onSuccess: () => setDeletingStatusId(null) });
                }}
                title="Excluir Status"
                description="Tem certeza? Status com equipamentos vinculados não podem ser excluídos."
                confirmText="Excluir"
                variant="danger"
                loading={deleteSt.isPending}
            />

            {/* Equipment Schedule Modal */}
            <EquipmentScheduleModal
                equipmentId={scheduleEquipId}
                open={!!scheduleEquipId}
                onClose={() => setScheduleEquipId(null)}
            />
        </AppShell>
    );
};

export default EquipmentInventory;
