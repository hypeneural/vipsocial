import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Plus,
    Search,
    Check,
    Trash2,
    User,
    Calendar,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    mapGavetasToNewsDrafts,
    useDeleteNoticiaGaveta,
    useGavetasWithNoticias,
    useUpdateNoticiaGaveta,
} from "@/hooks/useRoteiro";
import { NewsDraft } from "@/types/roteiros";
import { cn } from "@/lib/utils";

const GavetasManage = () => {
    const { data: gavetasData = [] } = useGavetasWithNoticias();
    const updateNoticiaMutation = useUpdateNoticiaGaveta();
    const deleteNoticiaMutation = useDeleteNoticiaGaveta();

    const [searchQuery, setSearchQuery] = useState("");
    const [showCompleted, setShowCompleted] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const gavetas = useMemo(() => mapGavetasToNewsDrafts(gavetasData), [gavetasData]);

    const filteredGavetas = useMemo(() => {
        return gavetas.filter((gaveta) => {
            if (!showCompleted && gaveta.is_checked === 1) return false;

            if (
                searchQuery &&
                !gaveta.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !gaveta.author.toLowerCase().includes(searchQuery.toLowerCase())
            ) {
                return false;
            }

            return true;
        });
    }, [gavetas, searchQuery, showCompleted]);

    const pendingCount = useMemo(
        () => gavetas.filter((item) => item.is_checked === 0).length,
        [gavetas]
    );

    const handleMarkComplete = (item: NewsDraft) => {
        updateNoticiaMutation.mutate({
            gavetaId: item.gaveta_id,
            noticiaId: item.id,
            data: { is_checked: 1 },
        });
    };

    const handleDelete = (item: NewsDraft) => {
        if (!confirm("Deseja excluir esta gaveta?")) {
            return;
        }

        deleteNoticiaMutation.mutate({
            gavetaId: item.gaveta_id,
            noticiaId: item.id,
        });
    };

    const startEditTitle = (item: NewsDraft) => {
        setEditingId(item.id);
        setEditTitle(item.title);
    };

    const saveTitle = () => {
        if (!editingId) return;

        const item = gavetas.find((draft) => draft.id === editingId);
        if (!item) return;

        updateNoticiaMutation.mutate({
            gavetaId: item.gaveta_id,
            noticiaId: item.id,
            data: { titulo: editTitle },
        });

        setEditingId(null);
        setEditTitle("");
    };

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
                                {pendingCount} pendentes
                            </Badge>
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Materias em espera para uso no roteiro
                        </p>
                    </div>

                    <Link to="/roteiros/gavetas/criar">
                        <Button className="bg-primary hover:bg-primary-dark rounded-xl">
                            <Plus className="w-4 h-4 mr-2" />
                            Criar Gavetas
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
                        placeholder="Buscar por titulo ou autor..."
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
                    {showCompleted ? "Ocultar Concluidas" : "Mostrar Concluidas"}
                </Button>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-2xl border border-border/50 overflow-hidden"
            >
                <div className="grid grid-cols-[1fr_150px_150px_100px] gap-4 p-4 bg-muted/50 border-b border-border font-semibold text-sm">
                    <div>Titulo</div>
                    <div>Autor</div>
                    <div>Criado em</div>
                    <div className="text-center">Acoes</div>
                </div>

                {filteredGavetas.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <p>Nenhuma gaveta encontrada</p>
                    </div>
                ) : (
                    filteredGavetas.map((gaveta, index) => (
                        <motion.div
                            key={gaveta.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.03 }}
                            className={cn(
                                "grid grid-cols-[1fr_150px_150px_100px] gap-4 p-4 border-b border-border/50 items-center",
                                "hover:bg-muted/30 transition-colors",
                                gaveta.is_checked === 1 && "opacity-50 bg-muted/20"
                            )}
                        >
                            <div>
                                {editingId === gaveta.id ? (
                                    <Input
                                        type="text"
                                        value={editTitle}
                                        onChange={(event) => setEditTitle(event.target.value)}
                                        onBlur={saveTitle}
                                        onKeyDown={(event) => event.key === "Enter" && saveTitle()}
                                        className="h-8"
                                        autoFocus
                                    />
                                ) : (
                                    <p
                                        className={cn(
                                            "font-medium cursor-pointer hover:underline",
                                            gaveta.is_checked === 1 && "line-through"
                                        )}
                                        onDoubleClick={() => startEditTitle(gaveta)}
                                    >
                                        {gaveta.title}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="w-4 h-4" />
                                {gaveta.author}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {gaveta.created_at}
                            </div>

                            <div className="flex items-center justify-center gap-2">
                                {gaveta.is_checked === 0 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                                        onClick={() => handleMarkComplete(gaveta)}
                                        title="Marcar como utilizado"
                                    >
                                        <Check className="w-4 h-4" />
                                    </Button>
                                )}
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
                    ))
                )}
            </motion.div>
        </AppShell>
    );
};

export default GavetasManage;
