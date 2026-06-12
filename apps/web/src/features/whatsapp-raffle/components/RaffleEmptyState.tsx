import { UserX } from "lucide-react";

export function RaffleEmptyState() {
    return (
        <div className="rounded-md border border-yellow-400/30 bg-yellow-400/10 px-5 py-4 text-yellow-100" role="status">
            <div className="flex items-center gap-3">
                <UserX className="h-5 w-5" aria-hidden="true" />
                <p className="text-sm font-semibold">Nenhum participante elegivel foi encontrado para este sorteio.</p>
            </div>
        </div>
    );
}
