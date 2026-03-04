import { motion } from "framer-motion";
import { Bell, Calendar, Users, Edit, Copy, BarChart3, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, formatDaysOfWeek, formatTime } from "@/types/alertas";
import { cn } from "@/lib/utils";

interface AlertCardProps {
    alert: Alert;
    onEdit?: (id: number) => void;
    onDuplicate?: (id: number) => void;
    onViewLogs?: (id: number) => void;
    onToggle?: (id: number) => void;
}

/**
 * Card de alerta com resumo de schedule e ações
 */
export const AlertCard = ({
    alert,
    onEdit,
    onDuplicate,
    onViewLogs,
    onToggle,
}: AlertCardProps) => {
    // Pega o primeiro schedule para exibição
    const primarySchedule = alert.schedules[0];
    const daysDisplay = primarySchedule ? formatDaysOfWeek(primarySchedule.days_of_week) : "Sem agendamento";
    const timesDisplay = primarySchedule?.times.map(t => formatTime(t)).join(", ") || "";

    // Trunca a mensagem
    const truncatedMessage = alert.message.length > 100
        ? alert.message.slice(0, 100) + "..."
        : alert.message;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "bg-card rounded-2xl border p-4 transition-all hover:shadow-md",
                !alert.active && "opacity-70 border-dashed"
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        alert.active ? "bg-primary/10" : "bg-muted"
                    )}>
                        <Bell className={cn(
                            "w-5 h-5",
                            alert.active ? "text-primary" : "text-muted-foreground"
                        )} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-base">{alert.title}</h3>
                        <Badge variant={alert.active ? "default" : "secondary"} className="text-xs">
                            {alert.active ? "Ativo" : "Pausado"}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Schedule Info */}
            {primarySchedule && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{daysDisplay}</span>
                    </div>
                    {timesDisplay && (
                        <div className="flex items-center gap-1">
                            <span>às</span>
                            <span className="font-medium text-foreground">{timesDisplay}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Destinations */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Users className="w-4 h-4" />
                <span>{alert.destinations.length} destino(s) vinculado(s)</span>
            </div>

            {/* Message Preview */}
            <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                    📝 "{truncatedMessage}"
                </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
                {onEdit && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(alert.alert_id)}
                        className="rounded-lg"
                    >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                    </Button>
                )}
                {onDuplicate && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDuplicate(alert.alert_id)}
                        className="rounded-lg"
                    >
                        <Copy className="w-4 h-4 mr-1" />
                        Duplicar
                    </Button>
                )}
                {onViewLogs && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewLogs(alert.alert_id)}
                        className="rounded-lg"
                    >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Logs
                    </Button>
                )}
                {onToggle && (
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
                )}
            </div>
        </motion.div>
    );
};
