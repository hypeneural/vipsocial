import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Search,
    Filter,
    Download,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Calendar,
    User,
    Activity,
    FileText,
    Eye,
    X,
    Clock,
    Globe,
    Smartphone,
    Shield,
    Users,
    Newspaper,
    MessageSquare,
    BarChart3,
    Send,
    Bot,
    Settings,
    MapPin,
    LayoutDashboard,
} from "lucide-react";
import { type ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
    useAuditLogs,
    useAuditStats,
    useAuditUsers,
    useExportAuditLogs,
    type AuditLog as AuditLogType,
    type AuditLogFilters,
    type AuditModule,
    type AuditAction,
} from "@/hooks/useAudit";

// ==========================================
// CONSTANTS
// ==========================================

const actionLabels: Record<string, { label: string; color: string }> = {
    create: { label: "Criar", color: "bg-success/15 text-success border-success/30" },
    update: { label: "Atualizar", color: "bg-info/15 text-info border-info/30" },
    delete: { label: "Excluir", color: "bg-destructive/15 text-destructive border-destructive/30" },
    login: { label: "Login", color: "bg-primary/15 text-primary border-primary/30" },
    logout: { label: "Logout", color: "bg-muted text-muted-foreground border-border" },
    view: { label: "Visualizar", color: "bg-secondary text-secondary-foreground border-border" },
    export: { label: "Exportar", color: "bg-warning/15 text-warning border-warning/30" },
    publish: { label: "Publicar", color: "bg-success/15 text-success border-success/30" },
    unpublish: { label: "Despublicar", color: "bg-warning/15 text-warning border-warning/30" },
    send: { label: "Enviar", color: "bg-info/15 text-info border-info/30" },
    approve: { label: "Aprovar", color: "bg-success/15 text-success border-success/30" },
    reject: { label: "Rejeitar", color: "bg-destructive/15 text-destructive border-destructive/30" },
};

const moduleLabels: Record<string, { label: string; icon: ReactNode }> = {
    auth: { label: "Autenticação", icon: <Shield className="w-4 h-4" /> },
    users: { label: "Usuários", icon: <Users className="w-4 h-4" /> },
    roteiros: { label: "Roteiros", icon: <Newspaper className="w-4 h-4" /> },
    alertas: { label: "Alertas", icon: <MessageSquare className="w-4 h-4" /> },
    enquetes: { label: "Enquetes", icon: <BarChart3 className="w-4 h-4" /> },
    distribution: { label: "Distribuição", icon: <Send className="w-4 h-4" /> },
    raspagem: { label: "Raspagem", icon: <Bot className="w-4 h-4" /> },
    config: { label: "Configurações", icon: <Settings className="w-4 h-4" /> },
    pessoas: { label: "Pessoas", icon: <Users className="w-4 h-4" /> },
    dashboard: { label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    externas: { label: "Externas", icon: <MapPin className="w-4 h-4" /> },
    galerias: { label: "Galerias", icon: <FileText className="w-4 h-4" /> },
    equipamentos: { label: "Equipamentos", icon: <Settings className="w-4 h-4" /> },
};

// ==========================================
// STAT CARD COMPONENT
// ==========================================

function StatCard({
    title,
    value,
    icon: Icon,
    trend,
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border/50 p-4"
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{title}</span>
                <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
        </motion.div>
    );
}

// ==========================================
// LOG DETAIL MODAL
// ==========================================

function LogDetailModal({
    log,
    open,
    onClose,
}: {
    log: AuditLogType | null;
    open: boolean;
    onClose: () => void;
}) {
    if (!log) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Detalhes do Log
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    {/* User Info */}
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={log.user_avatar} />
                            <AvatarFallback>
                                {log.user_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{log.user_name}</p>
                            <p className="text-sm text-muted-foreground">{log.user_email}</p>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/30 rounded-xl">
                            <p className="text-xs text-muted-foreground mb-1">Ação</p>
                            <Badge className={actionLabels[log.action]?.color || "bg-neutral-500"}>
                                {actionLabels[log.action]?.label || log.action}
                            </Badge>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl">
                            <p className="text-xs text-muted-foreground mb-1">Módulo</p>
                            <span className="flex items-center gap-1">
                                <span>{moduleLabels[log.module]?.icon || <Activity className="w-4 h-4" />}</span>
                                <span className="font-medium capitalize">{moduleLabels[log.module]?.label || log.module}</span>
                            </span>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl">
                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Data/Hora
                            </p>
                            <p className="font-medium text-sm">
                                {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                            </p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl">
                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                <Globe className="w-3 h-3" /> IP
                            </p>
                            <p className="font-medium text-sm font-mono">{log.ip_address}</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="p-3 bg-muted/30 rounded-xl">
                        <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                        <p className="text-sm">{log.description}</p>
                    </div>

                    {/* Resource */}
                    {log.resource_name && (
                        <div className="p-3 bg-muted/30 rounded-xl">
                            <p className="text-xs text-muted-foreground mb-1">Recurso</p>
                            <p className="text-sm font-medium">{log.resource_name}</p>
                            <p className="text-xs text-muted-foreground">
                                {log.resource_type} #{log.resource_id}
                            </p>
                        </div>
                    )}

                    {/* Changes */}
                    {log.changes && (
                        <div className="p-3 bg-muted/30 rounded-xl">
                            <p className="text-xs text-muted-foreground mb-3">Alterações Detalhadas</p>

                            <div className="space-y-3">
                                {Object.keys(log.changes.after || {}).map((key) => {
                                    const beforeVal = log.changes?.before?.[key];
                                    const afterVal = log.changes?.after?.[key];

                                    // Skip if no real change
                                    if (JSON.stringify(beforeVal) === JSON.stringify(afterVal)) return null;

                                    return (
                                        <div key={key} className="text-sm p-3 rounded-xl border border-border/40 bg-card">
                                            <p className="font-medium text-xs text-muted-foreground mb-2 pb-2 border-b border-border/40 font-mono">
                                                {key}
                                            </p>

                                            <div className="grid grid-cols-2 gap-3 mt-2">
                                                {/* Before State */}
                                                {(beforeVal !== undefined || log.action === 'delete' || log.action === 'update') && (
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] uppercase font-semibold text-destructive/80 tracking-wider">Anterior</span>
                                                        <div className="p-2 bg-destructive/10 rounded-lg text-destructive-foreground/90 font-mono text-xs break-all">
                                                            {typeof beforeVal === 'object' && beforeVal !== null
                                                                ? JSON.stringify(beforeVal)
                                                                : String(beforeVal ?? 'N/A')}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* After State */}
                                                {(afterVal !== undefined || log.action === 'create' || log.action === 'update') && (
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] uppercase font-semibold text-success/80 tracking-wider">Novo</span>
                                                        <div className="p-2 bg-success/10 rounded-lg text-success-foreground/90 font-mono text-xs break-all">
                                                            {typeof afterVal === 'object' && afterVal !== null
                                                                ? JSON.stringify(afterVal)
                                                                : String(afterVal ?? 'N/A')}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    )}

                    {/* User Agent */}
                    <div className="p-3 bg-muted/30 rounded-xl">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Smartphone className="w-3 h-3" /> Dispositivo
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{log.user_agent}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

const AuditLog = () => {
    // Filters state
    const [filters, setFilters] = useState<AuditLogFilters>({ page: 1, per_page: 20 });
    const [search, setSearch] = useState("");
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLogType | null>(null);

    // Data fetching
    const { data: logsData, isLoading, refetch } = useAuditLogs({
        ...filters,
        search: search || undefined,
        start_date: dateRange.from?.toISOString(),
        end_date: dateRange.to?.toISOString(),
    });
    const { data: statsData } = useAuditStats();
    const { data: usersData } = useAuditUsers();
    const exportMutation = useExportAuditLogs();

    const logs = logsData?.data || [];
    const meta = logsData?.meta;
    const stats = statsData?.data;
    const users = usersData?.data || [];

    // Quick date filters
    const setQuickDateFilter = (days: number) => {
        const to = new Date();
        const from = subDays(to, days);
        setDateRange({ from: startOfDay(from), to: endOfDay(to) });
    };

    const clearFilters = () => {
        setFilters({ page: 1, per_page: 20 });
        setSearch("");
        setDateRange({ from: undefined, to: undefined });
    };

    const hasActiveFilters = filters.user_id || filters.module || filters.action || search || dateRange.from || dateRange.to;

    return (
        <AppShell>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                            <Activity className="w-6 h-6 text-primary" />
                            Logs de Auditoria
                        </h1>
                        <p className="text-sm text-muted-foreground">Histórico completo de ações no sistema</p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => refetch()}>
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() =>
                                exportMutation.mutate({
                                    filters: {
                                        ...filters,
                                        search: search || undefined,
                                        start_date: dateRange.from?.toISOString(),
                                        end_date: dateRange.to?.toISOString(),
                                    },
                                    format: "csv",
                                })
                            }
                            disabled={exportMutation.isPending}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard title="Total de Logs" value={stats.total_logs.toLocaleString()} icon={FileText} />
                    <StatCard title="Logs Hoje" value={stats.logs_today} icon={Activity} />
                    <StatCard title="Usuários Ativos" value={stats.active_users_today} icon={User} />
                    <StatCard title="Módulo Mais Ativo" value={moduleLabels[stats.most_active_module]?.label || "-"} icon={Calendar} />
                </div>
            )}

            {/* Search & Filters */}
            <div className="bg-card rounded-2xl border border-border/50 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar em logs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 rounded-xl"
                        />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setQuickDateFilter(0)}>
                            Hoje
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setQuickDateFilter(7)}>
                            7 dias
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setQuickDateFilter(30)}>
                            30 dias
                        </Button>
                        <Button
                            variant={showFilters ? "default" : "outline"}
                            size="sm"
                            className="rounded-xl"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filtros
                        </Button>
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" className="rounded-xl text-destructive" onClick={clearFilters}>
                                <X className="w-4 h-4 mr-1" />
                                Limpar
                            </Button>
                        )}
                    </div>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/50"
                    >
                        <Select value={filters.user_id || "all"} onValueChange={(v) => setFilters({ ...filters, user_id: v === "all" ? undefined : v })}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Usuário" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os usuários</SelectItem>
                                {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filters.module || "all"} onValueChange={(v) => setFilters({ ...filters, module: v === "all" ? undefined : (v as AuditModule) })}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Módulo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os módulos</SelectItem>
                                {Object.entries(moduleLabels).map(([key, { label, icon }]) => (
                                    <SelectItem key={key} value={key}>{icon} {label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filters.action || "all"} onValueChange={(v) => setFilters({ ...filters, action: v === "all" ? undefined : (v as AuditAction) })}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Ação" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as ações</SelectItem>
                                {Object.entries(actionLabels).map(([key, { label }]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="rounded-xl justify-start">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {dateRange.from
                                        ? dateRange.to
                                            ? `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}`
                                            : format(dateRange.from, "dd/MM/yyyy")
                                        : "Período"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                    mode="range"
                                    selected={{ from: dateRange.from, to: dateRange.to }}
                                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                                    locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>
                    </motion.div>
                )}
            </div>

            {/* Logs Table */}
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="text-left py-3 px-4 text-sm font-semibold">Usuário</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold">Ação</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold hidden md:table-cell">Módulo</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold hidden lg:table-cell">Descrição</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold">Data</th>
                                <th className="text-center py-3 px-4 text-sm font-semibold w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i} className="border-b border-border/50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                                                <div className="w-24 h-4 bg-muted rounded animate-pulse" />
                                            </div>
                                        </td>
                                        <td className="py-3 px-4"><div className="w-16 h-5 bg-muted rounded animate-pulse" /></td>
                                        <td className="py-3 px-4 hidden md:table-cell"><div className="w-20 h-4 bg-muted rounded animate-pulse" /></td>
                                        <td className="py-3 px-4 hidden lg:table-cell"><div className="w-40 h-4 bg-muted rounded animate-pulse" /></td>
                                        <td className="py-3 px-4"><div className="w-28 h-4 bg-muted rounded animate-pulse" /></td>
                                        <td className="py-3 px-4"></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <Activity className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                                        <p className="text-muted-foreground">Nenhum log encontrado</p>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log, i) => (
                                    <motion.tr
                                        key={log.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-8 h-8">
                                                    <AvatarImage src={log.user_avatar} />
                                                    <AvatarFallback className="text-xs">
                                                        {log.user_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium truncate max-w-[120px]">{log.user_name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge className={cn("text-xs", actionLabels[log.action]?.color || "bg-neutral-500")}>
                                                {actionLabels[log.action]?.label || log.action}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 hidden md:table-cell">
                                            <span className="flex items-center gap-1 text-sm">
                                                <span>{moduleLabels[log.module]?.icon || <Activity className="w-3 h-3" />}</span>
                                                <span className="capitalize">{moduleLabels[log.module]?.label || log.module}</span>
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 hidden lg:table-cell">
                                            <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{log.description}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm text-muted-foreground">
                                                {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Button variant="ghost" size="sm" className="rounded-xl" onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-border/50">
                        <span className="text-sm text-muted-foreground">
                            Mostrando {(meta.current_page - 1) * meta.per_page + 1} - {Math.min(meta.current_page * meta.per_page, meta.total)} de {meta.total}
                        </span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="rounded-xl" disabled={meta.current_page === 1} onClick={() => setFilters({ ...filters, page: meta.current_page - 1 })}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-xl" disabled={meta.current_page === meta.last_page} onClick={() => setFilters({ ...filters, page: meta.current_page + 1 })}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <LogDetailModal log={selectedLog} open={!!selectedLog} onClose={() => setSelectedLog(null)} />
        </AppShell>
    );
};

export default AuditLog;
