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
}: {
    layout: SlideshowRenderableLayout;
    text?: string | null;
}) {
    if (!shouldRenderFloatingCaption(layout)) {
        return null;
    }

    if (!text) {
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
                showSenderCredit={state.settings?.showSenderCredit ?? false}
                senderCredit={currentItem?.sender_name}
                syncLabel={resolveSyncLabel(isSyncing, connectionStatus) || (reducedEffects ? modeLabel : undefined)}
                reducedEffects={reducedEffects}
            />
            <TechnicalStatusOverlay
                connectionStatus={connectionStatus}
                isSyncing={isSyncing}
                visible={connectionStatus !== "connected" || isSyncing}
                reducedEffects={reducedEffects}
            />

            {state.status === "expired" || state.status === "archived" || state.status === "disabled" ? (
                <ExpiredScreen
                    title={
                        state.status === "disabled"
                            ? "Este telao esta desativado"
                            : state.status === "archived"
                                ? "Este telao foi arquivado"
                                : undefined
                    }
                    message={
                        errorMessage
                        || (
                            state.status === "disabled"
                                ? "O operador desativou a exibicao publica deste evento."
                                : state.status === "archived"
                                    ? "A cobertura VIP foi arquivada e o player saiu de operacao."
                                    : undefined
                        )
                    }
                />
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
            ) : state.status === "paused" && !currentItem ? (
                <ExpiredScreen
                    title="Telao pausado"
                    message="O operador pausou temporariamente a exibicao. As novas fotos continuam sendo sincronizadas e entram na fila quando o player voltar para ativo."
                />
            ) : currentItem && state.settings ? (
                <>
                    <LayoutRenderer media={currentItem} settings={state.settings} reducedEffects={reducedEffects} />
                    <FloatingCaption
                        layout={activeLayout ?? "fullscreen"}
                        text={currentItem.texto_curto}
                    />
                    {state.status === "paused" ? (
                        <div className="pointer-events-none absolute inset-x-0 top-[max(16px,2vh)] z-30 flex justify-center px-[max(16px,2vw)]">
                            <div className="rounded-full border border-amber-400/30 bg-amber-500/15 px-5 py-2 text-sm font-medium uppercase tracking-[0.3em] text-amber-100 shadow-[0_16px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                                Telao pausado
                            </div>
                        </div>
                    ) : null}
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
