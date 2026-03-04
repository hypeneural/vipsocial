import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Save,
    Image,
    Calendar,
    Upload,
    X,
    MessageCircle,
    Check,
    ImagePlus,
    FileEdit,
    CheckCircle,
    Archive,
} from "lucide-react";
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
    PhotoGallery,
    GalleryStatus,
    GalleryBanner,
    GALLERY_STATUS_CONFIG,
    generateGalleryUrl,
} from "@/types/galeria";
import { cn } from "@/lib/utils";

// ==========================================
// STATUS ICONS
// ==========================================
const StatusIcon = ({ status }: { status: GalleryStatus }) => {
    switch (status) {
        case 'rascunho':
            return <FileEdit className="w-4 h-4" />;
        case 'ativa':
            return <CheckCircle className="w-4 h-4" />;
        case 'arquivada':
            return <Archive className="w-4 h-4" />;
    }
};

// ==========================================
// MOCK WHATSAPP GROUPS
// ==========================================
const mockWhatsAppGroups = [
    { id: 1, nome: "TV Jornal Principal", membros: 256 },
    { id: 2, nome: "Comercial VIP", membros: 189 },
    { id: 3, nome: "Redação Urgente", membros: 45 },
    { id: 4, nome: "Parceiros Imprensa", membros: 312 },
    { id: 5, nome: "Plantão Notícias", membros: 128 },
    { id: 6, nome: "Equipe Externa", membros: 34 },
];

// ==========================================
// DEFAULT VALUES
// ==========================================
const getDefaultFormData = (): Partial<PhotoGallery> => ({
    titulo: "",
    descricao: "",
    evento_data: "",
    status: "rascunho",
    grupos_whatsapp: [],
    banners: [],
    fotos: [],
});

// ==========================================
// MAIN COMPONENT
// ==========================================
const GalleryForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [formData, setFormData] = useState<Partial<PhotoGallery>>(getDefaultFormData());
    const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
    const [uploadedBanners, setUploadedBanners] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [savedGallery, setSavedGallery] = useState<PhotoGallery | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        const slug = formData.titulo?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'galeria';

        const newGallery: PhotoGallery = {
            id: Date.now(),
            titulo: formData.titulo || "",
            descricao: formData.descricao,
            slug: `${slug}-${Date.now()}`,
            evento_data: formData.evento_data,
            status: formData.status || "rascunho",
            banners: uploadedBanners.map((url, i) => ({
                id: i + 1,
                url,
                ordem: i,
                created_at: new Date().toISOString(),
            })),
            fotos: [],
            grupos_whatsapp: mockWhatsAppGroups.filter((g) => selectedGroups.includes(g.id)),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        setSavedGallery(newGallery);
        setIsSaving(false);
    };

    const handleToggleGroup = (groupId: number) => {
        setSelectedGroups((prev) =>
            prev.includes(groupId)
                ? prev.filter((id) => id !== groupId)
                : [...prev, groupId]
        );
    };

    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        // Simulate upload - in real app, would upload to server
        Array.from(files).forEach((file) => {
            const url = URL.createObjectURL(file);
            setUploadedBanners((prev) => [...prev, url]);
        });
    };

    const removeBanner = (index: number) => {
        setUploadedBanners((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <AppShell>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/cobertura-vip")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">
                            {isEditing ? "Editar Galeria" : "Nova Galeria"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Configure os detalhes da galeria de fotos
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Success State */}
            {savedGallery && (
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
                                <p className="font-medium text-green-600">Galeria criada com sucesso!</p>
                                <p className="text-sm text-muted-foreground">
                                    Link: {generateGalleryUrl(savedGallery.slug)}
                                </p>
                            </div>
                        </div>
                        <Button onClick={() => navigate(`/cobertura-vip/${savedGallery.id}`)}>
                            Ver Galeria
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        {/* Basic Info */}
                        <div className="bg-card rounded-xl border p-6 space-y-4">
                            <h2 className="font-semibold flex items-center gap-2">
                                <Image className="w-5 h-5" />
                                Informações da Galeria
                            </h2>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="titulo">Título da Galeria *</Label>
                                    <Input
                                        id="titulo"
                                        value={formData.titulo || ""}
                                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                        placeholder="Ex: Casamento Ana & Pedro"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="descricao">Descrição</Label>
                                    <Textarea
                                        id="descricao"
                                        value={formData.descricao || ""}
                                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                        placeholder="Descrição que aparecerá na galeria..."
                                        rows={3}
                                    />
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="evento_data">Data do Evento</Label>
                                        <Input
                                            id="evento_data"
                                            type="date"
                                            value={formData.evento_data || ""}
                                            onChange={(e) => setFormData({ ...formData, evento_data: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(v) => setFormData({ ...formData, status: v as GalleryStatus })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
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
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Banner Upload */}
                        <div className="bg-card rounded-xl border p-6 space-y-4">
                            <h2 className="font-semibold flex items-center gap-2">
                                <ImagePlus className="w-5 h-5" />
                                Banners
                                <span className="text-xs text-muted-foreground font-normal ml-2">
                                    (exibidos no topo da galeria)
                                </span>
                            </h2>

                            <div className="border-2 border-dashed rounded-xl p-6 text-center">
                                <input
                                    type="file"
                                    id="banners"
                                    multiple
                                    accept="image/*"
                                    onChange={handleBannerUpload}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="banners"
                                    className="cursor-pointer flex flex-col items-center gap-2"
                                >
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                    <p className="font-medium text-sm">Clique para enviar banners</p>
                                    <p className="text-xs text-muted-foreground">
                                        PNG, JPG até 5MB
                                    </p>
                                </label>
                            </div>

                            {uploadedBanners.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {uploadedBanners.map((url, i) => (
                                        <div key={i} className="relative aspect-[16/9] rounded-lg overflow-hidden group border">
                                            <img src={url} alt={`Banner ${i + 1}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeBanner(i)}
                                                    className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                                                >
                                                    <X className="w-4 h-4 text-white" />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-2 left-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    Banner {i + 1}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="text-xs text-muted-foreground text-center">
                                {uploadedBanners.length} banner(s) adicionado(s)
                            </p>
                        </div>

                        {/* Info about photos */}
                        <div className="bg-blue-500/10 rounded-xl border border-blue-500/30 p-4">
                            <div className="flex items-start gap-3">
                                <MessageCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-blue-600 text-sm">Upload de fotos via WhatsApp</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        As fotos serão enviadas diretamente pelos grupos de WhatsApp vinculados.
                                        Após criar a galeria, compartilhe o link nos grupos selecionados.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                    >
                        {/* WhatsApp Groups */}
                        <div className="bg-card rounded-xl border p-6 space-y-4">
                            <h2 className="font-semibold flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-green-500" />
                                Grupos WhatsApp
                            </h2>

                            <p className="text-xs text-muted-foreground">
                                Selecione os grupos para vincular à galeria
                            </p>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {mockWhatsAppGroups.map((group) => {
                                    const isSelected = selectedGroups.includes(group.id);
                                    return (
                                        <label
                                            key={group.id}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                                isSelected ? "bg-green-500/10 border border-green-500/30" : "hover:bg-muted border border-transparent"
                                            )}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => handleToggleGroup(group.id)}
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{group.nome}</p>
                                                <p className="text-xs text-muted-foreground">{group.membros} membros</p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>

                            <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground text-center">
                                    {selectedGroups.length} grupo(s) selecionado(s)
                                </p>
                            </div>
                        </div>

                        {/* Submit */}
                        <Button type="submit" className="w-full rounded-xl" size="lg" disabled={isSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Galeria"}
                        </Button>
                    </motion.div>
                </div>
            </form>
        </AppShell>
    );
};

export default GalleryForm;
