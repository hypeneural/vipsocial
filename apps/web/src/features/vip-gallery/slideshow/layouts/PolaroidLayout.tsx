import MediaSurface from "../components/MediaSurface";
import type { SlideRuntimeItem } from "../types";
import {
    SLIDESHOW_BADGE,
} from "../design/tokens";
import { resolvePrimaryMediaFit } from "../engine/layoutStrategy";

export function PolaroidLayout({
    media,
    reducedEffects = false,
}: {
    media: SlideRuntimeItem;
    reducedEffects?: boolean;
}) {
    const isHighlighted = media.highlight_score >= 80;

    return (
        <div className="flex min-h-screen items-center justify-center px-[max(16px,2vw)] py-[max(16px,2vh)]">
            <div className={`relative w-full max-w-[min(72vw,1080px)] rounded-[18px] bg-[#faf7f2] p-5 text-neutral-950 md:p-7 ${reducedEffects ? "shadow-2xl" : "rotate-[-1deg] shadow-[0_35px_120px_rgba(0,0,0,0.45)]"}`}>
                {isHighlighted ? (
                    <div className={`absolute left-6 top-6 z-20 ${SLIDESHOW_BADGE}`}>
                        Destaque
                    </div>
                ) : null}

                <div className="overflow-hidden rounded-[14px] bg-neutral-200 shadow-inner">
                    <MediaSurface media={media} fit={resolvePrimaryMediaFit("polaroid", media)} className="aspect-[4/3] bg-[#f2ede6]" reducedEffects={reducedEffects} />
                </div>

                <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        {media.texto_curto ? (
                            <p className="max-w-3xl text-[clamp(1.4rem,2.8vw,2.8rem)] font-semibold leading-tight">
                                {media.texto_curto}
                            </p>
                        ) : null}
                        <p className="mt-3 text-[clamp(0.82rem,1vw,1rem)] uppercase tracking-[0.34em] text-neutral-500">
                            {media.sender_name || "Convidado da Cobertura VIP"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PolaroidLayout;
