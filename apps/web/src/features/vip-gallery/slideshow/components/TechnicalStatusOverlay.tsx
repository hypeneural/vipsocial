import { Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SlideshowConnectionStatus } from "../types";

function statusDescriptor(connectionStatus: SlideshowConnectionStatus, isSyncing: boolean) {
    if (connectionStatus === "reconnecting") {
        return {
            icon: RefreshCw,
            label: "Reconectando",
            tone: "border-amber-400/30 bg-amber-500/10 text-amber-100",
        };
    }

    if (connectionStatus === "connecting") {
        return {
            icon: Loader2,
            label: "Conectando",
            tone: "border-white/10 bg-black/35 text-white/80",
            spin: true,
        };
    }

    if (connectionStatus === "disconnected" || connectionStatus === "error") {
        return {
            icon: WifiOff,
            label: isSyncing ? "Sincronizando cache" : "Modo offline",
            tone: "border-white/10 bg-black/45 text-white/80",
        };
    }

    if (isSyncing) {
        return {
            icon: RefreshCw,
            label: "Sincronizando",
            tone: "border-sky-400/30 bg-sky-500/10 text-sky-100",
            spin: true,
        };
    }

    if (connectionStatus === "connected") {
        return {
            icon: Wifi,
            label: "Ao vivo",
            tone: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
        };
    }

    return null;
}

export function TechnicalStatusOverlay({
    connectionStatus,
    isSyncing,
    visible,
    reducedEffects = false,
}: {
    connectionStatus: SlideshowConnectionStatus;
    isSyncing: boolean;
    visible: boolean;
    reducedEffects?: boolean;
}) {
    if (!visible) {
        return null;
    }

    const descriptor = statusDescriptor(connectionStatus, isSyncing);

    if (!descriptor) {
        return null;
    }

    const Icon = descriptor.icon;

    return (
        <div className="pointer-events-none absolute right-[max(16px,2vw)] top-[calc(max(16px,2vh)+72px)] z-30">
            <div
                className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.28em]",
                    reducedEffects ? "shadow-lg" : "shadow-[0_16px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl",
                    descriptor.tone
                )}
            >
                <Icon className={cn("h-3.5 w-3.5", descriptor.spin && "animate-spin")} />
                <span>{descriptor.label}</span>
            </div>
        </div>
    );
}

export default TechnicalStatusOverlay;
