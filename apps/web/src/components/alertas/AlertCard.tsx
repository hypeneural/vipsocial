import { motion } from "framer-motion";
import { AlertTriangle, BarChart3, Bell, Calendar, Copy, Edit, Pause, Play, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, formatScheduleRuleLabel, getAlertMonitoringTone } from "@/types/alertas";
import { cn } from "@/lib/utils";

interface AlertCardProps {
    alert: Alert;
    onEdit?: (id: number) => void;
    onDuplicate?: (id: number) => void;
    onViewLogs?: (id: number) => void;
    onToggle?: (id: number) => void;
    onDelete?: (id: number) => void;
}

export const AlertCard = ({
    alert,
    onEdit,
    onDuplicate,
    onViewLogs,
    onToggle,
    onDelete,
}: AlertCardProps) => {
    const rules = alert.schedule_rules ?? [];
    const primaryRule = rules[0];
    const moreRulesCount = Math.max(0, rules.length - 1);
    const truncatedMessage =
        alert.message.length > 100 ? `${alert.message.slice(0, 100)}...` : alert.message;
    const monitoring = alert.monitoring;
    const showAttention = ["missed", "delayed", "failed", "sent_late", "partial", "pending"].includes(
        monitoring.state
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "bg-card rounded-2xl border p-4 transition-all hover:shadow-md",
                !alert.active && "opacity-70 border-dashed"
            )}
        >
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            alert.active ? "bg-primary/10" : "bg-muted"
                        )}
                    >
                        <Bell
                            className={cn(
                                "w-5 h-5",
                                alert.active ? "text-primary" : "text-muted-foreground"
                            )}
                        />
                    </div>
                    <div>
                        <h3 className="font-semibold text-base">{alert.title}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant={alert.active ? "default" : "secondary"} className="text-xs">
                                {alert.active ? "Ativo" : "Pausado"}
                            </Badge>
                            <span
                                className={cn(
                                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                                    getAlertMonitoringTone(monitoring.state)
                                )}
                            >
                                {showAttention ? <AlertTriangle className="h-3 w-3" /> : null}
                                {monitoring.label}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {primaryRule ? (
                <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatScheduleRuleLabel(primaryRule)}</span>
                    </div>
                    {moreRulesCount > 0 ? <span>+{moreRulesCount} regra(s)</span> : null}
                </div>
            ) : (
                <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Sem agendamento</span>
                </div>
            )}

            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{alert.destination_count || alert.destinations.length} destino(s) vinculado(s)</span>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <p className="text-sm text-muted-foreground line-clamp-2">"{truncatedMessage}"</p>
            </div>

            {showAttention && monitoring.scheduled_for ? (
                <div className="mb-4 rounded-lg border border-warning/20 bg-warning/5 p-3 text-xs text-warning">
                    <p className="font-medium">
                        Referencia:{" "}
                        {new Date(monitoring.scheduled_for).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                    {monitoring.delay_minutes > 0 ? (
                        <p className="mt-1 text-warning/90">
                            Atraso atual: {monitoring.delay_minutes} minuto{monitoring.delay_minutes === 1 ? "" : "s"}.
                        </p>
                    ) : null}
                </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
                {onEdit ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(alert.alert_id)}
                        className="rounded-lg"
                    >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                    </Button>
                ) : null}

                {onDuplicate ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDuplicate(alert.alert_id)}
                        className="rounded-lg"
                    >
                        <Copy className="w-4 h-4 mr-1" />
                        Duplicar
                    </Button>
                ) : null}

                {onViewLogs ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewLogs(alert.alert_id)}
                        className="rounded-lg"
                    >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Logs
                    </Button>
                ) : null}

                {onToggle ? (
                    <Button
                        variant={alert.active ? "outline" : "default"}
                        size="sm"
                        onClick={() => onToggle(alert.alert_id)}
                        className="rounded-lg ml-auto"
                    >
                        {alert.active ? (
                            <>
                                <Pause className="w-4 h-4 mr-1" />
                                Pausar
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 mr-1" />
                                Ativar
                            </>
                        )}
                    </Button>
                ) : null}

                {!alert.active && onDelete ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(alert.alert_id)}
                        className="rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Excluir
                    </Button>
                ) : null}
            </div>
        </motion.div>
    );
};
