import { AlertTriangle, Loader2 } from "lucide-react";
import type {
    SlideshowConnectionStatus,
    SlideshowRenderableLayout,
} from "../types";
import {
    SLIDESHOW_CAPTION_PANEL,
    SLIDESHOW_TEXT_PRIMARY,
    SLIDESHOW_TEXT_SECONDARY,
} from "../design/tokens";
import BrandingOverlay from "./BrandingOverlay";
import ExpiredScreen from "./ExpiredScreen";
import IdleScreen from "./IdleScreen";
import LayoutRenderer from "./LayoutRenderer";
import PlayerShell from "./PlayerShell";
import TechnicalStatusOverlay from "./TechnicalStatusOverlay";
import { useSlideshowPlayer } from "../hooks/useSlideshowPlayer";
import { usePerformanceMode } from "../hooks/usePerformanceMode";
import {
    resolveRenderableLayout,
    shouldRenderFloatingCaption,
} from "../engine/layoutStrategy";

function FloatingCaption({
    layout,
    text,
    sender,
}: {
    layout: SlideshowRenderableLayout;
    text?: string | null;
    sender?: string | null;
}) {
    if (!shouldRenderFloatingCaption(layout)) {
        return null;
    }

    if (!text && !sender) {
        return null;
    }

    return (
        <div className="pointer-events-none absolute bottom-[max(88px,10vh)] left-1/2 z-20 w-[min(90vw,880px)] -translate-x-1/2">
            <div className={`${SLIDESHOW_CAPTION_PANEL} px-6 py-5`}>
                {text ? (
                    <p className={SLIDESHOW_TEXT_PRIMARY}>
                        {text}
                    </p>
                ) : null}
                {sender ? (
                    <p className={`mt-3 ${SLIDESHOW_TEXT_SECONDARY}`}>
                        {sender}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

function resolveSyncLabel(
    isSyncing: boolean,
    connectionStatus: SlideshowConnectionStatus
): string | undefined {
    if (!isSyncing && connectionStatus === "connected") {
        return "Live";
    }

    return undefined;
}

export function SlideshowRoot({ code }: { code: string }) {
    const { reducedEffects, modeLabel } = usePerformanceMode();
    const {
        state,
        currentItem,
        isSyncing,
        errorMessage,
        connectionStatus,
    } = useSlideshowPlayer(code);
    const activeLayout = currentItem && state.settings
        ? resolveRenderableLayout(state.settings.layout, currentItem)
        : null;

    return (
        <PlayerShell backgroundUrl={state.settings?.background} reducedEffects={reducedEffects}>
            <BrandingOverlay
                showNeon={state.settings?.showNeon ?? false}
                neonText={state.settings?.neonText}
                partnerLogo={state.settings?.partnerLogo}
                syncLabel={resolveSyncLabel(isSyncing, connectionStatus) || (reducedEffects ? modeLabel : undefined)}
                reducedEffects={reducedEffects}
            />
            <TechnicalStatusOverlay
                connectionStatus={connectionStatus}
                isSyncing={isSyncing}
                visible={connectionStatus !== "connected" || isSyncing}
                reducedEffects={reducedEffects}
            />

            {state.status === "expired" ? (
                <ExpiredScreen message={errorMessage || undefined} />
            ) : state.status === "booting" && !currentItem ? (
                <div className="flex min-h-screen items-center justify-center">
                    <div className="rounded-3xl border border-white/10 bg-black/30 px-8 py-6 text-center shadow-2xl backdrop-blur-xl">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-300" />
                        <p className="mt-4 text-lg font-medium">Carregando o telao</p>
                        <p className="mt-2 text-sm text-white/65">
                            Preparando fila local, cache e layout do evento.
                        </p>
                    </div>
                </div>
            ) : currentItem && state.settings ? (
                <>
                    <LayoutRenderer media={currentItem} settings={state.settings} reducedEffects={reducedEffects} />
                    <FloatingCaption
                        layout={activeLayout ?? "fullscreen"}
                        text={currentItem.texto_curto}
                        sender={currentItem.sender_name}
                    />
                </>
            ) : state.status === "error" ? (
                <div className="flex min-h-screen items-center justify-center px-[max(16px,2vw)]">
                    <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-black/35 p-10 text-center shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                        <AlertTriangle className="mx-auto h-12 w-12 text-amber-300" />
                        <h1 className="mt-6 text-[clamp(2rem,3vw,3rem)] font-semibold">
                            Nao foi possivel carregar o telao
                        </h1>
                        <p className="mt-4 text-lg text-white/70">
                            {errorMessage || "A API nao respondeu e nao ha midia local suficiente para iniciar o player."}
                        </p>
                    </div>
                </div>
            ) : (
                <IdleScreen
                    title={state.event?.title}
                    code={state.event?.slideshow_code || code}
                    instructions={state.settings?.instructionsText}
                />
            )}
        </PlayerShell>
    );
}

export default SlideshowRoot;
