import type {
    SlideRuntimeItem,
    SlideshowLayout,
    SlideshowRenderableLayout,
} from "../types";

function hasStructuredText(media: SlideRuntimeItem): boolean {
    return Boolean(media.texto_curto?.trim());
}

function isHighlighted(media: SlideRuntimeItem): boolean {
    return media.highlight_score >= 80;
}

export function resolveRenderableLayout(
    requestedLayout: SlideshowLayout,
    media: SlideRuntimeItem
): SlideshowRenderableLayout {
    if (requestedLayout !== "auto") {
        return requestedLayout;
    }

    const withText = hasStructuredText(media);
    const highlighted = isHighlighted(media);

    switch (media.orientation) {
        case "vertical":
            if (withText) {
                return "split";
            }

            if (highlighted) {
                return "polaroid";
            }

            return "cinematic";

        case "squareish":
            if (highlighted) {
                return "polaroid";
            }

            return "fullscreen";

        case "horizontal":
        default:
            if (highlighted && !withText) {
                return "cinematic";
            }

            return "fullscreen";
    }
}

export function resolvePrimaryMediaFit(
    layout: SlideshowRenderableLayout,
    media: SlideRuntimeItem
): "contain" | "cover" {
    if (layout === "split" && media.orientation === "horizontal") {
        return "cover";
    }

    return "contain";
}

export function shouldRenderFloatingCaption(layout: SlideshowRenderableLayout): boolean {
    return layout === "fullscreen" || layout === "cinematic";
}
