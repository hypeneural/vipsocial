import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Bell,
    Edit,
    Phone,
    Plus,
    Search,
    Tag,
    Trash2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    useDeleteDestination,
    useDestinations,
    useToggleDestination,
} from "@/hooks/useAlertas";
import { formatPhoneNumber } from "@/types/alertas";
import { cn } from "@/lib/utils";

const DestinationsList = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
    const [filterTag, setFilterTag] = useState<string | null>(null);

    const destinationsQuery = useDestinations({
        per_page: 100,
        search: searchQuery || undefined,
        include_inactive: filterStatus !== "active",
        include_archived: false,
    });
    const toggleMutation = useToggleDestination();
    const deleteMutation = useDeleteDestination();

    const destinations = destinationsQuery.data?.data ?? [];

    const allTags = useMemo(
        () => Array.from(new Set(destinations.flatMap((destination) => destination.tags ?? []))).sort(),
        [destinations]
    );

    const filteredDestinations = destinations.filter((destination) => {
        if (filterStatus === "active" && !destination.active) return false;
        if (filterStatus === "inactive" && destination.active) return false;
        if (filterTag && !(destination.tags ?? []).includes(filterTag)) return false;
        return true;
    });

    const formatLastSent = (dateString?: string | null) => {
        if (!dateString) {
            return "Nunca";
        }

        return new Date(dateString).toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
        });
    };

    const handleToggle = async (destinationId: number) => {
        try {
            await toggleMutation.mutateAsync(destinationId);
        } catch {
            return;
        }
    };

    const handleArchive = async (destinationId: number) => {
        if (!window.confirm("Deseja arquivar este destino?")) {
            return;
        }

        try {
            await deleteMutation.mutateAsync(destinationId);
        } catch {
            return;
        }
    };

    return (
        <AppShell>
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
                            Telefones e grupos cadastrados para receber alertas.
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

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col md:flex-row gap-3 mb-6"
            >
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou numero..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="pl-10 rounded-xl bg-secondary/50"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(event) => setFilterStatus(event.target.value as "all" | "active" | "inactive")}
                    className="px-4 py-2 border rounded-xl bg-background text-sm"
                >
                    <option value="all">Todos os status</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                </select>
                <select
                    value={filterTag || ""}
                    onChange={(event) => setFilterTag(event.target.value || null)}
                    className="px-4 py-2 border rounded-xl bg-background text-sm"
                >
                    <option value="">Todas as tags</option>
                    {allTags.map((tag) => (
                        <option key={tag} value={tag}>
                            {tag}
                        </option>
                    ))}
                </select>
            </motion.div>

            {destinationsQuery.isLoading ? (
                <div className="rounded-2xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
                    Carregando destinos...
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {filteredDestinations.map((destination, index) => (
                        <motion.div
                            key={destination.destination_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                                "bg-card rounded-2xl border p-4 transition-all hover:shadow-md",
                                !destination.active && "opacity-70 border-dashed"
                            )}
                        >
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            destination.active ? "bg-blue-500/10" : "bg-muted"
                                        )}
                                    >
                                        <Phone
                                            className={cn(
                                                "w-5 h-5",
                                                destination.active ? "text-blue-500" : "text-muted-foreground"
                                            )}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold truncate">{destination.name}</h3>
                                        <p className="text-xs text-muted-foreground break-all">
                                            {formatPhoneNumber(destination.phone_number)}
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={destination.active}
                                    onCheckedChange={() => handleToggle(destination.destination_id)}
                                />
                            </div>

                            {(destination.tags ?? []).length > 0 ? (
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {destination.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="text-xs">
                                            <Tag className="w-3 h-3 mr-1" />
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            ) : null}

                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                <div className="flex items-center gap-1">
                                    <Bell className="w-3 h-3" />
                                    <span>{destination.alert_count ?? 0} alerta(s)</span>
                                </div>
                                <span>-</span>
                                <span>Ultimo envio: {formatLastSent(destination.last_sent_at)}</span>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/alertas/destinos/${destination.destination_id}/editar`)}
                                    className="flex-1 rounded-lg"
                                >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Editar
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleArchive(destination.destination_id)}
                                    className="text-destructive hover:text-destructive rounded-lg"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}

                    {filteredDestinations.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum destino encontrado</p>
                        </div>
                    ) : null}
                </motion.div>
            )}
        </AppShell>
    );
};

export default DestinationsList;
