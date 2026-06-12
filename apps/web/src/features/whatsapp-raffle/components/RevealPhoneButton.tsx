import { Copy, Eye, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WhatsAppRaffleRevealPhoneResult } from "@/features/whatsapp-raffle/types";

interface RevealPhoneButtonProps {
    disabled?: boolean;
    loading?: boolean;
    reveal?: WhatsAppRaffleRevealPhoneResult | null;
    errorCode?: string | null;
    errorMessage?: string | null;
    onReveal: () => void;
}

function revealErrorMessage(code?: string | null, message?: string | null): string {
    if (message) return message;
    if (code === "WHATSAPP_RAFFLE_REVEAL_DISABLED") return "Revelacao de telefone desabilitada.";
    if (code === "FORBIDDEN") return "Seu usuario nao tem permissao para revelar o telefone.";

    return "Nao foi possivel revelar o telefone agora.";
}

export function RevealPhoneButton({
    disabled = false,
    loading = false,
    reveal,
    errorCode,
    errorMessage,
    onReveal,
}: RevealPhoneButtonProps) {
    const copyPhone = async () => {
        if (!reveal?.phone_full) return;
        await navigator.clipboard?.writeText(reveal.phone_full);
    };

    if (reveal) {
        return (
            <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-emerald-50">
                    <Phone className="h-5 w-5" aria-hidden="true" />
                    <span className="text-xl font-black tabular-nums">{reveal.phone_formatted}</span>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={copyPhone} className="rounded-md">
                    <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                    Copiar telefone
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <Button
                type="button"
                variant="secondary"
                disabled={disabled || loading}
                onClick={onReveal}
                className="rounded-md"
            >
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                    <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                Revelar telefone completo
            </Button>
            {(errorCode || errorMessage) && (
                <p className="max-w-sm text-center text-sm font-semibold text-red-200" role="alert">
                    {revealErrorMessage(errorCode, errorMessage)}
                </p>
            )}
        </div>
    );
}
