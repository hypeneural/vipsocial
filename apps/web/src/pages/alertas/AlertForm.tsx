import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Save } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DestinationSelector } from "@/components/alertas/DestinationSelector";
import { MessagePreview } from "@/components/alertas/MessagePreview";
import {
    AlertScheduleRuleDraft,
    AlertScheduleRulesBuilder,
    createWeeklyRuleDraft,
} from "@/components/alertas/AlertScheduleRulesBuilder";
import {
    useAlert,
    useCreateAlert,
    useDestinations,
    useUpdateAlert,
} from "@/hooks/useAlertas";
import { MAX_MESSAGE_LENGTH } from "@/types/alertas";

const AlertForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const alertId = id ? Number(id) : undefined;
    const isEditing = Boolean(alertId);

    const alertQuery = useAlert(alertId);
    const destinationsQuery = useDestinations({
        per_page: 100,
        include_inactive: true,
        include_archived: false,
    });
    const createMutation = useCreateAlert();
    const updateMutation = useUpdateAlert();

    const [showPreview, setShowPreview] = useState(true);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [active, setActive] = useState(true);
    const [selectedDestinations, setSelectedDestinations] = useState<number[]>([]);
    const [scheduleRules, setScheduleRules] = useState<AlertScheduleRuleDraft[]>([
        createWeeklyRuleDraft(1, "12:00"),
    ]);

    useEffect(() => {
        if (!alertQuery.data?.data) {
            return;
        }

        const alert = alertQuery.data.data;
        setTitle(alert.title);
        setMessage(alert.message);
        setActive(alert.active);
        setSelectedDestinations(alert.destinations.map((destination) => destination.destination_id));
        setScheduleRules(
            alert.schedule_rules.length > 0
                ? alert.schedule_rules.map((rule) => ({
                      client_id: `rule-${rule.schedule_id}`,
                      schedule_type: rule.schedule_type,
                      day_of_week: rule.day_of_week,
                      specific_date: rule.specific_date,
                      time_hhmm: rule.time_hhmm,
                      active: rule.active ?? rule.schedule_active ?? true,
                  }))
                : [createWeeklyRuleDraft(1, "12:00")]
        );
    }, [alertQuery.data]);

    const handleSave = async () => {
        if (!title.trim()) {
            window.alert("Preencha o titulo do alerta");
            return;
        }

        if (!message.trim()) {
            window.alert("Preencha a mensagem do alerta");
            return;
        }

        if (selectedDestinations.length === 0) {
            window.alert("Selecione pelo menos um destino");
            return;
        }

        if (scheduleRules.length === 0) {
            window.alert("Adicione pelo menos uma regra de agendamento");
            return;
        }

        const hasInvalidRule = scheduleRules.some((rule) => {
            if (!rule.time_hhmm) {
                return true;
            }

            if (rule.schedule_type === "weekly") {
                return rule.day_of_week === null;
            }

            return !rule.specific_date;
        });

        if (hasInvalidRule) {
            window.alert("Revise as regras de agendamento antes de salvar");
            return;
        }

        const payload = {
            title: title.trim(),
            message: message.trim(),
            active,
            destination_ids: selectedDestinations,
            schedule_rules: scheduleRules.map((rule) => ({
                schedule_type: rule.schedule_type,
                day_of_week: rule.schedule_type === "weekly" ? rule.day_of_week : null,
                specific_date: rule.schedule_type === "specific_date" ? rule.specific_date : null,
                time_hhmm: rule.time_hhmm,
                active: rule.active,
            })),
        };

        try {
            if (isEditing && alertId) {
                await updateMutation.mutateAsync({ id: alertId, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }

            navigate("/alertas/lista");
        } catch {
            return;
        }
    };

    const isLoading = alertQuery.isLoading || destinationsQuery.isLoading;
    const isSaving = createMutation.isPending || updateMutation.isPending;
    const destinations = destinationsQuery.data?.data ?? [];

    return (
        <AppShell>
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
                            Configure mensagem, destinos e regras dinamicas de disparo.
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
                <div className="rounded-2xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
                    Carregando formulario...
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card rounded-2xl border border-border/50 p-6"
                        >
                            <h2 className="font-semibold text-lg mb-4">Informacoes Basicas</h2>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Titulo Interno *</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                        placeholder="Ex: Jornal VIP Meio-dia"
                                        className="rounded-xl"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Usado apenas para identificacao interna.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Mensagem *</Label>
                                    <Textarea
                                        id="message"
                                        value={message}
                                        onChange={(event) => setMessage(event.target.value)}
                                        placeholder="Ex: Em instantes comeca o Jornal VIP."
                                        className="rounded-xl min-h-[150px] resize-y"
                                        maxLength={MAX_MESSAGE_LENGTH}
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Suporta emoji, *negrito*, _italico_, ~tachado~ e links.</span>
                                        <span>
                                            {message.length}/{MAX_MESSAGE_LENGTH}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-card rounded-2xl border border-border/50 p-6"
                        >
                            <h2 className="font-semibold text-lg mb-4">Agendamento</h2>
                            <p className="text-sm text-muted-foreground mb-4">
                                Cada regra pode ter dia ou data propria com horario independente.
                            </p>

                            <AlertScheduleRulesBuilder value={scheduleRules} onChange={setScheduleRules} />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-card rounded-2xl border border-border/50 p-6"
                        >
                            <h2 className="font-semibold text-lg mb-4">Destinos</h2>
                            <p className="text-sm text-muted-foreground mb-4">
                                Selecione um ou mais destinos para este alerta.
                            </p>

                            <DestinationSelector
                                destinations={destinations}
                                selectedIds={selectedDestinations}
                                onChange={setSelectedDestinations}
                            />
                        </motion.div>

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
                                {isSaving ? "Salvando..." : active ? "Salvar Alerta" : "Salvar Pausado"}
                            </Button>
                        </motion.div>
                    </div>

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

                            {showPreview ? (
                                <MessagePreview
                                    message={message || "Digite uma mensagem para ver o preview..."}
                                />
                            ) : null}
                        </motion.div>
                    </div>
                </div>
            )}
        </AppShell>
    );
};

export default AlertForm;
