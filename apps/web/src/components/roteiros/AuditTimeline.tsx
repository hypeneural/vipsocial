import { AuditLogEntry } from "@/services/roteiro.service";
import { cn } from "@/lib/utils";

const FIELD_LABELS: Record<string, string> = {
    titulo: "Titulo",
    descricao: "Descricao",
    status: "Status",
    duracao: "Duracao",
    ordem: "Ordem",
    shortcut: "Atalho",
    categoria_id: "Categoria",
    creditos_gc: "Creditos/GC",
    active: "Ativa",
    is_checked: "Utilizada",
    user_id: "Responsavel",
};

const ACTION_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    create: { label: "Criou", icon: "+", color: "text-green-700 bg-green-50 border-green-200" },
    update: { label: "Alterou", icon: "~", color: "text-blue-700 bg-blue-50 border-blue-200" },
    delete: { label: "Removeu", icon: "-", color: "text-red-700 bg-red-50 border-red-200" },
};

function formatValue(value: unknown): string {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "boolean") return value ? "Sim" : "Nao";
    if (Array.isArray(value) || typeof value === "object") {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
    return String(value);
}

function formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;

    return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "agora";
    if (diffMin < 60) return `ha ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `ha ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `ha ${diffDays} d`;
    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
    });
}

interface AuditTimelineProps {
    logs: AuditLogEntry[];
    isLoading?: boolean;
    emptyMessage?: string;
}

/**
 * Timeline reutilizavel para logs de auditoria.
 * Mostra usuario, acao, data detalhada e diff before/after.
 */
export const AuditTimeline = ({
    logs,
    isLoading = false,
    emptyMessage = "Nenhum registro de alteracao",
}: AuditTimelineProps) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
            </div>
        );
    }

    if (logs.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-8">{emptyMessage}</p>;
    }

    return (
        <div className="relative space-y-0">
            <div className="absolute left-5 top-4 bottom-4 w-px bg-border" />

            {logs.map((log) => {
                const actionCfg = ACTION_CONFIG[log.action] ?? ACTION_CONFIG.update;
                const changes = log.changes;
                const changedFields = changes
                    ? Object.keys(changes.after).filter((field) => field !== "updated_at")
                    : [];

                return (
                    <div key={log.id} className="relative flex gap-3 pb-5">
                        <div className="relative z-10 flex-shrink-0 w-10 flex justify-center pt-1">
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm border font-bold",
                                    actionCfg.color
                                )}
                            >
                                {actionCfg.icon}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-foreground">
                                    {log.user_name}
                                </span>
                                <span
                                    className={cn(
                                        "text-xs px-1.5 py-0.5 rounded-full border font-medium",
                                        actionCfg.color
                                    )}
                                >
                                    {actionCfg.label}
                                </span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                    {timeAgo(log.created_at)}
                                </span>
                            </div>

                            <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDateTime(log.created_at)}
                            </p>

                            {log.resource_name && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {log.resource_name}
                                </p>
                            )}

                            {log.description && (
                                <p className="text-xs text-foreground/80 mt-1">
                                    {log.description}
                                </p>
                            )}

                            {changedFields.length > 0 && changes && (
                                <div className="mt-2 space-y-1">
                                    {changedFields.map((field) => (
                                        <div
                                            key={field}
                                            className="text-xs bg-muted/50 rounded-lg p-2 border border-border/50"
                                        >
                                            <span className="font-medium text-foreground">
                                                {FIELD_LABELS[field] ?? field}
                                            </span>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="text-red-600 line-through max-w-[45%] truncate">
                                                    {formatValue(changes.before[field])}
                                                </span>
                                                <span className="text-muted-foreground">-&gt;</span>
                                                <span className="text-green-700 font-medium max-w-[45%] truncate">
                                                    {formatValue(changes.after[field])}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
