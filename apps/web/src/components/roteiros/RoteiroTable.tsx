import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ShortcutBall } from "./ShortcutBall";
import { RichTextEditor } from "./RichTextEditor";
import { StatusSelect } from "./StatusSelect";
import { AuditLineDialog } from "./AuditLineDialog";
import { NewsItem, Categoria, MateriaStatus, StatusMateria } from "@/types/roteiros";
import { useShortcutKeys } from "@/hooks/useShortcutKeys";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { cn } from "@/lib/utils";

// ==========================================
// BLOCK CONFIGURATION
// ==========================================
const BLOCK_CONFIG = [
    {
        label: "Bloco 1",
        range: "F1 — F4",
        headerBg: "bg-blue-50 dark:bg-blue-950/30",
        headerBorder: "border-blue-200 dark:border-blue-800/40",
        headerText: "text-blue-700 dark:text-blue-300",
        rowBg: "bg-blue-50/30 dark:bg-blue-950/10",
        borderLeft: "border-l-blue-400 dark:border-l-blue-600",
    },
    {
        label: "Bloco 2",
        range: "F5 — F8",
        headerBg: "bg-amber-50 dark:bg-amber-950/30",
        headerBorder: "border-amber-200 dark:border-amber-800/40",
        headerText: "text-amber-700 dark:text-amber-300",
        rowBg: "bg-amber-50/30 dark:bg-amber-950/10",
        borderLeft: "border-l-amber-400 dark:border-l-amber-600",
    },
    {
        label: "Bloco 3",
        range: "F9 — F12",
        headerBg: "bg-emerald-50 dark:bg-emerald-950/30",
        headerBorder: "border-emerald-200 dark:border-emerald-800/40",
        headerText: "text-emerald-700 dark:text-emerald-300",
        rowBg: "bg-emerald-50/30 dark:bg-emerald-950/10",
        borderLeft: "border-l-emerald-400 dark:border-l-emerald-600",
    },
] as const;

const ITEMS_PER_BLOCK = 4;

const getBlockIndex = (itemIndex: number): number =>
    Math.min(Math.floor(itemIndex / ITEMS_PER_BLOCK), BLOCK_CONFIG.length - 1);

interface RoteiroTableProps {
    items: NewsItem[];
    categorias: Categoria[];
    statusList?: StatusMateria[];
    roteiroId?: number;
    onItemsChange: (items: NewsItem[]) => void;
    onFieldUpdate: (id: number, field: string, value: string | number) => void;
    onStatusChange: (id: number, status: MateriaStatus) => void;
    onCategoriaChange: (id: number, categoriaId: number | null) => void;
    enableKeyboardShortcuts?: boolean;
}

/**
 * Tabela principal do roteiro com drag & drop e atalhos de teclado
 * Mobile-first responsive: stacks columns on mobile, full grid on desktop
 */
export const RoteiroTable = ({
    items,
    categorias,
    statusList,
    roteiroId,
    onItemsChange,
    onFieldUpdate,
    onStatusChange,
    onCategoriaChange,
    enableKeyboardShortcuts = true,
}: RoteiroTableProps) => {
    const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
    const [editValue, setEditValue] = useState("");

    // Hook para atalhos F1-F12
    const { highlightedId } = useShortcutKeys(items, {
        enabled: enableKeyboardShortcuts,
        onReorder: onItemsChange,
    });

    // Hook para drag & drop
    const { handleDragStart, handleDragOver, handleDragEnd, handleDrop, getItemStyle } =
        useDragAndDrop(items, onItemsChange);

    const startEditing = (id: number, field: string, currentValue: string) => {
        setEditingCell({ id, field });
        setEditValue(currentValue);
    };

    const saveEdit = () => {
        if (editingCell) {
            onFieldUpdate(editingCell.id, editingCell.field, editValue);
            setEditingCell(null);
        }
    };

    const cancelEdit = () => {
        setEditingCell(null);
        setEditValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            saveEdit();
        } else if (e.key === "Escape") {
            cancelEdit();
        }
    };

    // Group items into blocks
    const blocks = items.reduce<{ blockIdx: number; items: { item: NewsItem; originalIndex: number }[] }[]>(
        (acc, item, index) => {
            const blockIdx = getBlockIndex(index);
            let block = acc.find((b) => b.blockIdx === blockIdx);
            if (!block) {
                block = { blockIdx, items: [] };
                acc.push(block);
            }
            block.items.push({ item, originalIndex: index });
            return acc;
        },
        []
    );

    return (
        <div className="space-y-4">
            {/* Column Header - Sticky below navbar, hidden on mobile */}
            <div className="hidden lg:block sticky top-16 z-20 bg-background">
                <div className="bg-card rounded-xl sm:rounded-2xl border border-border/50 overflow-hidden">
                    <div className="grid grid-cols-[40px_50px_minmax(150px,2fr)_minmax(150px,2fr)_90px_130px_75px_60px_30px] gap-2 p-3 bg-muted/50 border-b border-border font-semibold text-sm">
                        <div></div>
                        <div className="text-center">Atalho</div>
                        <div>Título</div>
                        <div>Linha de Apoio</div>
                        <div className="text-center">Categoria</div>
                        <div className="text-center">Créditos/GC</div>
                        <div className="text-center">Tempo</div>
                        <div className="text-center">Status</div>
                        <div></div>
                    </div>
                </div>
            </div>

            {/* Blocks */}
            {blocks.length > 0 ? (
                blocks.map((block) => {
                    const config = BLOCK_CONFIG[block.blockIdx];
                    return (
                        <div
                            key={block.blockIdx}
                            className={cn(
                                "bg-card rounded-xl sm:rounded-2xl border border-border/50 overflow-hidden",
                                "border-l-4",
                                config.borderLeft
                            )}
                        >
                            {/* Block Header */}
                            <div
                                className={cn(
                                    "px-4 py-2.5 border-b flex items-center gap-3",
                                    config.headerBg,
                                    config.headerBorder
                                )}
                            >
                                <span className={cn("font-semibold text-sm", config.headerText)}>
                                    {config.label}
                                </span>
                                <span className={cn("text-xs font-medium opacity-70", config.headerText)}>
                                    {config.range}
                                </span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                    {block.items.length} {block.items.length === 1 ? "matéria" : "matérias"}
                                </span>
                            </div>

                            {/* Block Rows */}
                            <AnimatePresence>
                                {block.items.map(({ item }) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        style={getItemStyle(item.id)}
                                        className={cn(
                                            "border-b border-border/50 last:border-b-0",
                                            "hover:bg-muted/30 transition-colors",
                                            config.rowBg,
                                            highlightedId === item.id && "!bg-primary/10 ring-2 ring-primary/50"
                                        )}
                                        draggable
                                        onDragStart={() => handleDragStart(item.id)}
                                        onDragOver={(e) => handleDragOver(e, item.id)}
                                        onDragEnd={handleDragEnd}
                                        onDrop={() => handleDrop(item.id)}
                                    >
                                        {/* Mobile Layout */}
                                        <div className="lg:hidden p-3">
                                            {/* Row 1: Drag + Shortcut + Title + Status + Actions */}
                                            <div className="flex items-start gap-2 mb-2">
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                                                    <ShortcutBall
                                                        shortcut={item.shortcut}
                                                        isHighlighted={highlightedId === item.id}
                                                        size="sm"
                                                        onClick={() => startEditing(item.id, "shortcut", item.shortcut)}
                                                    />
                                                </div>
                                                <div
                                                    className="flex-1 min-w-0 cursor-pointer"
                                                    onDoubleClick={() => startEditing(item.id, "title", item.title)}
                                                >
                                                    {editingCell?.id === item.id && editingCell?.field === "title" ? (
                                                        <RichTextEditor
                                                            value={editValue}
                                                            onChange={setEditValue}
                                                            onBlur={saveEdit}
                                                            className="text-sm"
                                                        />
                                                    ) : (
                                                        <div
                                                            className="text-sm font-medium"
                                                            dangerouslySetInnerHTML={{ __html: item.title }}
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <StatusSelect
                                                        value={item.status}
                                                        onChange={(status) => onStatusChange(item.id, status)}
                                                        statusList={statusList}
                                                    />
                                                    <AuditLineDialog
                                                        roteiroId={roteiroId}
                                                        materiaId={item.id}
                                                        materiaTitle={item.title}
                                                        shortcut={item.shortcut}
                                                    />
                                                </div>
                                            </div>

                                            {/* Row 2: Description */}
                                            <div
                                                className="text-sm text-muted-foreground mb-2 cursor-pointer"
                                                onDoubleClick={() => startEditing(item.id, "description", item.description)}
                                            >
                                                {editingCell?.id === item.id && editingCell?.field === "description" ? (
                                                    <RichTextEditor
                                                        value={editValue}
                                                        onChange={setEditValue}
                                                        onBlur={saveEdit}
                                                        className="text-sm"
                                                    />
                                                ) : (
                                                    <div dangerouslySetInnerHTML={{ __html: item.description }} />
                                                )}
                                            </div>

                                            {/* Row 3: Meta info (Categoria, Créditos, Tempo) */}
                                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                                <Select
                                                    value={item.categoria_id?.toString() || "none"}
                                                    onValueChange={(value) =>
                                                        onCategoriaChange(item.id, value === "none" ? null : parseInt(value))
                                                    }
                                                >
                                                    <SelectTrigger className="h-6 text-xs w-auto min-w-[80px]">
                                                        <SelectValue placeholder="Cat." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">-</SelectItem>
                                                        {categorias.map((cat) => (
                                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                                {cat.nome}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <span className="text-muted-foreground">
                                                    {item.creditos_gc || "Sem créditos"}
                                                </span>

                                                <span className="font-mono bg-muted px-2 py-0.5 rounded">
                                                    {item.duration}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Desktop Layout */}
                                        <div className="hidden lg:grid grid-cols-[40px_50px_minmax(150px,2fr)_minmax(150px,2fr)_90px_130px_75px_60px_30px] gap-2 p-3 items-center">
                                            {/* Drag Handle */}
                                            <div className="flex justify-center cursor-grab active:cursor-grabbing">
                                                <GripVertical className="w-5 h-5 text-muted-foreground" />
                                            </div>

                                            {/* Shortcut Ball */}
                                            <div className="flex justify-center">
                                                {editingCell?.id === item.id && editingCell?.field === "shortcut" ? (
                                                    <Input
                                                        type="text"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                                                        onBlur={saveEdit}
                                                        onKeyDown={handleKeyDown}
                                                        className="w-10 h-7 text-center text-xs"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <ShortcutBall
                                                        shortcut={item.shortcut}
                                                        isHighlighted={highlightedId === item.id}
                                                        size="sm"
                                                        onClick={() => startEditing(item.id, "shortcut", item.shortcut)}
                                                    />
                                                )}
                                            </div>

                                            {/* Title */}
                                            <div
                                                className="min-w-0 cursor-pointer"
                                                onDoubleClick={() => startEditing(item.id, "title", item.title)}
                                            >
                                                {editingCell?.id === item.id && editingCell?.field === "title" ? (
                                                    <RichTextEditor
                                                        value={editValue}
                                                        onChange={setEditValue}
                                                        onBlur={saveEdit}
                                                        className="text-sm"
                                                    />
                                                ) : (
                                                    <div
                                                        className="text-sm px-2 py-1 rounded hover:bg-muted/50"
                                                        dangerouslySetInnerHTML={{ __html: item.title }}
                                                    />
                                                )}
                                            </div>

                                            {/* Description */}
                                            <div
                                                className="min-w-0 cursor-pointer"
                                                onDoubleClick={() => startEditing(item.id, "description", item.description)}
                                            >
                                                {editingCell?.id === item.id && editingCell?.field === "description" ? (
                                                    <RichTextEditor
                                                        value={editValue}
                                                        onChange={setEditValue}
                                                        onBlur={saveEdit}
                                                        className="text-sm"
                                                    />
                                                ) : (
                                                    <div
                                                        className="text-sm text-muted-foreground px-2 py-1 rounded hover:bg-muted/50"
                                                        dangerouslySetInnerHTML={{ __html: item.description }}
                                                    />
                                                )}
                                            </div>

                                            {/* Categoria */}
                                            <div className="flex justify-center">
                                                <Select
                                                    value={item.categoria_id?.toString() || "none"}
                                                    onValueChange={(value) =>
                                                        onCategoriaChange(item.id, value === "none" ? null : parseInt(value))
                                                    }
                                                >
                                                    <SelectTrigger className="h-7 text-xs w-full">
                                                        <SelectValue placeholder="Sel." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">-</SelectItem>
                                                        {categorias.map((cat) => (
                                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                                {cat.nome}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Créditos/GC */}
                                            <div
                                                className="min-w-0 cursor-pointer"
                                                onDoubleClick={() => startEditing(item.id, "creditos_gc", item.creditos_gc || "")}
                                            >
                                                {editingCell?.id === item.id && editingCell?.field === "creditos_gc" ? (
                                                    <Input
                                                        type="text"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onBlur={saveEdit}
                                                        onKeyDown={handleKeyDown}
                                                        placeholder="Fontes..."
                                                        className="h-7 text-xs"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground px-2 py-1 rounded hover:bg-muted/50 block truncate">
                                                        {item.creditos_gc || "-"}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Duration */}
                                            <div
                                                className="text-center cursor-pointer"
                                                onDoubleClick={() => startEditing(item.id, "duration", item.duration)}
                                            >
                                                {editingCell?.id === item.id && editingCell?.field === "duration" ? (
                                                    <Input
                                                        type="text"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onBlur={saveEdit}
                                                        onKeyDown={handleKeyDown}
                                                        placeholder="00:00:00"
                                                        className="w-full h-7 text-center text-xs tabular-nums"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span className="font-mono text-xs px-2 py-1 rounded hover:bg-muted/50">
                                                        {item.duration}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex justify-center">
                                                <StatusSelect
                                                    value={item.status}
                                                    onChange={(status) => onStatusChange(item.id, status)}
                                                    statusList={statusList}
                                                />
                                            </div>

                                            {/* Log Icon */}
                                            <div className="flex justify-center">
                                                <AuditLineDialog
                                                    roteiroId={roteiroId}
                                                    materiaId={item.id}
                                                    materiaTitle={item.title}
                                                    shortcut={item.shortcut}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    );
                })
            ) : (
                <div className="bg-card rounded-xl sm:rounded-2xl border border-border/50 p-8 text-center text-muted-foreground">
                    <p>Nenhum item no roteiro</p>
                    <p className="text-sm">Clique em "Adicionar Item" para começar</p>
                </div>
            )}
        </div>
    );
};
