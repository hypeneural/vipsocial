import { AuditLogEntry } from "@/services/roteiro.service";
import { cn } from "@/lib/utils";

// Field label translations
const FIELD_LABELS: Record<string, string> = {
    titulo: "Título",
    descricao: "Linha de Apoio",
    status: "Status",
    duracao: "Duração",
    ordem: "Ordem",
    shortcut: "Atalho",
    categoria_id: "Categoria",
    creditos_gc: "Créditos/GC",
};

const ACTION_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    create: { label: "Criou", icon: "➕", color: "text-green-600 bg-green-50 border-green-200" },
    update: { label: "Alterou", icon: "✏️", color: "text-blue-600 bg-blue-50 border-blue-200" },
    delete: { label: "Removeu", icon: "🗑️", color: "text-red-600 bg-red-50 border-red-200" },
};

function formatValue(value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return value ? "Sim" : "Não";
    return String(value);
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "agora";
    if (diffMin < 60) return `há ${diffMin}min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `há ${diffDays}d`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

interface AuditTimelineProps {
    logs: AuditLogEntry[];
    isLoading?: boolean;
    emptyMessage?: string;
}

/**
 * Reusable timeline component for audit log entries.
 * Vertical line connector, avatar, action badges, before→after.
 */
export const AuditTimeline = ({
    logs,
    isLoading = false,
    emptyMessage = "Nenhum registro de alteração",
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
        return (
            <p className="text-sm text-muted-foreground text-center py-8">{emptyMessage}</p>
        );
    }

    return (
        <div className="relative space-y-0">
            {/* Vertical connector line */}
            <div className="absolute left-5 top-4 bottom-4 w-px bg-border" />

            {logs.map((log, index) => {
                const actionCfg = ACTION_CONFIG[log.action] ?? ACTION_CONFIG.update;
                const changes = log.changes;
                const changedFields = changes
                    ? Object.keys(changes.after).filter((k) => k !== "updated_at")
                    : [];

                return (
                    <div key={log.id} className="relative flex gap-3 pb-5">
                        {/* Timeline dot */}
                        <div className="relative z-10 flex-shrink-0 w-10 flex justify-center pt-1">
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm border",
                                    actionCfg.color
                                )}
                            >
                                {actionCfg.icon}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            {/* Header: user + time */}
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

                            {/* Description */}
                            {log.resource_name && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {log.resource_name}
                                </p>
                            )}

                            {/* Changed fields */}
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
                                                <span className="text-red-500 line-through max-w-[45%] truncate">
                                                    {formatValue(changes.before[field])}
                                                </span>
                                                <span className="text-muted-foreground">→</span>
                                                <span className="text-green-600 font-medium max-w-[45%] truncate">
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
