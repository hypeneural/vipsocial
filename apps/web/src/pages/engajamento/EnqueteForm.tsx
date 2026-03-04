import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    GripVertical,
    Vote,
    Loader2,
    Calendar,
    Clock,
    MessageCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface PollOption {
    id: string;
    text: string;
    ordem: number;
}

const EnqueteForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState<PollOption[]>([
        { id: "1", text: "", ordem: 1 },
        { id: "2", text: "", ordem: 2 },
    ]);
    const [allowMultiple, setAllowMultiple] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [publishWhatsApp, setPublishWhatsApp] = useState(true);
    const [publishPortal, setPublishPortal] = useState(true);
    const [publishApp, setPublishApp] = useState(false);

    // Load data if editing
    useEffect(() => {
        if (isEditing) {
            // TODO: Fetch from API
            setTimeout(() => {
                setQuestion("Qual a prioridade para melhorias na cidade?");
                setOptions([
                    { id: "1", text: "Transporte público", ordem: 1 },
                    { id: "2", text: "Saúde", ordem: 2 },
                    { id: "3", text: "Educação", ordem: 3 },
                    { id: "4", text: "Segurança", ordem: 4 },
                ]);
                setAllowMultiple(false);
                setStartDate("2026-01-15");
                setEndDate("2026-01-25");
                setPublishWhatsApp(true);
                setPublishPortal(true);
                setPublishApp(true);
                setIsLoading(false);
            }, 500);
        }
    }, [isEditing, id]);

    const addOption = () => {
        const newOption: PollOption = {
            id: Date.now().toString(),
            text: "",
            ordem: options.length + 1,
        };
        setOptions([...options, newOption]);
    };

    const removeOption = (optionId: string) => {
        if (options.length <= 2) {
            alert("A enquete precisa ter pelo menos 2 opções");
            return;
        }
        setOptions(options.filter((opt) => opt.id !== optionId));
    };

    const updateOption = (optionId: string, text: string) => {
        setOptions(
            options.map((opt) =>
                opt.id === optionId ? { ...opt, text } : opt
            )
        );
    };

    const handleSave = async () => {
        if (!question.trim()) {
            alert("Preencha a pergunta da enquete");
            return;
        }

        const emptyOptions = options.filter((opt) => !opt.text.trim());
        if (emptyOptions.length > 0) {
            alert("Preencha todas as opções");
            return;
        }

        setIsSaving(true);

        const channels = [];
        if (publishWhatsApp) channels.push("WhatsApp");
        if (publishPortal) channels.push("Portal");
        if (publishApp) channels.push("App");

        const payload = {
            question,
            options: options.map((opt, index) => ({
                text: opt.text,
                ordem: index + 1,
            })),
            allowMultiple,
            startDate,
            endDate,
            channels,
        };

        console.log("Saving poll:", payload);

        // TODO: Save to API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsSaving(false);
        navigate("/engajamento/enquetes");
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
                    to="/engajamento/enquetes"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Enquetes
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">
                            {isEditing ? "Editar Enquete" : "Nova Enquete"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isEditing ? "Atualize a pergunta e opções" : "Crie uma nova enquete"}
                        </p>
                    </div>
                </div>
            </motion.div>

            <div className="max-w-3xl space-y-6">
                {/* Pergunta */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card rounded-2xl border border-border/50 p-6"
                >
                    <h2 className="font-semibold text-lg mb-4">Pergunta</h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="question">Pergunta da Enquete *</Label>
                            <Input
                                id="question"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Ex: Qual a sua opinião sobre...?"
                                className="rounded-xl text-lg"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="allowMultiple"
                                checked={allowMultiple}
                                onCheckedChange={(checked) => setAllowMultiple(checked as boolean)}
                            />
                            <Label htmlFor="allowMultiple" className="cursor-pointer">
                                Permitir múltipla escolha
                            </Label>
                        </div>
                    </div>
                </motion.div>

                {/* Opções */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-2xl border border-border/50 p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-semibold text-lg">Opções de Resposta</h2>
                            <p className="text-sm text-muted-foreground">
                                Mínimo 2, máximo 10 opções
                            </p>
                        </div>
                        <Button
                            onClick={addOption}
                            variant="outline"
                            className="rounded-xl"
                            disabled={options.length >= 10}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {options.map((option, index) => (
                            <div
                                key={option.id}
                                className="group flex items-center gap-3"
                            >
                                <div className="cursor-grab text-muted-foreground hover:text-foreground">
                                    <GripVertical className="w-5 h-5" />
                                </div>

                                <Badge variant="outline" className="text-xs shrink-0">
                                    {index + 1}
                                </Badge>

                                <Input
                                    value={option.text}
                                    onChange={(e) => updateOption(option.id, e.target.value)}
                                    placeholder={`Opção ${index + 1}`}
                                    className="flex-1 rounded-lg"
                                />

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeOption(option.id)}
                                    className="text-muted-foreground hover:text-destructive shrink-0"
                                    disabled={options.length <= 2}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Agendamento */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card rounded-2xl border border-border/50 p-6"
                >
                    <h2 className="font-semibold text-lg mb-4">Agendamento</h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate" className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Data de Início
                            </Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endDate" className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Data de Término
                            </Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-3">
                        Deixe em branco para iniciar imediatamente sem data de término
                    </p>
                </motion.div>

                {/* Canais */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-card rounded-2xl border border-border/50 p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <MessageCircle className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-lg">Canais de Publicação</h2>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                    <MessageCircle className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">WhatsApp</p>
                                    <p className="text-xs text-muted-foreground">Enviar para grupos</p>
                                </div>
                            </div>
                            <Switch
                                checked={publishWhatsApp}
                                onCheckedChange={setPublishWhatsApp}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <Vote className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Portal</p>
                                    <p className="text-xs text-muted-foreground">Exibir no site</p>
                                </div>
                            </div>
                            <Switch
                                checked={publishPortal}
                                onCheckedChange={setPublishPortal}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                                    <Vote className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">App</p>
                                    <p className="text-xs text-muted-foreground">Push notification</p>
                                </div>
                            </div>
                            <Switch
                                checked={publishApp}
                                onCheckedChange={setPublishApp}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex gap-3 pb-20 md:pb-0"
                >
                    <Button
                        variant="outline"
                        onClick={() => navigate("/engajamento/enquetes")}
                        className="rounded-xl"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            // TODO: Save as draft
                            navigate("/engajamento/enquetes");
                        }}
                        className="rounded-xl"
                    >
                        Salvar Rascunho
                    </Button>
                    <div className="flex-1" />
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary-dark rounded-xl min-w-[140px]"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                {isEditing ? "Salvar" : "Publicar Enquete"}
                            </>
                        )}
                    </Button>
                </motion.div>
            </div>
        </AppShell>
    );
};

export default EnqueteForm;
