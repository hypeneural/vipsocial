import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Plus,
    Search,
    Check,
    Trash2,
    Calendar,
    FileText,
    Loader2,
    AlertCircle,
    UserCircle,
    History,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    useDeleteGaveta,
    useGavetas,
    useUpdateGaveta,
} from "@/hooks/useRoteiro";
import { Gaveta } from "@/types/roteiros";
import { cn } from "@/lib/utils";

const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const GavetasManage = () => {
    const { data: gavetasData = [], isLoading, isError } = useGavetas();
    const updateGavetaMutation = useUpdateGaveta();
    const deleteGavetaMutation = useDeleteGaveta();

    const [searchQuery, setSearchQuery] = useState("");
    const [showCompleted, setShowCompleted] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const filteredGavetas = useMemo(() => {
        return gavetasData.filter((gaveta) => {
            const matchesSearch =
                !searchQuery ||
                gaveta.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (gaveta.descricao && gaveta.descricao.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStatus = showCompleted ? true : !gaveta.is_checked;

            return matchesSearch && matchesStatus;
        });
    }, [gavetasData, searchQuery, showCompleted]);

    const totalPending = useMemo(
        () => gavetasData.filter((g) => !g.is_checked).length,
        [gavetasData]
    );

    const handleMarkComplete = (gaveta: Gaveta) => {
        updateGavetaMutation.mutate({
            gavetaId: gaveta.id,
            data: { is_checked: true },
        });
    };

    const handleDelete = (gaveta: Gaveta) => {
        if (!confirm(`Deseja excluir "${gaveta.titulo}"?`)) return;
        deleteGavetaMutation.mutate(gaveta.id);
    };

    const startEditTitle = (gaveta: Gaveta) => {
        setEditingId(gaveta.id);
        setEditTitle(gaveta.titulo);
    };

    const saveTitle = (gaveta: Gaveta) => {
        if (!editingId) return;
        if (editTitle.trim() !== gaveta.titulo) {
            updateGavetaMutation.mutate({
                gavetaId: gaveta.id,
                data: { titulo: editTitle },
            });
        }
        setEditingId(null);
        setEditTitle("");
    };

    if (isLoading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">Carregando notícias da gaveta...</span>
                </div>
            </AppShell>
        );
    }

    if (isError) {
        return (
            <AppShell>
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                    <p className="text-destructive font-semibold">Erro ao carregar notícias</p>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <Link
                    to="/roteiros"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Roteiros
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">
                            Notícias de Gaveta
                            <Badge variant="secondary" className="ml-3 text-sm">
                                {gavetasData.length} total
                            </Badge>
                            {totalPending > 0 && (
                                <Badge className="ml-2 text-sm bg-warning/15 text-warning border-warning/30">
                                    {totalPending} pendentes
                                </Badge>
                            )}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Matérias atemporais ou "frias" prontas para uso no roteiro
                        </p>
                    </div>

                    <Link to="/roteiros/gavetas/criar">
                        <Button className="bg-primary hover:bg-primary-dark rounded-xl">
                            <Plus className="w-4 h-4 mr-2" />
                            Criar Notícia de Gaveta
                        </Button>
                    </Link>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col md:flex-row gap-3 mb-6"
            >
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar notícia..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="pl-10 rounded-xl bg-secondary/50"
                    />
                </div>
                <Button
                    variant={showCompleted ? "default" : "outline"}
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="rounded-xl"
                >
                    {showCompleted ? "Ocultar Utilizadas" : "Mostrar Utilizadas"}
                </Button>
            </motion.div>

            {/* List */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-3 pb-20 md:pb-0"
            >
                {filteredGavetas.length === 0 ? (
                    <div className="bg-card rounded-2xl border border-border/50 p-8 text-center text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>Nenhuma notícia encontrada</p>
                        <Link to="/roteiros/gavetas/criar" className="mt-3 inline-block">
                            <Button variant="outline" size="sm" className="rounded-xl">
                                <Plus className="w-4 h-4 mr-2" />
                                Criar Notícia
                            </Button>
                        </Link>
                    </div>
                ) : (
                    filteredGavetas.map((gaveta, index) => {
                        return (
                            <motion.div
                                key={gaveta.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className={cn(
                                    "bg-card rounded-2xl border border-border/50 overflow-hidden flex flex-col md:flex-row md:items-center p-4 gap-4",
                                    gaveta.is_checked && "opacity-60"
                                )}
                            >
                                <div className="flex-1 min-w-0 order-2 md:order-1">
                                    {editingId === gaveta.id ? (
                                        <Input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onBlur={() => saveTitle(gaveta)}
                                            onKeyDown={(e) => e.key === "Enter" && saveTitle(gaveta)}
                                            className="h-8 mb-2 max-w-sm font-semibold"
                                            autoFocus
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3
                                                className={cn("font-semibold truncate cursor-pointer hover:underline", gaveta.is_checked && "line-through")}
                                                onDoubleClick={() => startEditTitle(gaveta)}
                                            >
                                                {gaveta.titulo}
                                            </h3>
                                            {gaveta.is_checked && (
                                                <Badge className="text-[10px] rounded-full bg-success/15 text-success border-success/30">
                                                    Utilizada
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                    {gaveta.descricao && (
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                            {gaveta.descricao}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col md:items-end gap-1 text-xs text-muted-foreground order-1 md:order-2 shrink-0 md:min-w-[12rem]">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{formatDate(gaveta.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <UserCircle className="w-3.5 h-3.5" />
                                        <span>{gaveta.user?.name || "Usuário não registrado"}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 order-3 border-t border-border/30 pt-3 md:border-t-0 md:pt-0">
                                    {!gaveta.is_checked && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-1.5 text-success hover:text-success hover:bg-success/10"
                                            onClick={() => handleMarkComplete(gaveta)}
                                        >
                                            <Check className="w-4 h-4" />
                                            <span className="hidden sm:inline">Utilizar</span>
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-1.5 hover:bg-muted/50"
                                        onClick={() => {
                                            // TODO: open modal with logs. Right now just alert
                                            alert("Histórico ainda não implementado na UI, veja os logs em /api/v1/roteiros/gavetas/" + gaveta.id);
                                        }}
                                        title="Ver histórico de alterações"
                                    >
                                        <History className="w-4 h-4" />
                                        <span className="hidden sm:inline">Histórico</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(gaveta)}
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </motion.div>
        </AppShell>
    );
};

export default GavetasManage;
