import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRaffleAnimationMachine } from "@/features/whatsapp-raffle/hooks/useRaffleAnimationMachine";

describe("useRaffleAnimationMachine", () => {
    it("advances through draw states and completes", () => {
        vi.useFakeTimers();

        const { result } = renderHook(() => useRaffleAnimationMachine());

        act(() => result.current.start());
        expect(result.current.state).toBe("requesting");

        act(() => vi.advanceTimersByTime(150));
        expect(result.current.state).toBe("preparing");

        act(() => vi.advanceTimersByTime(450));
        expect(result.current.state).toBe("shuffling");

        act(() => vi.advanceTimersByTime(1600));
        expect(result.current.state).toBe("slowing-down");

        act(() => vi.advanceTimersByTime(1000));
        expect(result.current.state).toBe("revealing-winner");

        act(() => result.current.complete());
        act(() => vi.advanceTimersByTime(500));
        expect(result.current.state).toBe("success");

        vi.useRealTimers();
    });

    it("can fail, reset and mark phone as revealed", () => {
        const { result } = renderHook(() => useRaffleAnimationMachine());

        act(() => result.current.fail());
        expect(result.current.state).toBe("error");

        act(() => result.current.reset());
        expect(result.current.state).toBe("idle");

        act(() => result.current.revealingPhone());
        expect(result.current.state).toBe("revealing-phone");

        act(() => result.current.phoneRevealed());
        expect(result.current.state).toBe("phone-revealed");
    });
});
