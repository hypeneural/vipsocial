import { useState } from "react";
import { motion } from "framer-motion";
import {
    Calendar,
    Plus,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    Users,
    Tag,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

// ==========================================
// TYPES
// ==========================================

interface Event {
    id: string;
    title: string;
    description?: string;
    date: Date;
    time: string;
    duration: number; // minutes
    type: "roteiro" | "reuniao" | "entrevista" | "externo" | "deadline";
    location?: string;
    participants?: string[];
}

const typeConfig = {
    roteiro: { label: "Roteiro", color: "bg-primary/15 text-primary" },
    reuniao: { label: "Reunião", color: "bg-info/15 text-info" },
    entrevista: { label: "Entrevista", color: "bg-warning/15 text-warning" },
    externo: { label: "Externo", color: "bg-success/15 text-success" },
    deadline: { label: "Deadline", color: "bg-destructive/15 text-destructive" },
};

// ==========================================
// MOCK DATA
// ==========================================

const today = new Date();
const mockEvents: Event[] = [
    {
        id: "1",
        title: "Roteiro Bom Dia",
        date: today,
        time: "06:00",
        duration: 180,
        type: "roteiro",
        participants: ["Maria Santos", "Carlos Oliveira"],
    },
    {
        id: "2",
        title: "Reunião de Pauta",
        description: "Definição de matérias da semana",
        date: today,
        time: "10:00",
        duration: 60,
        type: "reuniao",
        location: "Sala 3",
        participants: ["Equipe Redação"],
    },
    {
        id: "3",
        title: "Entrevista Governador",
        date: addDays(today, 1),
        time: "14:00",
        duration: 45,
        type: "entrevista",
        location: "Palácio do Governo",
    },
    {
        id: "4",
        title: "Deadline Edição Especial",
        date: addDays(today, 2),
        time: "18:00",
        duration: 0,
        type: "deadline",
    },
    {
        id: "5",
        title: "Cobertura Evento Externo",
        date: addDays(today, 3),
        time: "09:00",
        duration: 240,
        type: "externo",
        location: "Centro de Convenções",
    },
];

// ==========================================
// MAIN COMPONENT
// ==========================================

const Agenda = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events] = useState<Event[]>(mockEvents);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const getEventsForDate = (date: Date) =>
        events.filter((e) => isSameDay(e.date, date));

    const goToPreviousWeek = () => setCurrentDate(addDays(currentDate, -7));
    const goToNextWeek = () => setCurrentDate(addDays(currentDate, 7));
    const goToToday = () => setCurrentDate(new Date());

    return (
        <AppShell>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-primary" />
                            Agenda Editorial
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" className="rounded-xl" onClick={goToToday}>
                            Hoje
                        </Button>
                        <Button className="rounded-xl" onClick={() => setIsAddDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Evento
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={goToPreviousWeek}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <span className="text-sm font-medium">
                    {format(weekDays[0], "dd MMM", { locale: ptBR })} - {format(weekDays[6], "dd MMM", { locale: ptBR })}
                </span>
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={goToNextWeek}>
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4">
                {weekDays.map((day) => (
                    <div
                        key={day.toISOString()}
                        className={cn(
                            "text-center py-2 rounded-xl text-sm font-medium",
                            isToday(day) && "bg-primary text-primary-foreground"
                        )}
                    >
                        <div className="text-xs opacity-70">{format(day, "EEE", { locale: ptBR })}</div>
                        <div>{format(day, "dd")}</div>
                    </div>
                ))}
            </div>

            {/* Events by Day */}
            <div className="space-y-4">
                {weekDays.map((day) => {
                    const dayEvents = getEventsForDate(day);
                    if (dayEvents.length === 0) return null;

                    return (
                        <motion.div
                            key={day.toISOString()}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-card rounded-2xl border border-border/50 overflow-hidden"
                        >
                            <div className={cn(
                                "px-4 py-2 border-b border-border/50",
                                isToday(day) ? "bg-primary/10" : "bg-muted/30"
                            )}>
                                <span className="font-medium">
                                    {format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                </span>
                            </div>

                            <div className="divide-y divide-border/50">
                                {dayEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                                        onClick={() => setSelectedEvent(event)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge className={typeConfig[event.type].color}>
                                                        {typeConfig[event.type].label}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {event.time}
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold">{event.title}</h3>
                                                {event.description && (
                                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                                        {event.description}
                                                    </p>
                                                )}
                                                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                                    {event.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {event.location}
                                                        </span>
                                                    )}
                                                    {event.participants && (
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            {event.participants.length} participantes
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Ver Detalhes
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}

                {weekDays.every((day) => getEventsForDate(day).length === 0) && (
                    <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">Nenhum evento esta semana</p>
                    </div>
                )}
            </div>

            {/* Event Detail Dialog */}
            <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedEvent?.title}</DialogTitle>
                    </DialogHeader>
                    {selectedEvent && (
                        <div className="space-y-4 py-4">
                            <Badge className={typeConfig[selectedEvent.type].color}>
                                {typeConfig[selectedEvent.type].label}
                            </Badge>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Data</p>
                                    <p className="font-medium">{format(selectedEvent.date, "dd/MM/yyyy")}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Horário</p>
                                    <p className="font-medium">{selectedEvent.time}</p>
                                </div>
                                {selectedEvent.location && (
                                    <div className="col-span-2">
                                        <p className="text-muted-foreground">Local</p>
                                        <p className="font-medium">{selectedEvent.location}</p>
                                    </div>
                                )}
                            </div>
                            {selectedEvent.description && (
                                <div>
                                    <p className="text-muted-foreground text-sm">Descrição</p>
                                    <p className="text-sm">{selectedEvent.description}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Add Event Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Novo Evento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Título</Label>
                            <Input placeholder="Nome do evento" className="rounded-xl" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Data</Label>
                                <Input type="date" className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label>Horário</Label>
                                <Input type="time" className="rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea placeholder="Detalhes do evento..." className="rounded-xl" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setIsAddDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button className="rounded-xl" onClick={() => { setIsAddDialogOpen(false); toast.success("Evento criado com sucesso!"); }}>
                            Criar Evento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppShell>
    );
};

export default Agenda;
