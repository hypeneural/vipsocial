import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RaffleErrorStateProps {
    message?: string;
    onRetry: () => void;
}

export function RaffleErrorState({ message, onRetry }: RaffleErrorStateProps) {
    return (
        <div className="rounded-md border border-red-400/30 bg-red-500/10 px-5 py-4 text-red-50" role="alert">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                    <p className="text-sm font-semibold">
                        {message || "Nao foi possivel concluir o sorteio agora."}
                    </p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={onRetry} className="rounded-md">
                    <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                    Tentar novamente
                </Button>
            </div>
        </div>
    );
}
