import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/roteiros/RichTextEditor";
import { formatEdition } from "@/types/roteiros";
import { cn } from "@/lib/utils";

interface RoteiroFormItem {
    id: string;
    shortcut: string;
    title: string;
    description: string;
    duration: string;
}

const createEmptyItem = (index: number): RoteiroFormItem => ({
    id: `new-${Date.now()}-${index}`,
    shortcut: `F${index + 1}`,
    title: "",
    description: "",
    duration: "00:00:00",
});

const RoteirosCreate = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const [date, setDate] = useState(dateParam);
    const [items, setItems] = useState<RoteiroFormItem[]>([createEmptyItem(0)]);
    const [isSaving, setIsSaving] = useState(false);

    const addItem = () => {
        setItems([...items, createEmptyItem(items.length)]);
    };

    const removeItem = (id: string) => {
        if (items.length === 1) {
            alert("O roteiro deve ter pelo menos um item");
            return;
        }
        if (confirm("Deseja remover este item?")) {
            setItems(items.filter((item) => item.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof RoteiroFormItem, value: string) => {
        setItems(
            items.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const handleSave = async () => {
        // Validação
        const invalidItems = items.filter((item) => !item.title.trim());
        if (invalidItems.length > 0) {
            alert("Preencha o título de todos os itens");
            return;
        }

        setIsSaving(true);

        // TODO: Salvar no backend
        const payload = {
            date,
            data: items.map((item, index) => ({
                shortcut: item.shortcut || `F${index + 1}`,
                title: item.title,
                description: item.description,
                duration: item.duration || "00:00:00",
                priority: index + 1,
            })),
        };

        console.log("Saving:", payload);

        // Simula delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsSaving(false);
        navigate("/roteiros");
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
                    to="/roteiros"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Roteiros
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">Criar Roteiro</h1>
                        <p className="text-sm text-muted-foreground">
                            Adicione os itens da pauta do dia
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Label>Data:</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-auto"
                            />
                        </div>
                        <div className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg">
                            {formatEdition(date)}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Form Items */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4 mb-6"
            >
                {items.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-card rounded-2xl border border-border/50 p-4"
                    >
                        <div className="flex items-start gap-4">
                            {/* Number */}
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0">
                                {index + 1}
                            </div>

                            <div className="flex-1 space-y-4">
                                {/* Row 1: Shortcut + Duration */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>Atalho</Label>
                                        <Input
                                            type="text"
                                            value={item.shortcut}
                                            onChange={(e) =>
                                                updateItem(item.id, "shortcut", e.target.value.toUpperCase())
                                            }
                                            placeholder="F1"
                                            className="text-center font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Duração</Label>
                                        <Input
                                            type="text"
                                            value={item.duration}
                                            onChange={(e) => updateItem(item.id, "duration", e.target.value)}
                                            placeholder="00:00:00"
                                            className="text-center font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Title */}
                                <div className="space-y-2">
                                    <Label>Título *</Label>
                                    <RichTextEditor
                                        value={item.title}
                                        onChange={(html) => updateItem(item.id, "title", html)}
                                        placeholder="Digite o título da matéria..."
                                        minHeight="40px"
                                    />
                                </div>

                                {/* Row 3: Description */}
                                <div className="space-y-2">
                                    <Label>Linha de Apoio</Label>
                                    <RichTextEditor
                                        value={item.description}
                                        onChange={(html) => updateItem(item.id, "description", html)}
                                        placeholder="Descrição complementar..."
                                        minHeight="40px"
                                    />
                                </div>
                            </div>

                            {/* Delete */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                                onClick={() => removeItem(item.id)}
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Actions */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 pb-20 md:pb-0"
            >
                <Button variant="outline" onClick={addItem} className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Mais Item
                </Button>

                <div className="flex-1" />

                <Button variant="outline" onClick={() => navigate("/roteiros")} className="rounded-xl">
                    Cancelar
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary-dark rounded-xl"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Salvando..." : "Salvar Roteiro"}
                </Button>
            </motion.div>
        </AppShell>
    );
};

export default RoteirosCreate;
