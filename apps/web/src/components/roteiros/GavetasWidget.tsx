import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Settings, Check, User, Calendar, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gaveta } from "@/types/roteiros";
import { cn } from "@/lib/utils";

const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
    });
};

interface GavetasWidgetProps {
    gavetas: Gaveta[];
    onMarkComplete: (id: number) => void;
    onUpdateField?: (id: number, field: "titulo", value: string) => void;
    className?: string;
}

/**
 * Widget de Gavetas para o Dashboard
 * Exibe matérias em espera e permite marcar como concluídas
 */
export const GavetasWidget = ({
    gavetas,
    onMarkComplete,
    onUpdateField,
    className,
}: GavetasWidgetProps) => {
    const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
    const [editValue, setEditValue] = useState("");

    const pendingGavetas = gavetas.filter((g) => !g.is_checked);

    const startEditing = (id: number, field: string, currentValue: string) => {
        if (!onUpdateField) return;
        setEditingCell({ id, field });
        setEditValue(currentValue);
    };

    const saveEdit = () => {
        if (editingCell && onUpdateField) {
            onUpdateField(editingCell.id, editingCell.field as "titulo", editValue);
            setEditingCell(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("bg-card rounded-2xl border border-border/50 overflow-hidden", className)}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
                <h3 className="font-semibold flex items-center gap-2">
                    📁 Matérias na Gaveta
                    <span className="text-sm font-normal text-muted-foreground">
                        ({pendingGavetas.length})
                    </span>
                </h3>
                <Link to="/roteiros/gavetas">
                    <Button variant="ghost" size="sm" className="h-8">
                        <Settings className="w-4 h-4 mr-1" />
                        Gerenciar
                    </Button>
                </Link>
            </div>

            {/* List */}
            <div className="divide-y divide-border/50">
                {pendingGavetas.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                        <p className="mb-2">Nenhuma matéria na gaveta</p>
                        <Link to="/roteiros/gavetas/criar">
                            <Button variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Criar Gaveta
                            </Button>
                        </Link>
                    </div>
                ) : (
                    pendingGavetas.slice(0, 5).map((gaveta) => (
                        <motion.div
                            key={gaveta.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
                        >
                            {/* Title */}
                            <div className="flex-1 min-w-0">
                                {editingCell?.id === gaveta.id && editingCell?.field === "titulo" ? (
                                    <Input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={saveEdit}
                                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                                        className="h-7 text-sm"
                                        autoFocus
                                    />
                                ) : (
                                    <p
                                        className="font-medium text-sm truncate cursor-pointer hover:underline"
                                        onDoubleClick={() => startEditing(gaveta.id, "titulo", gaveta.titulo)}
                                    >
                                        {gaveta.titulo}
                                    </p>
                                )}
                            </div>

                            {/* Author */}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
                                <User className="w-3 h-3" />
                                <span>{gaveta.user?.name || "Desconhecido"}</span>
                            </div>

                            {/* Created At */}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(gaveta.created_at)}</span>
                            </div>

                            {/* Mark Complete */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-success hover:text-success hover:bg-success/10"
                                onClick={() => onMarkComplete(gaveta.id)}
                                title="Marcar como utilizado"
                            >
                                <Check className="w-4 h-4" />
                            </Button>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Footer */}
            {pendingGavetas.length > 5 && (
                <div className="p-3 bg-muted/30 text-center">
                    <Link
                        to="/roteiros/gavetas"
                        className="text-sm text-primary hover:underline"
                    >
                        Ver todas ({pendingGavetas.length - 5} mais)
                    </Link>
                </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2 p-3 border-t border-border/50 bg-muted/20">
                <Link to="/roteiros/gavetas/criar" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Gavetas
                    </Button>
                </Link>
                <Link to="/roteiros/gavetas" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                        <Settings className="w-4 h-4 mr-2" />
                        Gerenciar Gavetas
                    </Button>
                </Link>
            </div>
        </motion.div>
    );
};
