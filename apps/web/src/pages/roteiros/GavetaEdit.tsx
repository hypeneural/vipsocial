import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    GripVertical,
    FileText,
    Loader2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface GavetaItem {
    id: string;
    titulo: string;
    conteudo: string;
    ordem: number;
}

const GavetaEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [active, setActive] = useState(true);
    const [items, setItems] = useState<GavetaItem[]>([]);

    // Load data if editing
    useEffect(() => {
        if (isEditing) {
            // TODO: Fetch from API
            setTimeout(() => {
                setNome("Gaveta Polícia");
                setDescricao("Notícias policiais para o jornal");
                setActive(true);
                setItems([
                    { id: "1", titulo: "Prisão em Tijucas", conteudo: "Homem foi preso em flagrante...", ordem: 1 },
                    { id: "2", titulo: "Acidente na BR-101", conteudo: "Caminhão tombou na madrugada...", ordem: 2 },
                    { id: "3", titulo: "Operação da PF", conteudo: "Polícia Federal realizou operação...", ordem: 3 },
                ]);
                setIsLoading(false);
            }, 500);
        }
    }, [isEditing, id]);

    const addItem = () => {
        const newItem: GavetaItem = {
            id: Date.now().toString(),
            titulo: "",
            conteudo: "",
            ordem: items.length + 1,
        };
        setItems([...items, newItem]);
    };

    const removeItem = (itemId: string) => {
        setItems(items.filter((item) => item.id !== itemId));
    };

    const updateItem = (itemId: string, field: keyof GavetaItem, value: string) => {
        setItems(
            items.map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item
            )
        );
    };

    const handleSave = async () => {
        if (!nome.trim()) {
            alert("Preencha o nome da gaveta");
            return;
        }

        setIsSaving(true);

        const payload = {
            nome,
            descricao,
            active,
            items: items.map((item, index) => ({
                ...item,
                ordem: index + 1,
            })),
        };

        console.log("Saving gaveta:", payload);

        // TODO: Save to API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsSaving(false);
        navigate("/pauta/roteiros/gavetas");
    };

    if (isLoading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <Link
                    to="/pauta/roteiros/gavetas"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Gavetas
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">
                            {isEditing ? "Editar Gaveta" : "Nova Gaveta"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isEditing ? "Atualize os itens da gaveta" : "Crie uma nova gaveta de conteúdo"}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Label htmlFor="active" className="text-sm">Ativa</Label>
                        <Switch
                            id="active"
                            checked={active}
                            onCheckedChange={setActive}
                        />
                    </div>
                </div>
            </motion.div>

            <div className="max-w-3xl space-y-6">
                {/* Informações Básicas */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card rounded-2xl border border-border/50 p-6"
                >
                    <h2 className="font-semibold text-lg mb-4">Informações</h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nome">Nome da Gaveta *</Label>
                            <Input
                                id="nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Ex: Gaveta Polícia"
                                className="rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="descricao">Descrição</Label>
                            <Textarea
                                id="descricao"
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                placeholder="Descreva o conteúdo desta gaveta..."
                                className="rounded-xl min-h-[80px]"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Items */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-2xl border border-border/50 p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-semibold text-lg">Itens da Gaveta</h2>
                            <p className="text-sm text-muted-foreground">
                                {items.length} {items.length === 1 ? "item" : "itens"}
                            </p>
                        </div>
                        <Button onClick={addItem} variant="outline" className="rounded-xl">
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Item
                        </Button>
                    </div>

                    {items.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>Nenhum item ainda</p>
                            <p className="text-sm">Clique em "Adicionar Item" para começar</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="group bg-muted/30 rounded-xl p-4 border border-border/30"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="pt-2 cursor-grab text-muted-foreground hover:text-foreground">
                                            <GripVertical className="w-5 h-5" />
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    #{index + 1}
                                                </Badge>
                                                <Input
                                                    value={item.titulo}
                                                    onChange={(e) => updateItem(item.id, "titulo", e.target.value)}
                                                    placeholder="Título do item"
                                                    className="flex-1 h-9 rounded-lg"
                                                />
                                            </div>

                                            <Textarea
                                                value={item.conteudo}
                                                onChange={(e) => updateItem(item.id, "conteudo", e.target.value)}
                                                placeholder="Conteúdo do item..."
                                                className="rounded-lg min-h-[80px] resize-y"
                                            />
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeItem(item.id)}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex gap-3 pb-20 md:pb-0"
                >
                    <Button
                        variant="outline"
                        onClick={() => navigate("/pauta/roteiros/gavetas")}
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
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                {isEditing ? "Salvar" : "Criar Gaveta"}
                            </>
                        )}
                    </Button>
                </motion.div>
            </div>
        </AppShell>
    );
};

export default GavetaEdit;
