import classifyMediaOrientation from "./orientation";
import type { MediaOrientation, SlideRuntimeItem } from "../types";

export const SLIDESHOW_CACHE_NAMES = {
    shell: "slideshow-shell-v1",
    branding: "slideshow-branding-v1",
    images: "slideshow-images-v1",
    videos: "slideshow-videos-v1",
    api: "slideshow-api-v1",
} as const;

async function ensureResponseCached(url: string, cacheName: string): Promise<Response> {
    if (typeof caches === "undefined") {
        const response = await fetch(url, { credentials: "same-origin" });

        if (!response.ok) {
            throw new Error(`Falha ao baixar mídia: ${response.status}`);
        }

        return response;
    }

    const cache = await caches.open(cacheName);
    const cached = await cache.match(url);

    if (cached) {
        return cached;
    }

    const response = await fetch(url, { credentials: "same-origin" });

    if (!response.ok) {
        throw new Error(`Falha ao baixar mídia: ${response.status}`);
    }

    await cache.put(url, response.clone());

    return response;
}

async function removeFromCacheNames(url: string, cacheNames: string[]): Promise<void> {
    if (typeof caches === "undefined") {
        return;
    }

    await Promise.all(cacheNames.map(async (cacheName) => {
        const cache = await caches.open(cacheName);
        await cache.delete(url);
    }));
}

async function loadImageMetadata(response: Response): Promise<{
    width: number;
    height: number;
    orientation: MediaOrientation;
}> {
    const blob = await response.clone().blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
        const image = new Image();
        image.decoding = "async";
        image.src = objectUrl;

        if (typeof image.decode === "function") {
            await image.decode();
        } else {
            await new Promise<void>((resolve, reject) => {
                image.onload = () => resolve();
                image.onerror = () => reject(new Error("Falha ao decodificar imagem"));
            });
        }

        return {
            width: image.naturalWidth,
            height: image.naturalHeight,
            orientation: classifyMediaOrientation(image.naturalWidth, image.naturalHeight),
        };
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

export async function prefetchBrandingAsset(url?: string | null): Promise<void> {
    if (!url) {
        return;
    }

    try {
        await ensureResponseCached(url, SLIDESHOW_CACHE_NAMES.branding);
    } catch {
        // Branding não pode bloquear o player.
    }
}

export async function prefetchImageAsset(url: string): Promise<{
    width: number;
    height: number;
    orientation: MediaOrientation;
    cachedAt: string;
}> {
    const response = await ensureResponseCached(url, SLIDESHOW_CACHE_NAMES.images);
    const metadata = await loadImageMetadata(response);

    return {
        ...metadata,
        cachedAt: new Date().toISOString(),
    };
}

export async function prefetchVideoAsset(url: string): Promise<{ cachedAt: string }> {
    await ensureResponseCached(url, SLIDESHOW_CACHE_NAMES.videos);

    return {
        cachedAt: new Date().toISOString(),
    };
}

export async function prefetchSlideAsset(item: Pick<SlideRuntimeItem, "type" | "url">): Promise<{
    width?: number;
    height?: number;
    orientation?: MediaOrientation;
    cachedAt: string;
}> {
    if (item.type === "video") {
        return prefetchVideoAsset(item.url);
    }

    return prefetchImageAsset(item.url);
}

export async function removeCachedSlideAsset(url?: string | null): Promise<void> {
    if (!url) {
        return;
    }

    await removeFromCacheNames(url, [
        SLIDESHOW_CACHE_NAMES.images,
        SLIDESHOW_CACHE_NAMES.videos,
    ]);
}
