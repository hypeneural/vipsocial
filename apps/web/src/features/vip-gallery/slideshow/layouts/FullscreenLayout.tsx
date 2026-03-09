import MediaSurface from "../components/MediaSurface";
import type { SlideRuntimeItem } from "../types";
import {
    SLIDESHOW_CARD,
    SLIDESHOW_READING_GRADIENT,
} from "../design/tokens";
import { resolvePrimaryMediaFit } from "../engine/layoutStrategy";

export function FullscreenLayout({
    media,
    reducedEffects = false,
}: {
    media: SlideRuntimeItem;
    reducedEffects?: boolean;
}) {
    return (
        <div className="relative flex min-h-screen items-center justify-center px-[max(16px,2vw)] py-[max(16px,2vh)]">
            <div className={`absolute inset-0 overflow-hidden opacity-30 ${reducedEffects ? "blur-xl" : "blur-3xl"}`}>
                <MediaSurface media={media} fit="cover" imageClassName="scale-110" reducedEffects={reducedEffects} />
            </div>

            <div className={`relative flex h-[calc(100vh-max(32px,4vh))] w-full items-center justify-center bg-black/45 ${reducedEffects ? "rounded-[28px] border border-white/10 shadow-xl" : SLIDESHOW_CARD}`}>
                <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-1/3 ${SLIDESHOW_READING_GRADIENT}`} />
                <MediaSurface media={media} fit={resolvePrimaryMediaFit("fullscreen", media)} className="p-6" reducedEffects={reducedEffects} />
            </div>
        </div>
    );
}

export default FullscreenLayout;
