import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SLIDESHOW_OVERLAY_GRADIENT } from "../design/tokens";

export function PlayerShell({
    backgroundUrl,
    children,
    className,
    reducedEffects = false,
}: {
    backgroundUrl?: string | null;
    children: ReactNode;
    className?: string;
    reducedEffects?: boolean;
}) {
    return (
        <div className={cn("relative min-h-screen overflow-hidden bg-neutral-950 text-white", className)}>
            {backgroundUrl ? (
                <>
                    <div
                        className={cn("absolute inset-0 bg-cover bg-center", reducedEffects ? "opacity-30" : "opacity-40")}
                        style={{ backgroundImage: `url(${backgroundUrl})` }}
                    />
                    <div className={cn("absolute inset-0 bg-neutral-950/70", reducedEffects ? "" : "backdrop-blur-sm")} />
                </>
            ) : (
                <>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.28),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.22),_transparent_28%),linear-gradient(180deg,_#09090b_0%,_#111827_100%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(255,255,255,0.03)_0%,_transparent_30%,_transparent_70%,_rgba(255,255,255,0.03)_100%)]" />
                </>
            )}

            <div className={cn("absolute inset-0 bg-black/20", SLIDESHOW_OVERLAY_GRADIENT)} />
            <div className="relative min-h-screen">{children}</div>
        </div>
    );
}

export default PlayerShell;
