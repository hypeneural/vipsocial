import type { MediaOrientation } from "../types";

export function classifyMediaOrientation(
    width?: number | null,
    height?: number | null
): MediaOrientation {
    if (!width || !height) {
        return "horizontal";
    }

    const ratio = width / height;

    if (ratio > 0.9 && ratio < 1.1) {
        return "squareish";
    }

    return height > width ? "vertical" : "horizontal";
}

export default classifyMediaOrientation;
