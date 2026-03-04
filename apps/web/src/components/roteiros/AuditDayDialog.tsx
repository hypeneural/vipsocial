import { useState } from "react";
import { ScrollText } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AuditTimeline } from "./AuditTimeline";
import { useLogsByDate } from "@/hooks/useRoteiro";

interface AuditDayDialogProps {
    currentDate: string;
    trigger?: React.ReactNode;
}

/**
 * Modal com timeline de todos os logs do dia (todas as matérias do roteiro).
 * Aberto pelo botão "Log" no Dashboard.
 */
export const AuditDayDialog = ({ currentDate, trigger }: AuditDayDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const { data: logs = [], isLoading } = useLogsByDate(isOpen ? currentDate : undefined);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <ScrollText className="w-4 h-4 mr-2" />
                        Log do Dia
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ScrollText className="w-5 h-5 text-muted-foreground" />
                        <span>Log do Dia</span>
                        <span className="text-sm font-normal text-muted-foreground">
                            {new Date(currentDate + "T12:00:00").toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                            })}
                        </span>
                    </DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto flex-1 pr-1">
                    <AuditTimeline
                        logs={logs}
                        isLoading={isLoading}
                        emptyMessage="Nenhuma alteração registrada para este dia"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
