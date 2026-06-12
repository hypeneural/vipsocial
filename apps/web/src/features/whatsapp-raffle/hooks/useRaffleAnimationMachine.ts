import { useCallback, useEffect, useRef, useState } from "react";
import { RAFFLE_TIMING } from "@/features/whatsapp-raffle/utils/raffleTiming";
import type { RaffleUiState } from "@/features/whatsapp-raffle/types";

export function useRaffleAnimationMachine() {
    const [state, setState] = useState<RaffleUiState>("idle");
    const timers = useRef<number[]>([]);

    const clearTimers = useCallback(() => {
        timers.current.forEach((timer) => window.clearTimeout(timer));
        timers.current = [];
    }, []);

    const schedule = useCallback((nextState: RaffleUiState, delayMs: number) => {
        const timer = window.setTimeout(() => setState(nextState), delayMs);
        timers.current.push(timer);
    }, []);

    const start = useCallback(() => {
        clearTimers();
        setState("requesting");
        schedule("preparing", RAFFLE_TIMING.preparingAtMs);
        schedule("shuffling", RAFFLE_TIMING.shufflingAtMs);
        schedule("slowing-down", RAFFLE_TIMING.slowingDownAtMs);
        schedule("revealing-winner", RAFFLE_TIMING.revealAtMs);
    }, [clearTimers, schedule]);

    const complete = useCallback(() => {
        schedule("success", RAFFLE_TIMING.revealWinnerMs);
    }, [schedule]);

    const fail = useCallback(() => {
        clearTimers();
        setState("error");
    }, [clearTimers]);

    const empty = useCallback(() => {
        clearTimers();
        setState("empty");
    }, [clearTimers]);

    const reset = useCallback(() => {
        clearTimers();
        setState("idle");
    }, [clearTimers]);

    const revealingPhone = useCallback(() => setState("revealing-phone"), []);
    const phoneRevealed = useCallback(() => setState("phone-revealed"), []);

    useEffect(() => clearTimers, [clearTimers]);

    return {
        state,
        start,
        complete,
        fail,
        empty,
        reset,
        revealingPhone,
        phoneRevealed,
    };
}
