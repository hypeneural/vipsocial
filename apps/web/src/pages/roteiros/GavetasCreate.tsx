import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface GavetaFormItem {
    id: string;
    title: string;
    author: string;
}

const createEmptyGaveta = (): GavetaFormItem => ({
    id: `new-${Date.now()}-${Math.random()}`,
    title: "",
    author: "",
});

const GavetasCreate = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState<GavetaFormItem[]>([createEmptyGaveta()]);
    const [isSaving, setIsSaving] = useState(false);

    const addItem = () => {
        setItems([...items, createEmptyGaveta()]);
    };

    const removeItem = (id: string) => {
        if (items.length === 1) {
            // Limpa o item ao invés de remover
            setItems([createEmptyGaveta()]);
            return;
        }
        if (confirm("Deseja remover esta gaveta?")) {
            setItems(items.filter((item) => item.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof GavetaFormItem, value: string) => {
        setItems(
            items.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const handleSave = async () => {
        // Filtra itens válidos
        const validItems = items.filter(
            (item) => item.title.trim() && item.author.trim()
        );

        if (validItems.length === 0) {
            alert("Adicione pelo menos uma gaveta com Título e Autor.");
            return;
        }

        setIsSaving(true);

        // TODO: Salvar no backend
        const payload = {
            data: validItems.map((item) => ({
                title: item.title,
                author: item.author,
            })),
        };

        console.log("Saving gavetas:", payload);

        // Simula delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsSaving(false);
        navigate("/roteiros/gavetas");
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
                    to="/roteiros/gavetas"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Gavetas
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">Criar Gavetas</h1>
                        <p className="text-sm text-muted-foreground">
                            Adicione matérias em espera para uso posterior
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Info */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-6 p-4 bg-info/10 border border-info/30 rounded-xl"
            >
                <p className="text-sm text-info">
                    <strong>💡 Dica:</strong> Gavetas são matérias de reserva que ficam disponíveis para uso quando necessário.
                    Elas não estão vinculadas a nenhum roteiro específico.
                </p>
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
                        <div className="flex items-center gap-4">
                            {/* Number */}
                            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center font-bold text-warning flex-shrink-0">
                                {index + 1}
                            </div>

                            {/* Title */}
                            <div className="flex-1 space-y-2">
                                <Label>Título da Matéria *</Label>
                                <Input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => updateItem(item.id, "title", e.target.value)}
                                    placeholder="Ex: Entrevista com o prefeito"
                                    className="w-full"
                                />
                            </div>

                            {/* Author */}
                            <div className="w-40 space-y-2">
                                <Label>Autor *</Label>
                                <Input
                                    type="text"
                                    value={item.author}
                                    onChange={(e) => updateItem(item.id, "author", e.target.value)}
                                    placeholder="Nome"
                                />
                            </div>

                            {/* Delete */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0 mt-6"
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
                    Adicionar Mais Gaveta
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
                    {isSaving ? "Salvando..." : "Salvar Gavetas"}
                </Button>
            </motion.div>
        </AppShell>
    );
};

export default GavetasCreate;
