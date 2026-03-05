import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { gavetaService } from "@/services/roteiro.service";
import showToast from "@/lib/toast";

interface GavetaFormItem {
    id: string;
    nome: string;
    descricao: string;
}

const createEmptyGaveta = (): GavetaFormItem => ({
    id: `new-${Date.now()}-${Math.random()}`,
    nome: "",
    descricao: "",
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
        const validItems = items.filter(
            (item) => item.nome.trim()
        );

        if (validItems.length === 0) {
            showToast.error("Adicione pelo menos uma gaveta com nome.");
            return;
        }

        setIsSaving(true);

        try {
            // Save each gaveta via API
            for (const item of validItems) {
                await gavetaService.create({
                    nome: item.nome.trim(),
                    descricao: item.descricao.trim() || undefined,
                });
            }

            showToast.success(
                validItems.length === 1
                    ? "Gaveta criada com sucesso!"
                    : `${validItems.length} gavetas criadas com sucesso!`
            );
            navigate("/roteiros/gavetas");
        } catch (error: any) {
            const message = error.response?.data?.message || "Erro ao criar gaveta(s)";
            showToast.error(message);
        } finally {
            setIsSaving(false);
        }
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
                        <div className="flex items-start gap-4">
                            {/* Number */}
                            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center font-bold text-warning flex-shrink-0 mt-1">
                                {index + 1}
                            </div>

                            {/* Fields */}
                            <div className="flex-1 space-y-3">
                                <div>
                                    <Label>Nome da Gaveta *</Label>
                                    <Input
                                        type="text"
                                        value={item.nome}
                                        onChange={(e) => updateItem(item.id, "nome", e.target.value)}
                                        placeholder="Ex: Entrevista com o prefeito"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <Label>Descrição</Label>
                                    <Textarea
                                        value={item.descricao}
                                        onChange={(e) => updateItem(item.id, "descricao", e.target.value)}
                                        placeholder="Descrição opcional..."
                                        className="w-full min-h-[60px]"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            {/* Delete */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0 mt-1"
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
