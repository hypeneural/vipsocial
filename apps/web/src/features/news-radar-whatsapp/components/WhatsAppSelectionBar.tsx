import { Layers3, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhatsAppSelectionBarProps {
    selectedCount: number;
    isCreatingBundle: boolean;
    onClearSelection: () => void;
    onCreateBundle: () => void;
}

export function WhatsAppSelectionBar({
    selectedCount,
    isCreatingBundle,
    onClearSelection,
    onCreateBundle,
}: WhatsAppSelectionBarProps) {
    if (selectedCount <= 0) {
        return null;
    }

    return (
        <div className="sticky bottom-4 z-20 mt-4">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/95 p-3 shadow-xl backdrop-blur">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success/10 text-success">
                        <Layers3 className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            {selectedCount} mensagem(ns) pronta(s) para agrupamento
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Use a selecao atual para iniciar um bundle editorial.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={onClearSelection}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Limpar
                    </Button>
                    <Button
                        type="button"
                        className="rounded-xl"
                        onClick={onCreateBundle}
                        disabled={isCreatingBundle}
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isCreatingBundle ? "Criando..." : "Criar bundle"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
