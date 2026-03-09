import { useEffect, useMemo, useState } from "react";

function shouldReduceForHardware(): boolean {
    const deviceMemory = typeof navigator !== "undefined" && "deviceMemory" in navigator
        ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 0)
        : 0;
    const hardwareConcurrency = typeof navigator !== "undefined" && "hardwareConcurrency" in navigator
        ? Number(navigator.hardwareConcurrency ?? 0)
        : 0;

    return (deviceMemory > 0 && deviceMemory <= 4)
        || (hardwareConcurrency > 0 && hardwareConcurrency <= 4);
}

export function usePerformanceMode() {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setPrefersReducedMotion(mediaQuery.matches);

        update();
        mediaQuery.addEventListener?.("change", update);

        return () => {
            mediaQuery.removeEventListener?.("change", update);
        };
    }, []);

    const reducedEffects = useMemo(
        () => prefersReducedMotion || shouldReduceForHardware(),
        [prefersReducedMotion]
    );

    return {
        reducedEffects,
        modeLabel: reducedEffects ? "Performance" : "Premium",
    };
}

export default usePerformanceMode;
