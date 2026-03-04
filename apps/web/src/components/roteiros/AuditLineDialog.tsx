import { useState } from "react";
import { History } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AuditTimeline } from "./AuditTimeline";
import { useMateriaLogs } from "@/hooks/useRoteiro";

interface AuditLineDialogProps {
    roteiroId?: number;
    materiaId: number;
    materiaTitle: string;
    shortcut: string;
}

/**
 * Modal com timeline de audit log de uma matéria específica.
 * Aberto pelo ícone 📋 em cada linha do RoteiroTable.
 */
export const AuditLineDialog = ({
    roteiroId,
    materiaId,
    materiaTitle,
    shortcut,
}: AuditLineDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const { data: logs = [], isLoading } = useMateriaLogs(
        isOpen ? roteiroId : undefined,
        isOpen ? materiaId : undefined
    );

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-40 hover:opacity-100 transition-opacity"
                    title="Histórico de alterações"
                >
                    <History className="w-3.5 h-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-muted-foreground" />
                        <span>Log — {shortcut}</span>
                        {materiaTitle && (
                            <span className="text-sm font-normal text-muted-foreground truncate max-w-[200px]">
                                {materiaTitle}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto flex-1 pr-1">
                    <AuditTimeline
                        logs={logs}
                        isLoading={isLoading}
                        emptyMessage="Nenhuma alteração registrada para esta matéria"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
