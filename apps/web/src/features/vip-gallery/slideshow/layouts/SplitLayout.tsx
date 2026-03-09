import MediaSurface from "../components/MediaSurface";
import type { SlideRuntimeItem } from "../types";
import {
    SLIDESHOW_ACCENT_BAR,
    SLIDESHOW_CARD,
    SLIDESHOW_TEXT_PRIMARY,
    SLIDESHOW_TEXT_SECONDARY,
} from "../design/tokens";
import { resolvePrimaryMediaFit } from "../engine/layoutStrategy";

export function SplitLayout({
    media,
    reducedEffects = false,
}: {
    media: SlideRuntimeItem;
    reducedEffects?: boolean;
}) {
    return (
        <div className="grid min-h-screen gap-6 px-[max(16px,2vw)] py-[max(16px,2vh)] lg:grid-cols-[1.1fr_0.9fr]">
            <div className={`relative overflow-hidden ${reducedEffects ? "rounded-[28px] border border-white/10 bg-black/35 shadow-xl" : SLIDESHOW_CARD}`}>
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-20 bg-[linear-gradient(90deg,_rgba(9,9,11,0)_0%,_rgba(9,9,11,0.28)_100%)] lg:block" />
                <MediaSurface media={media} fit={resolvePrimaryMediaFit("split", media)} className="h-full p-6" reducedEffects={reducedEffects} />
            </div>

            <div className="flex items-end">
                <div className={`w-full bg-white/8 p-8 ${reducedEffects ? "rounded-[28px] border border-white/10 shadow-xl" : SLIDESHOW_CARD}`}>
                    <div className={SLIDESHOW_ACCENT_BAR} />
                    {media.texto_curto ? (
                        <h2 className={`mt-6 ${SLIDESHOW_TEXT_PRIMARY}`}>
                            {media.texto_curto}
                        </h2>
                    ) : null}
                    <p className={`mt-6 ${SLIDESHOW_TEXT_SECONDARY}`}>
                        {media.sender_name || "Convidado da Cobertura VIP"}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SplitLayout;
