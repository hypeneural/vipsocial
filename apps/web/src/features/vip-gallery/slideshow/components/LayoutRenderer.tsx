import { AnimatePresence, motion } from "framer-motion";
import type {
    SlideRuntimeItem,
    SlideSettings,
    SlideshowRenderableLayout,
} from "../types";
import CinematicLayout from "../layouts/CinematicLayout";
import FullscreenLayout from "../layouts/FullscreenLayout";
import PolaroidLayout from "../layouts/PolaroidLayout";
import SplitLayout from "../layouts/SplitLayout";
import { resolveRenderableLayout } from "../engine/layoutStrategy";

export function renderLayout(
    layout: SlideshowRenderableLayout,
    media: SlideRuntimeItem,
    reducedEffects = false
) {
    switch (layout) {
        case "cinematic":
            return <CinematicLayout media={media} reducedEffects={reducedEffects} />;
        case "split":
            return <SplitLayout media={media} reducedEffects={reducedEffects} />;
        case "polaroid":
            return <PolaroidLayout media={media} reducedEffects={reducedEffects} />;
        case "fullscreen":
        default:
            return <FullscreenLayout media={media} reducedEffects={reducedEffects} />;
    }
}

export function LayoutRenderer({
    media,
    settings,
    reducedEffects = false,
}: {
    media: SlideRuntimeItem;
    settings: SlideSettings;
    reducedEffects?: boolean;
}) {
    const resolvedLayout = resolveRenderableLayout(settings.layout, media);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={`${resolvedLayout}:${media.id}:${media.url}`}
                initial={reducedEffects ? { opacity: 0 } : { opacity: 0, scale: 0.996 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reducedEffects ? 0.2 : 0.4, ease: "easeOut" }}
                className="absolute inset-0"
            >
                {renderLayout(resolvedLayout, media, reducedEffects)}
            </motion.div>
        </AnimatePresence>
    );
}

export default LayoutRenderer;
