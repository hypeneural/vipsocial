import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Plus,
    Search,
    Check,
    Trash2,
    Calendar,
    ChevronDown,
    ChevronRight,
    FileText,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    useDeleteNoticiaGaveta,
    useGavetasWithNoticias,
    useUpdateNoticiaGaveta,
} from "@/hooks/useRoteiro";
import { Gaveta, NoticiaGaveta } from "@/types/roteiros";
import { cn } from "@/lib/utils";

const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
    });
};

const GavetasManage = () => {
    const { data: gavetasData = [], isLoading, isError } = useGavetasWithNoticias();
    const updateNoticiaMutation = useUpdateNoticiaGaveta();
    const deleteNoticiaMutation = useDeleteNoticiaGaveta();

    const [searchQuery, setSearchQuery] = useState("");
    const [showCompleted, setShowCompleted] = useState(false);
    const [expandedGavetas, setExpandedGavetas] = useState<Set<number>>(new Set());
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const filteredGavetas = useMemo(() => {
        return gavetasData.filter((gaveta) => {
            if (
                searchQuery &&
                !gaveta.nome.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !(gaveta.noticias ?? []).some((n) =>
                    n.titulo.toLowerCase().includes(searchQuery.toLowerCase())
                )
            ) {
                return false;
            }
            return true;
        });
    }, [gavetasData, searchQuery]);

    const totalPendingNoticias = useMemo(
        () =>
            gavetasData.reduce(
                (acc, g) => acc + (g.noticias ?? []).filter((n) => !n.is_checked).length,
                0
            ),
        [gavetasData]
    );

    const toggleExpand = (id: number) => {
        setExpandedGavetas((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleMarkComplete = (gaveta: Gaveta, noticia: NoticiaGaveta) => {
        updateNoticiaMutation.mutate({
            gavetaId: gaveta.id,
            noticiaId: noticia.id,
            data: { is_checked: 1 },
        });
    };

    const handleDelete = (gaveta: Gaveta, noticia: NoticiaGaveta) => {
        if (!confirm(`Deseja excluir "${noticia.titulo}"?`)) return;
        deleteNoticiaMutation.mutate({
            gavetaId: gaveta.id,
            noticiaId: noticia.id,
        });
    };

    const startEditTitle = (noticia: NoticiaGaveta) => {
        setEditingId(noticia.id);
        setEditTitle(noticia.titulo);
    };

    const saveTitle = (gaveta: Gaveta) => {
        if (!editingId) return;
        updateNoticiaMutation.mutate({
            gavetaId: gaveta.id,
            noticiaId: editingId,
            data: { titulo: editTitle },
        });
        setEditingId(null);
        setEditTitle("");
    };

    if (isLoading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">Carregando gavetas...</span>
                </div>
            </AppShell>
        );
    }

    if (isError) {
        return (
            <AppShell>
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                    <p className="text-destructive font-semibold">Erro ao carregar gavetas</p>
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
                            Gerenciar Gavetas
                            <Badge variant="secondary" className="ml-3 text-sm">
                                {gavetasData.length} gavetas
                            </Badge>
                            {totalPendingNoticias > 0 && (
                                <Badge className="ml-2 text-sm bg-warning/15 text-warning border-warning/30">
                                    {totalPendingNoticias} pendentes
                                </Badge>
                            )}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Matérias em espera para uso no roteiro
                        </p>
                    </div>

                    <Link to="/roteiros/gavetas/criar">
                        <Button className="bg-primary hover:bg-primary-dark rounded-xl">
                            <Plus className="w-4 h-4 mr-2" />
                            Criar Gaveta
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
                        placeholder="Buscar por gaveta ou notícia..."
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
                    {showCompleted ? "Ocultar Concluídas" : "Mostrar Concluídas"}
                </Button>
            </motion.div>

            {/* Gavetas List */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-3 pb-20 md:pb-0"
            >
                {filteredGavetas.length === 0 ? (
                    <div className="bg-card rounded-2xl border border-border/50 p-8 text-center text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>Nenhuma gaveta encontrada</p>
                        <Link to="/roteiros/gavetas/criar" className="mt-3 inline-block">
                            <Button variant="outline" size="sm" className="rounded-xl">
                                <Plus className="w-4 h-4 mr-2" />
                                Criar Gaveta
                            </Button>
                        </Link>
                    </div>
                ) : (
                    filteredGavetas.map((gaveta, index) => {
                        const noticias = gaveta.noticias ?? [];
                        const pending = noticias.filter((n) => !n.is_checked);
                        const completed = noticias.filter((n) => n.is_checked);
                        const isExpanded = expandedGavetas.has(gaveta.id);
                        const visibleNoticias = showCompleted ? noticias : pending;

                        return (
                            <motion.div
                                key={gaveta.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="bg-card rounded-2xl border border-border/50 overflow-hidden"
                            >
                                {/* Gaveta Header */}
                                <div
                                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                                    onClick={() => toggleExpand(gaveta.id)}
                                >
                                    <div className="text-muted-foreground">
                                        {isExpanded ? (
                                            <ChevronDown className="w-5 h-5" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold truncate">{gaveta.nome}</h3>
                                            <Badge
                                                variant="secondary"
                                                className="text-[10px] rounded-full"
                                            >
                                                {noticias.length}{" "}
                                                {noticias.length === 1 ? "notícia" : "notícias"}
                                            </Badge>
                                            {pending.length > 0 && (
                                                <Badge className="text-[10px] rounded-full bg-warning/15 text-warning border-warning/30">
                                                    {pending.length} pendentes
                                                </Badge>
                                            )}
                                            {pending.length === 0 && noticias.length > 0 && (
                                                <Badge className="text-[10px] rounded-full bg-success/15 text-success border-success/30">
                                                    Todas concluídas
                                                </Badge>
                                            )}
                                        </div>
                                        {gaveta.descricao && (
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                {gaveta.descricao}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDate(gaveta.created_at)}
                                    </div>
                                </div>

                                {/* Noticias List (expanded) */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="border-t border-border/50">
                                                {visibleNoticias.length === 0 ? (
                                                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                                                        {noticias.length === 0
                                                            ? "Nenhuma notícia nesta gaveta"
                                                            : "Nenhuma notícia pendente"}
                                                    </div>
                                                ) : (
                                                    visibleNoticias.map((noticia) => (
                                                        <div
                                                            key={noticia.id}
                                                            className={cn(
                                                                "flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-b-0",
                                                                "hover:bg-muted/20 transition-colors",
                                                                noticia.is_checked && "opacity-50"
                                                            )}
                                                        >
                                                            <div className="w-5 shrink-0" />

                                                            <div className="flex-1 min-w-0">
                                                                {editingId === noticia.id ? (
                                                                    <Input
                                                                        type="text"
                                                                        value={editTitle}
                                                                        onChange={(e) =>
                                                                            setEditTitle(e.target.value)
                                                                        }
                                                                        onBlur={() => saveTitle(gaveta)}
                                                                        onKeyDown={(e) =>
                                                                            e.key === "Enter" &&
                                                                            saveTitle(gaveta)
                                                                        }
                                                                        className="h-8"
                                                                        autoFocus
                                                                    />
                                                                ) : (
                                                                    <p
                                                                        className={cn(
                                                                            "text-sm cursor-pointer hover:underline",
                                                                            noticia.is_checked &&
                                                                            "line-through"
                                                                        )}
                                                                        onDoubleClick={() =>
                                                                            startEditTitle(noticia)
                                                                        }
                                                                    >
                                                                        {noticia.titulo}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-1 shrink-0">
                                                                {!noticia.is_checked && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-success hover:text-success hover:bg-success/10"
                                                                        onClick={() =>
                                                                            handleMarkComplete(
                                                                                gaveta,
                                                                                noticia
                                                                            )
                                                                        }
                                                                        title="Marcar como utilizado"
                                                                    >
                                                                        <Check className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={() =>
                                                                        handleDelete(gaveta, noticia)
                                                                    }
                                                                    title="Excluir"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}

                                                {/* Show completed count when hidden */}
                                                {!showCompleted && completed.length > 0 && (
                                                    <div className="px-4 py-2 text-xs text-muted-foreground text-center bg-muted/20">
                                                        + {completed.length}{" "}
                                                        {completed.length === 1
                                                            ? "notícia concluída"
                                                            : "notícias concluídas"}{" "}
                                                        (clique em "Mostrar Concluídas")
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </motion.div>
        </AppShell>
    );
};

export default GavetasManage;
