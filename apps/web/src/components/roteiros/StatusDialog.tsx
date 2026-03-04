import { useState } from "react";
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
import { StatusMateria } from "@/types/roteiros";
import { cn } from "@/lib/utils";
import { StatusIcon, AVAILABLE_ICONS, type StatusIconName } from "./StatusIcon";

interface StatusDialogProps {
    statuses: StatusMateria[];
    onStatusCreate: (nome: string, icone: string) => Promise<void>;
    onStatusUpdate: (id: number, nome: string, icone: string) => Promise<void>;
    onStatusDelete: (id: number) => Promise<void>;
    trigger?: React.ReactNode;
}

/**
 * Dialog para gerenciamento de status de matérias com CRUD completo
 * Cada status tem Nome + Ícone Lucide selecionável
 */
export const StatusDialog = ({
    statuses,
    onStatusCreate,
    onStatusUpdate,
    onStatusDelete,
    trigger,
}: StatusDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newIcon, setNewIcon] = useState("circle");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState("");
    const [editingIcon, setEditingIcon] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState<"new" | number | null>(null);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setIsLoading(true);
        try {
            await onStatusCreate(newName.trim(), newIcon);
            setNewName("");
            setNewIcon("circle");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editingName.trim()) return;
        setIsLoading(true);
        try {
            await onStatusUpdate(id, editingName.trim(), editingIcon);
            setEditingId(null);
            setEditingName("");
            setEditingIcon("");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Deseja excluir este status?")) return;
        setIsLoading(true);
        try {
            await onStatusDelete(id);
        } finally {
            setIsLoading(false);
        }
    };

    const startEditing = (status: StatusMateria) => {
        setEditingId(status.id);
        setEditingName(status.nome);
        setEditingIcon(status.icone);
        setShowIconPicker(null);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingName("");
        setEditingIcon("");
        setShowIconPicker(null);
    };

    const IconPickerGrid = ({
        selectedIcon,
        onSelect,
    }: {
        selectedIcon: string;
        onSelect: (icon: string) => void;
    }) => (
        <div className="grid grid-cols-7 gap-1 p-2 bg-muted/30 rounded-lg border border-border/50 mt-1">
            {AVAILABLE_ICONS.map((icon) => (
                <button
                    key={icon.name}
                    type="button"
                    onClick={() => {
                        onSelect(icon.name);
                        setShowIconPicker(null);
                    }}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-md transition-colors",
                        "hover:bg-primary/10 hover:text-primary",
                        selectedIcon === icon.name
                            ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                            : "text-muted-foreground"
                    )}
                    title={icon.label}
                >
                    <StatusIcon name={icon.name as StatusIconName} className="w-4 h-4" />
                </button>
            ))}
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        Gerenciar Status
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Gerenciar Status</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Create new status */}
                    <div className="space-y-1">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                                onClick={() => setShowIconPicker(showIconPicker === "new" ? null : "new")}
                                disabled={isLoading}
                                title="Escolher ícone"
                            >
                                <StatusIcon name={newIcon as StatusIconName} className="w-4 h-4" />
                            </Button>
                            <Input
                                placeholder="Nome do status..."
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                className="flex-1"
                                disabled={isLoading}
                            />
                            <Button
                                onClick={handleCreate}
                                disabled={!newName.trim() || isLoading}
                                size="icon"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {showIconPicker === "new" && (
                            <IconPickerGrid
                                selectedIcon={newIcon}
                                onSelect={(icon) => setNewIcon(icon)}
                            />
                        )}
                    </div>

                    {/* Status list */}
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                        {statuses.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Nenhum status cadastrado
                            </p>
                        ) : (
                            statuses.map((status) => (
                                <div
                                    key={status.id}
                                    className="space-y-1"
                                >
                                    <div
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-lg border",
                                            "bg-card hover:bg-muted/50 transition-colors"
                                        )}
                                    >
                                        {editingId === status.id ? (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 shrink-0"
                                                    onClick={() =>
                                                        setShowIconPicker(
                                                            showIconPicker === status.id ? null : status.id
                                                        )
                                                    }
                                                    title="Escolher ícone"
                                                >
                                                    <StatusIcon
                                                        name={editingIcon as StatusIconName}
                                                        className="w-4 h-4"
                                                    />
                                                </Button>
                                                <Input
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleUpdate(status.id);
                                                        if (e.key === "Escape") cancelEditing();
                                                    }}
                                                    className="flex-1 h-8"
                                                    autoFocus
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-green-600"
                                                    onClick={() => handleUpdate(status.id)}
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
                                                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                                    <StatusIcon
                                                        name={status.icone as StatusIconName}
                                                        className="w-4 h-4 text-foreground"
                                                    />
                                                </div>
                                                <span className="flex-1 text-sm font-medium">
                                                    {status.nome}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => startEditing(status)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={() => handleDelete(status.id)}
                                                    disabled={isLoading}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                    {showIconPicker === status.id && (
                                        <IconPickerGrid
                                            selectedIcon={editingIcon}
                                            onSelect={(icon) => setEditingIcon(icon)}
                                        />
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
