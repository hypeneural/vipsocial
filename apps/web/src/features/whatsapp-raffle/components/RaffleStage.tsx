import type {
    RaffleUiState,
    WhatsAppRaffleResult,
    WhatsAppRaffleRevealPhoneResult,
} from "@/features/whatsapp-raffle/types";
import { RaffleConfetti } from "@/features/whatsapp-raffle/components/RaffleConfetti";
import { RaffleSpinAnimation } from "@/features/whatsapp-raffle/components/RaffleSpinAnimation";
import { WinnerRevealCard } from "@/features/whatsapp-raffle/components/WinnerRevealCard";

interface RaffleStageProps {
    state: RaffleUiState;
    result: WhatsAppRaffleResult | null;
    reveal: WhatsAppRaffleRevealPhoneResult | null;
    revealLoading: boolean;
    revealErrorCode?: string | null;
    revealErrorMessage?: string | null;
    onRevealPhone: () => void;
}

function stageLabel(state: RaffleUiState): string {
    switch (state) {
        case "requesting":
            return "Consultando grupo...";
        case "preparing":
            return "Preparando participantes...";
        case "shuffling":
            return "Sorteando...";
        case "slowing-down":
            return "Quase la...";
        case "revealing-winner":
            return "Revelando vencedor...";
        case "revealing-phone":
            return "Revelando telefone...";
        default:
            return "";
    }
}

export function RaffleStage({
    state,
    result,
    reveal,
    revealLoading,
    revealErrorCode,
    revealErrorMessage,
    onRevealPhone,
}: RaffleStageProps) {
    const isWinnerVisible = result && ["success", "revealing-phone", "phone-revealed"].includes(state);
    const isSpinning = ["requesting", "preparing", "shuffling", "slowing-down", "revealing-winner"].includes(state);

    return (
        <div className="relative min-h-[360px] w-full">
            {isWinnerVisible ? <RaffleConfetti /> : null}
            <div className="relative z-10 flex min-h-[360px] items-center justify-center px-4">
                {isWinnerVisible && result ? (
                    <WinnerRevealCard
                        result={result}
                        reveal={reveal}
                        revealLoading={revealLoading}
                        revealErrorCode={revealErrorCode}
                        revealErrorMessage={revealErrorMessage}
                        onRevealPhone={onRevealPhone}
                    />
                ) : (
                    <div>
                        <RaffleSpinAnimation state={state} />
                        {isSpinning ? (
                            <p className="mt-5 text-center text-lg font-bold text-white/75" role="status">
                                {stageLabel(state)}
                            </p>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}
