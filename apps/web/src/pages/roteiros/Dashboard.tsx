import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Keyboard, Settings, ListChecks, ScrollText, Tv, X, Clock, FileText, Timer, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RealtimeClock } from "@/components/roteiros/RealtimeClock";
import { EditionPicker } from "@/components/roteiros/EditionPicker";
import { StatisticsCards } from "@/components/roteiros/StatisticsCards";
import { RoteiroTable } from "@/components/roteiros/RoteiroTable";
import { GavetasWidget } from "@/components/roteiros/GavetasWidget";
import { CategoriaDialog } from "@/components/roteiros/CategoriaDialog";
import { StatusDialog } from "@/components/roteiros/StatusDialog";
import { AuditDayDialog } from "@/components/roteiros/AuditDayDialog";
import {
    mapMateriaToNewsItem,
    useCategorias,
    useCreateCategoria,
    useDeleteCategoria,
    useFindOrCreateRoteiro,
    useGavetas,
    useUpdateGaveta,
    useLatestRoteiro,
    useReorderMaterias,
    useRoteiroByDate,
    useStatusMaterias,
    useCreateStatusMateria,
    useUpdateStatusMateria,
    useDeleteStatusMateria,
    useUpdateCategoria,
    useUpdateMateria,
} from "@/hooks/useRoteiro";
import { UpdateMateriaDTO } from "@/services/roteiro.service";
import {
    Categoria,
    MateriaStatus,
    NewsItem,
    PROGRAM_DURATION_SECONDS,
    durationToSeconds,
    secondsToDuration,
} from "@/types/roteiros";
import { cn } from "@/lib/utils";

const getLocalDateInput = (): string => {
    const date = new Date();
    const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - timezoneOffsetMs).toISOString().split("T")[0];
};

const RoteirosDashboard = () => {

    const [currentDate, setCurrentDate] = useState<string>(() => getLocalDateInput());
    const [items, setItems] = useState<NewsItem[]>([]);
    const [isTvMode, setIsTvMode] = useState(false);

    const reorderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {
        data: roteiro,
        isLoading: isRoteiroLoading,
        isError: isRoteiroError,
        error: roteiroError,
    } = useRoteiroByDate(currentDate);
    const { data: latestRoteiro } = useLatestRoteiro();
    const { data: categorias = [] } = useCategorias();
    const { data: gavetas = [] } = useGavetas();

    const createCategoriaMutation = useCreateCategoria();
    const updateCategoriaMutation = useUpdateCategoria();
    const deleteCategoriaMutation = useDeleteCategoria();

    const { data: statusMaterias = [] } = useStatusMaterias();
    const createStatusMateriaMutation = useCreateStatusMateria();
    const updateStatusMateriaMutation = useUpdateStatusMateria();
    const deleteStatusMateriaMutation = useDeleteStatusMateria();

    const updateMateriaMutation = useUpdateMateria({
        roteiroId: roteiro?.id,
        currentDate,
    });
    const reorderMateriasMutation = useReorderMaterias({
        roteiroId: roteiro?.id,
        currentDate,
    });

    const updateGavetaMutation = useUpdateGaveta();
    const findOrCreateMutation = useFindOrCreateRoteiro();

    const categoriasIndex = useMemo(() => {
        return new Map<number, Categoria>(categorias.map((categoria) => [categoria.id, categoria]));
    }, [categorias]);

    const roteiroErrorMessage = useMemo(() => {
        if (!roteiroError) return "";

        const maybeError = roteiroError as {
            response?: { data?: { message?: string } };
            message?: string;
        };

        return maybeError.response?.data?.message ?? maybeError.message ?? "Falha ao carregar roteiro";
    }, [roteiroError]);

    const noRoteiroForDate = !isRoteiroLoading && !isRoteiroError && !roteiro;

    // Auto-create roteiro with 12 empty matérias for dates without one
    useEffect(() => {
        if (noRoteiroForDate && !findOrCreateMutation.isPending) {
            findOrCreateMutation.mutate(currentDate);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [noRoteiroForDate, currentDate]);

    useEffect(() => {
        const materias = roteiro?.materias ?? [];

        setItems(
            materias.map((materia) =>
                mapMateriaToNewsItem(materia, roteiro?.data ?? currentDate, categoriasIndex)
            )
        );
    }, [roteiro, currentDate, categoriasIndex]);

    // Cleanup debounce timer
    useEffect(() => {
        return () => {
            if (reorderDebounceRef.current) {
                clearTimeout(reorderDebounceRef.current);
            }
        };
    }, []);

    // Calculate total duration
    const totalDuration = items.reduce((acc, item) => {
        return acc + durationToSeconds(item.duration);
    }, 0);
    const totalDurationDisplay = secondsToDuration(totalDuration);

    // Calculate remaining time
    const remainingSeconds = PROGRAM_DURATION_SECONDS - totalDuration;
    const remainingDisplay = secondsToDuration(remainingSeconds);
    const isOverTime = remainingSeconds < 0;

    const handleVisualize = (date: string) => {
        setCurrentDate(date);
    };

    const handleLoadLatestEdition = () => {
        if (!latestRoteiro?.data) return;
        setCurrentDate(latestRoteiro.data);
    };



    const persistReorder = (nextItems: NewsItem[]) => {
        if (!roteiro?.id || nextItems.length === 0) return;

        if (reorderDebounceRef.current) {
            clearTimeout(reorderDebounceRef.current);
        }

        reorderDebounceRef.current = setTimeout(() => {
            const payload = nextItems.map((item, index) => ({
                id: item.id,
                ordem: index + 1,
                shortcut: `F${index + 1}`,
            }));

            reorderMateriasMutation.mutate(payload);
        }, 600);
    };

    const handleItemsChange = (newItems: NewsItem[]) => {
        const normalizedItems = newItems.map((item, index) => ({
            ...item,
            priority: index + 1,
            shortcut: `F${index + 1}`,
        }));

        setItems(normalizedItems);
        persistReorder(normalizedItems);
    };

    const handleFieldUpdate = (id: number, field: string, value: string | number) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        [field]: value,
                    }
                    : item
            )
        );

        const payload: UpdateMateriaDTO = {};

        if (field === "title") payload.titulo = String(value);
        if (field === "description") payload.descricao = String(value);
        if (field === "shortcut") payload.shortcut = String(value).toUpperCase();
        if (field === "duration") payload.duracao = String(value);
        if (field === "creditos_gc") payload.creditos_gc = String(value);

        if (Object.keys(payload).length > 0) {
            updateMateriaMutation.mutate({ materiaId: id, data: payload });
        }
    };

    const handleStatusChange = (id: number, status: MateriaStatus) => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
        updateMateriaMutation.mutate({ materiaId: id, data: { status } });
    };

    const handleCategoriaChange = (id: number, categoriaId: number | null) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        categoria_id: categoriaId ?? undefined,
                        categoria: categoriaId ? categorias.find((categoria) => categoria.id === categoriaId) : undefined,
                    }
                    : item
            )
        );

        updateMateriaMutation.mutate({
            materiaId: id,
            data: { categoria_id: categoriaId ?? null },
        });
    };

    const handleMarkGavetaComplete = (gavetaId: number) => {
        updateGavetaMutation.mutate({
            gavetaId,
            data: { is_checked: true }
        });
    };

    const handleCategoriaCreate = async (nome: string) => {
        await createCategoriaMutation.mutateAsync({ nome });
    };

    const handleCategoriaUpdate = async (id: number, nome: string) => {
        await updateCategoriaMutation.mutateAsync({ id, nome });
    };

    const handleCategoriaDelete = async (id: number) => {
        await deleteCategoriaMutation.mutateAsync(id);

        setItems((prev) =>
            prev.map((item) =>
                item.categoria_id === id
                    ? { ...item, categoria_id: undefined, categoria: undefined }
                    : item
            )
        );
    };

    const handleStatusCreate = async (nome: string, icone: string) => {
        await createStatusMateriaMutation.mutateAsync({ nome, icone });
    };

    const handleStatusUpdate = async (id: number, nome: string, icone: string) => {
        await updateStatusMateriaMutation.mutateAsync({ id, nome, icone });
    };

    const handleStatusDelete = async (id: number) => {
        await deleteStatusMateriaMutation.mutateAsync(id);
    };

    // Toggle TV mode with ESC key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isTvMode) {
                setIsTvMode(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isTvMode]);

    // TV MODE - simplified view for presenters
    if (isTvMode) {
        return (
            <div className="min-h-screen bg-background p-2 sm:p-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 sm:mb-4"
                >
                    <div className="bg-card rounded-xl sm:rounded-2xl border border-border/50 p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-3 sm:hidden">
                            <span className="text-sm font-medium text-muted-foreground">Modo apresentador</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsTvMode(false)}
                                className="rounded-full h-8 px-3"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Sair
                            </Button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div className="grid grid-cols-3 sm:flex sm:items-center gap-3 sm:gap-6">
                                <div className="flex flex-col sm:flex-row items-center sm:gap-2 text-center sm:text-left">
                                    <div className="p-2 rounded-lg bg-primary/10 mb-1 sm:mb-0">
                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">Materias</p>
                                        <p className="text-lg sm:text-xl font-bold">{items.length}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center sm:gap-2 text-center sm:text-left">
                                    <div className="p-2 rounded-lg bg-info/10 mb-1 sm:mb-0">
                                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-info" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">Duracao</p>
                                        <p className="text-lg sm:text-xl font-bold font-mono">{totalDurationDisplay}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center sm:gap-2 text-center sm:text-left">
                                    <div
                                        className={cn(
                                            "p-2 rounded-lg mb-1 sm:mb-0",
                                            isOverTime ? "bg-destructive/10" : "bg-success/10"
                                        )}
                                    >
                                        <Timer
                                            className={cn(
                                                "w-4 h-4 sm:w-5 sm:h-5",
                                                isOverTime ? "text-destructive" : "text-success"
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                                            {isOverTime ? "Excedido" : "Restante"}
                                        </p>
                                        <p
                                            className={cn(
                                                "text-lg sm:text-xl font-bold font-mono",
                                                isOverTime ? "text-destructive" : "text-success"
                                            )}
                                        >
                                            {remainingDisplay}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsTvMode(false)}
                                className="rounded-full hidden sm:flex shrink-0"
                                title="Sair do modo TV (ESC)"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <RoteiroTable
                        items={items}
                        categorias={categorias}
                        statusList={statusMaterias}
                        roteiroId={roteiro?.id}
                        onItemsChange={handleItemsChange}
                        onFieldUpdate={handleFieldUpdate}
                        onStatusChange={handleStatusChange}
                        onCategoriaChange={handleCategoriaChange}
                        enableKeyboardShortcuts={true}
                    />
                </motion.div>
            </div>
        );
    }

    return (
        <AppShell>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl md:text-2xl font-bold">Roteiros</h1>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsTvMode(true)}
                            className="rounded-full bg-muted/50 hover:bg-primary/10 transition-colors h-9 w-9"
                            title="Modo TV para apresentador"
                        >
                            <Tv className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-4">
                        <RealtimeClock />
                        <EditionPicker
                            currentDate={currentDate}
                            onVisualize={handleVisualize}
                        />
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-4 p-3 bg-info/10 border border-info/30 rounded-xl flex items-center gap-3"
            >
                <Keyboard className="w-5 h-5 text-info shrink-0" />
                <span className="text-sm text-info">
                    <strong>Dica:</strong> Use as teclas <Badge variant="outline" className="mx-1">F1</Badge> a{" "}
                    <Badge variant="outline" className="mx-1">F12</Badge> para mover itens rapidamente para o topo
                </span>
            </motion.div>

            {isRoteiroError && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-3"
                >
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                    <span className="text-sm text-destructive">
                        Erro ao carregar roteiro para {currentDate}: {roteiroErrorMessage}
                    </span>
                </motion.div>
            )}

            {noRoteiroForDate && findOrCreateMutation.isPending && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mb-6 p-4 bg-primary/10 border border-primary/20 rounded-2xl"
                >
                    <Clock className="w-5 h-5 text-primary animate-spin" />
                    <span className="text-sm text-primary">
                        Criando roteiro para {currentDate}...
                    </span>
                </motion.div>
            )}

            <StatisticsCards
                totalItems={items.length}
                totalDuration={totalDurationDisplay}
                className="mb-6"
            />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex gap-3 mb-6 flex-wrap"
            >
                <CategoriaDialog
                    categorias={categorias}
                    onCategoriaCreate={handleCategoriaCreate}
                    onCategoriaUpdate={handleCategoriaUpdate}
                    onCategoriaDelete={handleCategoriaDelete}
                    trigger={
                        <Button variant="outline" className="rounded-xl">
                            <Settings className="w-4 h-4 mr-2" />
                            Categorias
                        </Button>
                    }
                />
                <StatusDialog
                    statuses={statusMaterias}
                    onStatusCreate={handleStatusCreate}
                    onStatusUpdate={handleStatusUpdate}
                    onStatusDelete={handleStatusDelete}
                    trigger={
                        <Button variant="outline" className="rounded-xl">
                            <ListChecks className="w-4 h-4 mr-2" />
                            Status
                        </Button>
                    }
                />
                <AuditDayDialog
                    currentDate={currentDate}
                    trigger={
                        <Button variant="outline" className="rounded-xl">
                            <ScrollText className="w-4 h-4 mr-2" />
                            Log
                        </Button>
                    }
                />
            </motion.div>

            <div className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <RoteiroTable
                        items={items}
                        categorias={categorias}
                        statusList={statusMaterias}
                        roteiroId={roteiro?.id}
                        onItemsChange={handleItemsChange}
                        onFieldUpdate={handleFieldUpdate}
                        onStatusChange={handleStatusChange}
                        onCategoriaChange={handleCategoriaChange}
                        enableKeyboardShortcuts={true}
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <GavetasWidget
                        gavetas={gavetas}
                        onMarkComplete={handleMarkGavetaComplete}
                    />
                </motion.div>
            </div>
        </AppShell>
    );
};

export default RoteirosDashboard;
