import { Trophy } from "lucide-react";
import type {
    WhatsAppRaffleResult,
    WhatsAppRaffleRevealPhoneResult,
} from "@/features/whatsapp-raffle/types";
import { RevealPhoneButton } from "@/features/whatsapp-raffle/components/RevealPhoneButton";
import { WinnerPhoto } from "@/features/whatsapp-raffle/components/WinnerPhoto";

interface WinnerRevealCardProps {
    result: WhatsAppRaffleResult;
    reveal?: WhatsAppRaffleRevealPhoneResult | null;
    revealLoading?: boolean;
    revealErrorCode?: string | null;
    revealErrorMessage?: string | null;
    onRevealPhone: () => void;
}

export function WinnerRevealCard({
    result,
    reveal = null,
    revealLoading = false,
    revealErrorCode,
    revealErrorMessage,
    onRevealPhone,
}: WinnerRevealCardProps) {
    return (
        <div className="relative mx-auto w-full max-w-xl rounded-md border border-white/10 bg-white/[0.06] px-5 py-7 text-center shadow-2xl backdrop-blur">
            <div className="absolute left-4 top-4 rounded-full border border-[#ff8000]/30 bg-[#ff8000]/10 px-3 py-1 text-xs font-bold uppercase tracking-normal text-[#ffb46b]">
                {result.confirmation_code}
            </div>
            <div className="flex justify-center pt-6">
                <WinnerPhoto src={result.photo_url} />
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 text-[#ffb46b]">
                <Trophy className="h-6 w-6" aria-hidden="true" />
                <p className="text-sm font-black uppercase tracking-normal">Participante sorteado</p>
            </div>
            <p className="mt-3 text-5xl font-black tabular-nums text-white sm:text-6xl">
                {result.phone_masked}
            </p>
            <p className="mt-3 text-sm text-white/60">
                {result.eligible_participants_count} participantes elegiveis
            </p>
            <div className="mt-6">
                <RevealPhoneButton
                    disabled={!result.can_reveal_phone}
                    loading={revealLoading}
                    reveal={reveal}
                    errorCode={revealErrorCode}
                    errorMessage={revealErrorMessage}
                    onReveal={onRevealPhone}
                />
            </div>
        </div>
    );
}
