import { EyeOff, Layers3, Sparkles, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhatsAppSelectionBarProps {
    selectedCount: number;
    isCreatingBundle: boolean;
    activeAction: "star" | "ignore" | "review" | null;
    onClearSelection: () => void;
    onStarSelection: () => void;
    onIgnoreSelection: () => void;
    onMarkReviewedSelection: () => void;
    onCreateBundle: () => void;
}

export function WhatsAppSelectionBar({
    selectedCount,
    isCreatingBundle,
    activeAction,
    onClearSelection,
    onStarSelection,
    onIgnoreSelection,
    onMarkReviewedSelection,
    onCreateBundle,
}: WhatsAppSelectionBarProps) {
    if (selectedCount <= 0) {
        return null;
    }

    const isBusy = Boolean(activeAction) || isCreatingBundle;

    return (
        <div className="sticky bottom-4 z-20 mt-4">
            <div className="mx-auto flex max-w-5xl flex-col gap-3 rounded-2xl border border-border/60 bg-background/95 p-3 shadow-xl backdrop-blur lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success/10 text-success">
                        <Layers3 className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            {selectedCount} mensagem(ns) selecionada(s)
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Use a selecao atual para destacar, ignorar, revisar ou criar um agrupamento editorial.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={onClearSelection}
                        disabled={isBusy}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Limpar
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={onStarSelection}
                        disabled={isBusy}
                    >
                        <Star className="mr-2 h-4 w-4" />
                        {activeAction === "star" ? "Destacando..." : "Destacar"}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={onIgnoreSelection}
                        disabled={isBusy}
                    >
                        <EyeOff className="mr-2 h-4 w-4" />
                        {activeAction === "ignore" ? "Ignorando..." : "Ignorar"}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={onMarkReviewedSelection}
                        disabled={isBusy}
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {activeAction === "review" ? "Marcando..." : "Marcar como revisadas"}
                    </Button>

                    <Button
                        type="button"
                        className="rounded-xl"
                        onClick={onCreateBundle}
                        disabled={isBusy}
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isCreatingBundle ? "Criando..." : "Criar agrupamento"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
