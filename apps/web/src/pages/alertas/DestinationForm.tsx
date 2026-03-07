import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, Plus, Save, Tag, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useCreateDestination, useDestination, useUpdateDestination } from "@/hooks/useAlertas";

const DestinationForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const destinationId = id ? Number(id) : undefined;
    const isEditing = Boolean(destinationId);

    const destinationQuery = useDestination(destinationId);
    const createMutation = useCreateDestination();
    const updateMutation = useUpdateDestination();

    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState("");
    const [active, setActive] = useState(true);

    useEffect(() => {
        if (!destinationQuery.data?.data) {
            return;
        }

        const destination = destinationQuery.data.data;
        setName(destination.name);
        setPhoneNumber(destination.phone_number);
        setTags(destination.tags ?? []);
        setActive(destination.active);
    }, [destinationQuery.data]);

    const addTag = () => {
        const tag = newTag.trim().toLowerCase();
        if (!tag || tags.includes(tag)) {
            return;
        }

        setTags([...tags, tag]);
        setNewTag("");
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addTag();
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            window.alert("Preencha o nome do destino");
            return;
        }

        if (!phoneNumber.trim()) {
            window.alert("Preencha o numero ou ID do grupo");
            return;
        }

        const payload = {
            name: name.trim(),
            phone_number: phoneNumber.trim(),
            tags,
            active,
        };

        try {
            if (isEditing && destinationId) {
                await updateMutation.mutateAsync({ id: destinationId, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }

            navigate("/alertas/destinos");
        } catch {
            return;
        }
    };

    const isLoading = destinationQuery.isLoading;
    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <AppShell>
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
                            Cadastre um telefone ou ID de grupo para receber alertas.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Label htmlFor="active" className="text-sm">
                            Ativo
                        </Label>
                        <Switch id="active" checked={active} onCheckedChange={setActive} />
                    </div>
                </div>
            </motion.div>

            {isLoading ? (
                <div className="max-w-2xl rounded-2xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
                    Carregando destino...
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="max-w-2xl"
                >
                    <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome do Destino *</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    placeholder="Ex: Grupo Jornal VIP"
                                    className="pl-10 rounded-xl"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Nome amigavel para identificar o destino.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Numero/ID do Grupo *</Label>
                            <Input
                                id="phone"
                                value={phoneNumber}
                                onChange={(event) => setPhoneNumber(event.target.value)}
                                placeholder="Ex: 120363027326371817-group"
                                className="rounded-xl"
                            />
                            <p className="text-xs text-muted-foreground">
                                Pode ser telefone com DDI ou group_id da Z-API.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        value={newTag}
                                        onChange={(event) => setNewTag(event.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Digite uma tag e pressione Enter"
                                        className="pl-10 rounded-xl"
                                    />
                                </div>
                                <Button type="button" variant="outline" onClick={addTag} className="rounded-xl">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            {tags.length > 0 ? (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {tags.map((tag) => (
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
                            ) : null}

                            <p className="text-xs text-muted-foreground">
                                Use tags para organizar destinos por cidade, editoria ou operacao.
                            </p>
                        </div>
                    </div>

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
            )}
        </AppShell>
    );
};

export default DestinationForm;
