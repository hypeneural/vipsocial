import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Eye, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DaysOfWeekPicker } from "@/components/alertas/DaysOfWeekPicker";
import { TimesPicker } from "@/components/alertas/TimesPicker";
import { DestinationSelector } from "@/components/alertas/DestinationSelector";
import { MessagePreview } from "@/components/alertas/MessagePreview";
import { Destination, MAX_MESSAGE_LENGTH } from "@/types/alertas";

// Mock destinations
const mockDestinations: Destination[] = [
    { destination_id: 1, phone_number: "+5547999991111", name: "VIP Tijucas", tags: ["tijucas", "geral"], active: true, created_at: "", updated_at: "" },
    { destination_id: 2, phone_number: "+5547999992222", name: "VIP Itapema", tags: ["itapema", "geral"], active: true, created_at: "", updated_at: "" },
    { destination_id: 3, phone_number: "+5547999993333", name: "VIP Barra Velha", tags: ["barra-velha", "geral"], active: true, created_at: "", updated_at: "" },
    { destination_id: 4, phone_number: "+5547999994444", name: "VIP Esportes", tags: ["esportes"], active: true, created_at: "", updated_at: "" },
];

const AlertForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(true);

    // Form state
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [active, setActive] = useState(true);
    const [daysOfWeek, setDaysOfWeek] = useState("0111110"); // Seg-Sex
    const [times, setTimes] = useState<string[]>(["12:00"]);
    const [selectedDestinations, setSelectedDestinations] = useState<number[]>([]);

    // Load data if editing
    useEffect(() => {
        if (isEditing) {
            // TODO: Fetch from API
            setTimeout(() => {
                setTitle("Jornal VIP Meio-dia");
                setMessage("🔴 Em 15 minutos começa o *Jornal VIP*!\n\n📺 Acompanhe ao vivo: https://vipsocial.com.br/ao-vivo");
                setDaysOfWeek("0111110");
                setTimes(["11:45", "17:45"]);
                setSelectedDestinations([1, 2, 3]);
                setActive(true);
                setIsLoading(false);
            }, 500);
        }
    }, [isEditing, id]);

    const handleSave = async () => {
        // Validação
        if (!title.trim()) {
            alert("Preencha o título do alerta");
            return;
        }
        if (!message.trim()) {
            alert("Preencha a mensagem do alerta");
            return;
        }
        if (times.length === 0) {
            alert("Adicione pelo menos um horário");
            return;
        }
        if (selectedDestinations.length === 0) {
            alert("Selecione pelo menos um destino");
            return;
        }

        setIsSaving(true);

        // TODO: Save to API
        const payload = {
            title,
            message,
            active,
            destination_ids: selectedDestinations,
            schedules: [{
                days_of_week: daysOfWeek,
                times,
                active: true,
            }],
        };

        console.log("Saving alert:", payload);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsSaving(false);
        navigate("/alertas/lista");
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
                    to="/alertas/lista"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Alertas
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">
                            {isEditing ? "Editar Alerta" : "Novo Alerta"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isEditing ? "Atualize a mensagem e agendamento" : "Configure a mensagem e o agendamento"}
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

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Form - 2 columns */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Informações Básicas */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card rounded-2xl border border-border/50 p-6"
                    >
                        <h2 className="font-semibold text-lg mb-4">Informações Básicas</h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título Interno *</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: Jornal VIP Meio-dia"
                                    className="rounded-xl"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Usado apenas para identificação interna (não é enviado)
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Mensagem *</Label>
                                <Textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="🔴 Em 15 minutos começa o *Jornal VIP*!&#10;&#10;📺 Acompanhe ao vivo: https://vipsocial.com.br/ao-vivo"
                                    className="rounded-xl min-h-[150px] resize-y"
                                    maxLength={MAX_MESSAGE_LENGTH}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Suporta emoji, *negrito*, _itálico_, ~tachado~ e links</span>
                                    <span>{message.length}/{MAX_MESSAGE_LENGTH}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Agendamento */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card rounded-2xl border border-border/50 p-6"
                    >
                        <h2 className="font-semibold text-lg mb-4">Agendamento</h2>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Dias da Semana *</Label>
                                <DaysOfWeekPicker
                                    value={daysOfWeek}
                                    onChange={setDaysOfWeek}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Horários *</Label>
                                <TimesPicker
                                    value={times}
                                    onChange={setTimes}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Destinos */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-card rounded-2xl border border-border/50 p-6"
                    >
                        <h2 className="font-semibold text-lg mb-4">Destinos</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Selecione os grupos que receberão este alerta
                        </p>

                        <DestinationSelector
                            destinations={mockDestinations}
                            selectedIds={selectedDestinations}
                            onChange={setSelectedDestinations}
                        />
                    </motion.div>

                    {/* Actions */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex gap-3 pb-20 lg:pb-0"
                    >
                        <Button
                            variant="outline"
                            onClick={() => navigate("/alertas/lista")}
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
                            {isSaving ? "Salvando..." : active ? "Ativar Alerta" : "Salvar Rascunho"}
                        </Button>
                    </motion.div>
                </div>

                {/* Preview - 1 column */}
                <div className="lg:col-span-1">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card rounded-2xl border border-border/50 p-6 sticky top-24"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-lg">Preview</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPreview(!showPreview)}
                            >
                                <Eye className="w-4 h-4 mr-1" />
                                {showPreview ? "Ocultar" : "Mostrar"}
                            </Button>
                        </div>

                        {showPreview && (
                            <MessagePreview message={message || "Digite uma mensagem para ver o preview..."} />
                        )}
                    </motion.div>
                </div>
            </div>
        </AppShell>
    );
};

export default AlertForm;
