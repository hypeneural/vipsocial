import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Plus,
    Search,
    Phone,
    Edit,
    Trash2,
    Tag,
    Bell,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Destination, formatPhoneNumber } from "@/types/alertas";
import { cn } from "@/lib/utils";

// Mock data
const mockDestinations: Destination[] = [
    {
        destination_id: 1,
        phone_number: "+5547999991111",
        name: "VIP Tijucas",
        tags: ["tijucas", "geral"],
        active: true,
        created_at: "2026-01-01",
        updated_at: "2026-01-20",
        alertCount: 3,
        lastSentAt: "há 2h",
    },
    {
        destination_id: 2,
        phone_number: "+5547999992222",
        name: "VIP Itapema",
        tags: ["itapema", "geral"],
        active: true,
        created_at: "2026-01-01",
        updated_at: "2026-01-20",
        alertCount: 3,
        lastSentAt: "há 2h",
    },
    {
        destination_id: 3,
        phone_number: "+5547999993333",
        name: "VIP Barra Velha",
        tags: ["barra-velha", "geral"],
        active: true,
        created_at: "2026-01-01",
        updated_at: "2026-01-20",
        alertCount: 2,
        lastSentAt: "há 5h",
    },
    {
        destination_id: 4,
        phone_number: "+5547999994444",
        name: "VIP Esportes",
        tags: ["esportes"],
        active: false,
        created_at: "2026-01-01",
        updated_at: "2026-01-18",
        alertCount: 1,
        lastSentAt: "há 2 dias",
    },
];

const DestinationsList = () => {
    const navigate = useNavigate();
    const [destinations, setDestinations] = useState<Destination[]>(mockDestinations);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
    const [filterTag, setFilterTag] = useState<string | null>(null);

    // Coleta todas as tags
    const allTags = Array.from(
        new Set(destinations.flatMap(d => d.tags))
    ).sort();

    // Filtra destinos
    const filteredDestinations = destinations.filter(dest => {
        if (searchQuery &&
            !dest.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !dest.phone_number.includes(searchQuery)) return false;
        if (filterStatus === "active" && !dest.active) return false;
        if (filterStatus === "inactive" && dest.active) return false;
        if (filterTag && !dest.tags.includes(filterTag)) return false;
        return true;
    });

    const toggleActive = (id: number) => {
        setDestinations(prev =>
            prev.map(d => d.destination_id === id ? { ...d, active: !d.active } : d)
        );
        // TODO: Save to API
    };

    const handleDelete = (id: number) => {
        if (confirm("Deseja desativar este destino?")) {
            setDestinations(prev =>
                prev.map(d => d.destination_id === id ? { ...d, active: false } : d)
            );
            // TODO: Delete from API
        }
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
                    to="/alertas"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Dashboard
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">Destinos</h1>
                        <p className="text-sm text-muted-foreground">
                            Grupos de WhatsApp para receber alertas
                        </p>
                    </div>

                    <Link to="/alertas/destinos/novo">
                        <Button className="bg-primary hover:bg-primary-dark rounded-xl">
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Destino
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col md:flex-row gap-3 mb-6"
            >
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou número..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-xl bg-secondary/50"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2 border rounded-xl bg-background text-sm"
                >
                    <option value="all">Todos os status</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                </select>
                <select
                    value={filterTag || ""}
                    onChange={(e) => setFilterTag(e.target.value || null)}
                    className="px-4 py-2 border rounded-xl bg-background text-sm"
                >
                    <option value="">Todas as tags</option>
                    {allTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                    ))}
                </select>
            </motion.div>

            {/* Destinations Grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
                {filteredDestinations.map((dest, index) => (
                    <motion.div
                        key={dest.destination_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                            "bg-card rounded-2xl border p-4 transition-all hover:shadow-md",
                            !dest.active && "opacity-70 border-dashed"
                        )}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    dest.active ? "bg-blue-500/10" : "bg-muted"
                                )}>
                                    <Phone className={cn(
                                        "w-5 h-5",
                                        dest.active ? "text-blue-500" : "text-muted-foreground"
                                    )} />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{dest.name}</h3>
                                    <p className="text-xs text-muted-foreground">
                                        {formatPhoneNumber(dest.phone_number)}
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={dest.active}
                                onCheckedChange={() => toggleActive(dest.destination_id)}
                            />
                        </div>

                        {/* Tags */}
                        {dest.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                                {dest.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                        <Tag className="w-3 h-3 mr-1" />
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                                <Bell className="w-3 h-3" />
                                <span>{dest.alertCount} alerta(s)</span>
                            </div>
                            <span>•</span>
                            <span>Último envio: {dest.lastSentAt}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/alertas/destinos/${dest.destination_id}/editar`)}
                                className="flex-1 rounded-lg"
                            >
                                <Edit className="w-4 h-4 mr-1" />
                                Editar
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(dest.destination_id)}
                                className="text-destructive hover:text-destructive rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                ))}

                {filteredDestinations.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum destino encontrado</p>
                    </div>
                )}
            </motion.div>
        </AppShell>
    );
};

export default DestinationsList;
