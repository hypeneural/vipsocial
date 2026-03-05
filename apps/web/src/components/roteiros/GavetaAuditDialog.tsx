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
import { useGavetaLogs } from "@/hooks/useRoteiro";

interface GavetaAuditDialogProps {
    gavetaId: number;
    gavetaTitle: string;
}

/**
 * Modal com timeline do historico da gaveta.
 * Exibe criacao, alteracoes e remocoes com before/after.
 */
export const GavetaAuditDialog = ({ gavetaId, gavetaTitle }: GavetaAuditDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const { data: logs = [], isLoading } = useGavetaLogs(isOpen ? gavetaId : undefined);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 hover:bg-muted/50"
                    title="Ver historico de alteracoes"
                >
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">Historico</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 min-w-0">
                        <History className="w-5 h-5 text-muted-foreground shrink-0" />
                        <span className="truncate">Historico da Gaveta</span>
                        <span className="text-sm font-normal text-muted-foreground truncate">
                            {gavetaTitle}
                        </span>
                    </DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto flex-1 pr-1">
                    <AuditTimeline
                        logs={logs}
                        isLoading={isLoading}
                        emptyMessage="Nenhuma alteracao registrada para esta gaveta"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
