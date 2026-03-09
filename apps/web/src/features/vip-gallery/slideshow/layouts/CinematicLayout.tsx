import MediaSurface from "../components/MediaSurface";
import type { SlideRuntimeItem } from "../types";
import {
    SLIDESHOW_CARD,
    SLIDESHOW_READING_GRADIENT,
} from "../design/tokens";
import { resolvePrimaryMediaFit } from "../engine/layoutStrategy";

export function CinematicLayout({
    media,
    reducedEffects = false,
}: {
    media: SlideRuntimeItem;
    reducedEffects?: boolean;
}) {
    return (
        <div className="relative flex min-h-screen items-center justify-center px-[max(16px,2vw)] py-[max(16px,2vh)]">
            <div className="absolute inset-0 overflow-hidden">
                <MediaSurface
                    media={media}
                    fit="cover"
                    imageClassName={reducedEffects ? "scale-105 opacity-55 blur-lg" : "scale-110 opacity-60 blur-2xl"}
                    reducedEffects={reducedEffects}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(9,9,11,0.25)_0%,_rgba(9,9,11,0.75)_100%)]" />
            </div>

            <div className={`relative flex h-[calc(100vh-max(48px,6vh))] w-full max-w-[80vw] items-center justify-center rounded-[40px] border border-white/15 bg-white/5 p-6 ${reducedEffects ? "shadow-2xl" : "shadow-[0_35px_140px_rgba(0,0,0,0.45)] backdrop-blur-md"}`}>
                <div className={`relative h-full w-full overflow-hidden bg-black/40 ${reducedEffects ? "rounded-[28px] border border-white/10 shadow-xl" : SLIDESHOW_CARD}`}>
                    <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/3 ${SLIDESHOW_READING_GRADIENT}`} />
                    <MediaSurface media={media} fit={resolvePrimaryMediaFit("cinematic", media)} reducedEffects={reducedEffects} />
                </div>
            </div>
        </div>
    );
}

export default CinematicLayout;
