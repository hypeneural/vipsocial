import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Check, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Categoria } from "@/types/roteiros";
import { cn } from "@/lib/utils";

interface CategoriaDialogProps {
    categorias: Categoria[];
    onCategoriaCreate: (nome: string) => Promise<void>;
    onCategoriaUpdate: (id: number, nome: string) => Promise<void>;
    onCategoriaDelete: (id: number) => Promise<void>;
    trigger?: React.ReactNode;
}

/**
 * Dialog para gerenciamento de categorias com CRUD completo
 * Categorias: policia, comercial, ao vivo, etc.
 */
export const CategoriaDialog = ({
    categorias,
    onCategoriaCreate,
    onCategoriaUpdate,
    onCategoriaDelete,
    trigger,
}: CategoriaDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [newCategoriaName, setNewCategoriaName] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        if (!newCategoriaName.trim()) return;
        setIsLoading(true);
        try {
            await onCategoriaCreate(newCategoriaName.trim());
            setNewCategoriaName("");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editingName.trim()) return;
        setIsLoading(true);
        try {
            await onCategoriaUpdate(id, editingName.trim());
            setEditingId(null);
            setEditingName("");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Deseja excluir esta categoria?")) return;
        setIsLoading(true);
        try {
            await onCategoriaDelete(id);
        } finally {
            setIsLoading(false);
        }
    };

    const startEditing = (categoria: Categoria) => {
        setEditingId(categoria.id);
        setEditingName(categoria.nome);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingName("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        Gerenciar Categorias
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Gerenciar Categorias</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Create new categoria */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Nova categoria..."
                            value={newCategoriaName}
                            onChange={(e) => setNewCategoriaName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                            disabled={isLoading}
                        />
                        <Button
                            onClick={handleCreate}
                            disabled={!newCategoriaName.trim() || isLoading}
                            size="icon"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {/* Lista de categorias */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {categorias.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Nenhuma categoria cadastrada
                            </p>
                        ) : (
                            categorias.map((categoria) => (
                                <div
                                    key={categoria.id}
                                    className={cn(
                                        "flex items-center gap-2 p-2 rounded-lg border",
                                        "bg-card hover:bg-muted/50 transition-colors"
                                    )}
                                >
                                    {editingId === categoria.id ? (
                                        <>
                                            <Input
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleUpdate(categoria.id);
                                                    if (e.key === "Escape") cancelEditing();
                                                }}
                                                className="flex-1 h-8"
                                                autoFocus
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-success"
                                                onClick={() => handleUpdate(categoria.id)}
                                                disabled={isLoading}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={cancelEditing}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="flex-1 text-sm font-medium">
                                                {categoria.nome}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => startEditing(categoria)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive"
                                                onClick={() => handleDelete(categoria.id)}
                                                disabled={isLoading}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
