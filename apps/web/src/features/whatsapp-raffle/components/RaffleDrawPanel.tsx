import { useState } from "react";
import { BigDrawButton } from "@/features/whatsapp-raffle/components/BigDrawButton";
import { RaffleEmptyState } from "@/features/whatsapp-raffle/components/RaffleEmptyState";
import { RaffleErrorState } from "@/features/whatsapp-raffle/components/RaffleErrorState";
import { RaffleStage } from "@/features/whatsapp-raffle/components/RaffleStage";
import { useRaffleAnimationMachine } from "@/features/whatsapp-raffle/hooks/useRaffleAnimationMachine";
import { useRevealWhatsAppRafflePhone } from "@/features/whatsapp-raffle/hooks/useRevealWhatsAppRafflePhone";
import { useWhatsAppRaffleDraw } from "@/features/whatsapp-raffle/hooks/useWhatsAppRaffleDraw";
import { RAFFLE_TIMING } from "@/features/whatsapp-raffle/utils/raffleTiming";
import type {
    WhatsAppRaffleErrorPayload,
    WhatsAppRaffleResult,
    WhatsAppRaffleRevealPhoneResult,
} from "@/features/whatsapp-raffle/types";

function apiError(error: unknown): WhatsAppRaffleErrorPayload {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = (error as { response?: { data?: WhatsAppRaffleErrorPayload } }).response;

        return response?.data ?? {};
    }

    return {};
}

function isEmptyError(error: WhatsAppRaffleErrorPayload): boolean {
    return error.code === "WHATSAPP_RAFFLE_NO_ELIGIBLE_PARTICIPANTS";
}

export function RaffleDrawPanel() {
    const machine = useRaffleAnimationMachine();
    const drawMutation = useWhatsAppRaffleDraw();
    const revealMutation = useRevealWhatsAppRafflePhone();
    const [result, setResult] = useState<WhatsAppRaffleResult | null>(null);
    const [reveal, setReveal] = useState<WhatsAppRaffleRevealPhoneResult | null>(null);
    const [drawError, setDrawError] = useState<WhatsAppRaffleErrorPayload | null>(null);
    const [revealError, setRevealError] = useState<WhatsAppRaffleErrorPayload | null>(null);

    const draw = async () => {
        setResult(null);
        setReveal(null);
        setDrawError(null);
        setRevealError(null);
        machine.start();

        try {
            const startedAt = Date.now();
            const nextResult = await drawMutation.mutateAsync();
            const elapsed = Date.now() - startedAt;
            const remaining = Math.max(0, RAFFLE_TIMING.minTotalMs - elapsed);

            window.setTimeout(() => {
                setResult(nextResult);
                machine.complete();
            }, remaining);
        } catch (error) {
            const payload = apiError(error);
            setDrawError(payload);
            if (isEmptyError(payload)) {
                machine.empty();
                return;
            }
            machine.fail();
        }
    };

    const revealPhone = async () => {
        if (!result) return;

        setRevealError(null);
        machine.revealingPhone();

        try {
            const nextReveal = await revealMutation.mutateAsync(result.draw_id);
            setReveal(nextReveal);
            machine.phoneRevealed();
        } catch (error) {
            setRevealError(apiError(error));
            machine.complete();
        }
    };

    const loading = ["requesting", "preparing", "shuffling", "slowing-down", "revealing-winner"].includes(machine.state);

    return (
        <div className="mx-auto w-full max-w-5xl px-4 pb-10">
            <RaffleStage
                state={machine.state}
                result={result}
                reveal={reveal}
                revealLoading={revealMutation.isPending}
                revealErrorCode={revealError?.code ?? null}
                revealErrorMessage={revealError?.message ?? null}
                onRevealPhone={revealPhone}
            />

            <div className="mt-8 flex justify-center">
                <BigDrawButton disabled={loading || revealMutation.isPending} loading={loading} onClick={draw} />
            </div>

            <div className="mx-auto mt-6 max-w-2xl">
                {machine.state === "empty" ? <RaffleEmptyState /> : null}
                {machine.state === "error" ? (
                    <RaffleErrorState message={drawError?.message} onRetry={draw} />
                ) : null}
            </div>
        </div>
    );
}
