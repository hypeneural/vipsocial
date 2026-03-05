import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, GripVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/roteiros/RichTextEditor";
import { StatisticsCards } from "@/components/roteiros/StatisticsCards";
import { ShortcutBall } from "@/components/roteiros/ShortcutBall";
import { formatEdition, NewsItem, durationToSeconds, secondsToDuration } from "@/types/roteiros";
import { cn } from "@/lib/utils";

// Mock data for editing
const mockItems: NewsItem[] = [
    {
        id: 1,
        date: "2026-01-20",
        shortcut: "F1",
        title: "<b>Prefeitura anuncia novo pacote de obras</b>",
        description: "Investimento de R$ 50 milhões em infraestrutura",
        duration: "00:05:00",
        priority: 1,
        is_aired: 1,
        created_at: "2026-01-20 07:00:00",
        updated_at: "2026-01-20 14:30:00",
    },
    {
        id: 2,
        date: "2026-01-20",
        shortcut: "F2",
        title: "Chuvas causam alagamentos na região central",
        description: "Defesa Civil em alerta para novas precipitações",
        duration: "00:03:30",
        priority: 2,
        is_aired: 0,
        created_at: "2026-01-20 08:00:00",
        updated_at: "2026-01-20 14:30:00",
    },
    {
        id: 3,
        date: "2026-01-20",
        shortcut: "F3",
        title: "<i>Entrevista exclusiva com o Secretário de Saúde</i>",
        description: "Balanço das ações de vacinação no município",
        duration: "00:08:00",
        priority: 3,
        is_aired: 0,
        created_at: "2026-01-20 09:00:00",
        updated_at: "2026-01-20 14:30:00",
    },
];

const RoteirosEdit = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const [date] = useState(dateParam);
    const [items, setItems] = useState<NewsItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Load data
    useEffect(() => {
        // TODO: Fetch from API
        setItems(mockItems.filter(item => item.date === dateParam));
    }, [dateParam]);

    // Calculate total duration
    const totalDuration = items.reduce((acc, item) => acc + durationToSeconds(item.duration), 0);
    const totalDurationDisplay = secondsToDuration(totalDuration);

    const addItem = () => {
        const newItem: NewsItem = {
            id: Date.now(),
            date,
            shortcut: `F${items.length + 1}`,
            title: "",
            description: "",
            duration: "00:00",
            priority: items.length + 1,
            is_aired: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setItems([...items, newItem]);
    };

    const removeItem = (id: number) => {
        if (confirm("Deseja excluir este item?")) {
            setItems(items.filter((item) => item.id !== id));
        }
    };

    const updateItem = (id: number, field: keyof NewsItem, value: string | number) => {
        setItems(
            items.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newItems = [...items];
        const [removed] = newItems.splice(draggedIndex, 1);
        newItems.splice(index, 0, removed);

        // Update priorities
        const updatedItems = newItems.map((item, i) => ({
            ...item,
            priority: i + 1,
            shortcut: `F${i + 1}`
        }));

        setItems(updatedItems);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleSave = async () => {
        // Validate
        const invalidItems = items.filter((item) => !item.title.trim());
        if (invalidItems.length > 0) {
            alert("Preencha o título de todos os itens");
            return;
        }

        setIsSaving(true);

        // TODO: Save to API
        const payload = {
            date,
            data: items.map((item, index) => ({
                id: item.id,
                shortcut: item.shortcut || `F${index + 1}`,
                title: item.title,
                description: item.description,
                duration: item.duration || "00:00",
                priority: index + 1,
            })),
        };

        console.log("Saving:", payload);

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
                        <h1 className="text-xl md:text-2xl font-bold">Editar Roteiro</h1>
                        <p className="text-sm text-muted-foreground">
                            Edição completa da pauta do dia
                        </p>
                    </div>

                    <div className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-lg">
                        {formatEdition(date)}
                    </div>
                </div>
            </motion.div>

            {/* Statistics */}
            <StatisticsCards
                totalItems={items.length}
                totalDuration={totalDurationDisplay}
                className="mb-6"
            />

            {/* Items */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4 mb-6"
            >
                {items.map((item, index) => (
                    <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                            "bg-card rounded-2xl border border-border/50 p-4 transition-all",
                            draggedIndex === index && "opacity-50 scale-[1.02] shadow-lg"
                        )}
                    >
                        <div className="flex items-start gap-4">
                            {/* Drag Handle */}
                            <div className="pt-2 cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-5 h-5 text-muted-foreground" />
                            </div>

                            {/* Shortcut */}
                            <div className="pt-1">
                                <ShortcutBall shortcut={item.shortcut} size="md" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 space-y-4">
                                {/* Row 1 */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Atalho</Label>
                                        <Input
                                            type="text"
                                            value={item.shortcut}
                                            onChange={(e) =>
                                                updateItem(item.id, "shortcut", e.target.value.toUpperCase())
                                            }
                                            className="text-center font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Duração</Label>
                                        <Input
                                            type="text"
                                            value={item.duration}
                                            onChange={(e) => updateItem(item.id, "duration", e.target.value)}
                                            placeholder="00:00"
                                            className="text-center font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Prioridade</Label>
                                        <Input
                                            type="number"
                                            value={item.priority}
                                            onChange={(e) => updateItem(item.id, "priority", parseInt(e.target.value))}
                                            className="text-center"
                                        />
                                    </div>
                                </div>

                                {/* Row 2 - Title */}
                                <div className="space-y-2">
                                    <Label>Título *</Label>
                                    <RichTextEditor
                                        value={item.title}
                                        onChange={(html) => updateItem(item.id, "title", html)}
                                        placeholder="Digite o título da matéria..."
                                        minHeight="50px"
                                    />
                                </div>

                                {/* Row 3 - Description */}
                                <div className="space-y-2">
                                    <Label>Linha de Apoio</Label>
                                    <RichTextEditor
                                        value={item.description}
                                        onChange={(html) => updateItem(item.id, "description", html)}
                                        placeholder="Descrição complementar..."
                                        minHeight="50px"
                                    />
                                </div>
                            </div>

                            {/* Delete */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => removeItem(item.id)}
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>
                ))}

                {items.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p className="mb-4">Nenhum item neste roteiro</p>
                        <Button onClick={addItem}>
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Primeiro Item
                        </Button>
                    </div>
                )}
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
                    Adicionar Item
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
                    {isSaving ? "Salvando..." : "Salvar Alterações"}
                </Button>
            </motion.div>
        </AppShell>
    );
};

export default RoteirosEdit;
