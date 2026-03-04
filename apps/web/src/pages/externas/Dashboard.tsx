import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Calendar,
    MapPin,
    Users,
    Clock,
    Filter,
    Search,
    ChevronRight,
    Loader2,
    XCircle,
    Newspaper,
    PartyPopper,
    Camera,
    Mic,
    FileText,
    CalendarCheck,
    CheckCircle2,
    Package,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useExternas, useExternaStats, useEventCategories, useEventStatuses } from "@/hooks/useExternas";
import type { ExternalEvent } from "@/types/externas";
import { cn } from "@/lib/utils";

// ==========================================
// ICON MAP
// ==========================================
const iconMap: Record<string, LucideIcon> = {
    Newspaper, PartyPopper, Camera, Mic, FileText, CalendarCheck,
    CheckCircle2, Clock, XCircle, Package,
};

function DynIcon({ name, className }: { name?: string; className?: string }) {
    const Icon = (name && iconMap[name]) || FileText;
    return <Icon className={className} />;
}

// ==========================================
// SMART DATE FORMATTER
// ==========================================
const formatDateRange = (start: string, end?: string | null): string => {
    const s = new Date(start);
    const weekday = s.toLocaleDateString("pt-BR", { weekday: "long" });
    const day = s.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const startTime = s.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    let result = `${weekday}, ${day} às ${startTime}`;

    if (end) {
        const e = new Date(end);
        const endTime = e.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

        // Same day?
        if (s.toDateString() === e.toDateString()) {
            result += ` até ${endTime}`;
        } else {
            const endDay = e.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
            result += ` até ${endDay} às ${endTime}`;
        }
    }

    return result;
};

const formatShortRange = (start: string, end?: string | null): string => {
    const s = new Date(start);
    const startTime = s.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const dayStr = s.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });

    let result = `${dayStr} ${startTime}`;

    if (end) {
        const e = new Date(end);
        const endTime = e.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        if (s.toDateString() === e.toDateString()) {
            result += `–${endTime}`;
        } else {
            const endDay = e.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
            result += ` → ${endDay} ${endTime}`;
        }
    }

    return result;
};

/** Returns the effective end time: data_hora_fim if set, otherwise data_hora + 2h */
const getEventEnd = (ev: ExternalEvent): Date => {
    if (ev.data_hora_fim) return new Date(ev.data_hora_fim);
    const start = new Date(ev.data_hora);
    return new Date(start.getTime() + 2 * 60 * 60 * 1000);
};

// ==========================================
// EVENT CARD
// ==========================================
interface EventCardProps {
    event: ExternalEvent;
    onClick: () => void;
}

const EventCard = ({ event, onClick }: EventCardProps) => {
    const isToday = new Date(event.data_hora).toDateString() === new Date().toDateString();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "bg-card rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer",
                isToday && "ring-2 ring-primary/50"
            )}
            onClick={onClick}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {event.category && (
                            <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", event.category.color)}>
                                <DynIcon name={event.category.icon} className="w-3.5 h-3.5 text-white" />
                            </div>
                        )}
                        <h3 className="font-medium truncate">{event.titulo}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span className="truncate">{formatShortRange(event.data_hora, event.data_hora_fim)}</span>
                        {isToday && (
                            <Badge variant="outline" className="text-xs shrink-0">Hoje</Badge>
                        )}
                    </div>
                </div>
                {event.status && (
                    <Badge className={cn("shrink-0 text-xs text-white", event.status.color)}>
                        <DynIcon name={event.status.icon} className="w-3 h-3 mr-1" />
                        {event.status.name}
                    </Badge>
                )}
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{event.local}</span>
            </div>

            {/* Team */}
            {event.collaborators && event.collaborators.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Users className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                        {event.collaborators.map((c) => c.name).join(", ")}
                    </span>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t">
                {event.category && (
                    <Badge variant="outline" className="text-xs">
                        {event.category.name}
                    </Badge>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
        </motion.div>
    );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
const ExternasDashboard = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // Queries
    const { data: eventsData, isLoading, error } = useExternas({
        per_page: 100,
        search: searchQuery || undefined,
        category_id: filterCategory !== "all" ? Number(filterCategory) : undefined,
        status_id: filterStatus !== "all" ? Number(filterStatus) : undefined,
    });
    const { data: statsData } = useExternaStats();
    const { data: categoriesData } = useEventCategories();
    const { data: statusesData } = useEventStatuses();

    const events = eventsData?.data || [];
    const stats = statsData?.data;
    const categories = categoriesData?.data || [];
    const statuses = statusesData?.data || [];

    // Group by upcoming vs past — based on effective end time
    const now = useMemo(() => new Date(), []);

    const upcomingEvents = useMemo(() =>
        events
            .filter((ev) => getEventEnd(ev) >= now)
            .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()),
        [events, now]
    );

    const pastEvents = useMemo(() =>
        events
            .filter((ev) => getEventEnd(ev) < now)
            .sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()),
        [events, now]
    );

    if (error) {
        return (
            <AppShell>
                <div className="text-center py-20">
                    <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-7 h-7 text-destructive" />
                    </div>
                    <p className="text-destructive font-medium">Erro ao carregar eventos</p>
                    <p className="text-sm text-muted-foreground mt-1">Verifique se a API está rodando</p>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-primary" />
                            </div>
                            Agenda de Externas
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Coberturas externas, eventos e reportagens
                        </p>
                    </div>
                    <Button onClick={() => navigate("/externas/novo")} className="rounded-xl">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Evento
                    </Button>
                </div>
            </motion.div>

            {/* Stats */}
            {stats && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
                >
                    <div className="bg-card rounded-xl border p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            <span className="text-2xl font-bold">{stats.today}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Hoje</p>
                    </div>
                    {stats.by_status.map((st) => (
                        <div key={st.id} className="bg-card rounded-xl border p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", st.color)}>
                                    <DynIcon name={st.icon} className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-2xl font-bold">{st.count}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{st.name}</p>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-3 mb-6"
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar evento..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-xl h-10"
                    />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-[180px] rounded-xl h-10">
                        <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas categorias</SelectItem>
                        {categories.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                                <span className="flex items-center gap-2">
                                    <DynIcon name={c.icon} className="w-3.5 h-3.5" /> {c.name}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-[160px] rounded-xl h-10">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos status</SelectItem>
                        {statuses.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                                <span className="flex items-center gap-2">
                                    <span className={cn("w-2 h-2 rounded-full", s.color)} /> {s.name}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </motion.div>

            {/* Events */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Upcoming */}
                    {upcomingEvents.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Próximos Eventos
                                <Badge variant="outline" className="ml-1">{upcomingEvents.length}</Badge>
                            </h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {upcomingEvents.map((event) => (
                                    <EventCard key={event.id} event={event} onClick={() => navigate(`/externas/${event.id}`)} />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Past */}
                    {pastEvents.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                            <h2 className="text-lg font-semibold mb-4 text-muted-foreground flex items-center gap-2">
                                Eventos Anteriores
                                <Badge variant="outline" className="ml-1">{pastEvents.length}</Badge>
                            </h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
                                {pastEvents.slice(0, 6).map((event) => (
                                    <EventCard key={event.id} event={event} onClick={() => navigate(`/externas/${event.id}`)} />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Empty */}
                    {events.length === 0 && (
                        <div className="text-center py-12">
                            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">Nenhum evento encontrado</p>
                            <Button variant="outline" className="mt-4" onClick={() => navigate("/externas/novo")}>
                                <Plus className="w-4 h-4 mr-2" /> Criar primeiro evento
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </AppShell>
    );
};

export default ExternasDashboard;
