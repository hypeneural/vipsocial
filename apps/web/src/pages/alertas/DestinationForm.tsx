import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Phone, Tag, Plus, X, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const DestinationForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState("");
    const [active, setActive] = useState(true);

    // Load data if editing
    useEffect(() => {
        if (isEditing) {
            // TODO: Fetch from API
            setTimeout(() => {
                setName("VIP Tijucas");
                setPhoneNumber("+55 47 99999-1234");
                setTags(["tijucas", "geral"]);
                setActive(true);
                setIsLoading(false);
            }, 500);
        }
    }, [isEditing, id]);

    const addTag = () => {
        const tag = newTag.trim().toLowerCase();
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag]);
            setNewTag("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTag();
        }
    };

    const handleSave = async () => {
        // Validação
        if (!name.trim()) {
            alert("Preencha o nome do destino");
            return;
        }
        if (!phoneNumber.trim()) {
            alert("Preencha o número do telefone/grupo");
            return;
        }

        setIsSaving(true);

        // TODO: Save to API
        const payload = {
            name,
            phone_number: phoneNumber,
            tags,
            active,
        };

        console.log("Saving destination:", payload);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsSaving(false);
        navigate("/alertas/destinos");
    };

    return (
        <AppShell>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <Link
                    to="/alertas/destinos"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Destinos
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">
                            {isEditing ? "Editar Destino" : "Novo Destino"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isEditing ? "Atualize as informações do grupo" : "Cadastre um grupo de WhatsApp"}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Label htmlFor="active" className="text-sm">Ativo</Label>
                        <Switch
                            id="active"
                            checked={active}
                            onCheckedChange={setActive}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Form */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="max-w-2xl"
            >
                <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-6">
                    {/* Nome */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do Destino *</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: VIP Tijucas"
                                className="pl-10 rounded-xl"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Nome amigável para identificar o grupo
                        </p>
                    </div>

                    {/* Número */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">Número/ID do Grupo *</Label>
                        <Input
                            id="phone"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+55 47 99999-9999"
                            className="rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground">
                            Formato internacional com código do país
                        </p>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label>Tags (opcional)</Label>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Digite uma tag e pressione Enter"
                                    className="pl-10 rounded-xl"
                                />
                            </div>
                            <Button type="button" variant="outline" onClick={addTag} className="rounded-xl">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>

                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="px-3 py-1 text-sm">
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="ml-2 hover:text-destructive"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                            Tags ajudam a agrupar destinos (ex: tijucas, esportes, geral)
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 pb-20 md:pb-0">
                    <Button
                        variant="outline"
                        onClick={() => navigate("/alertas/destinos")}
                        className="rounded-xl"
                    >
                        Cancelar
                    </Button>
                    <div className="flex-1" />
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary-dark rounded-xl min-w-[120px]"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Salvando..." : "Salvar Destino"}
                    </Button>
                </div>
            </motion.div>
        </AppShell>
    );
};

export default DestinationForm;
